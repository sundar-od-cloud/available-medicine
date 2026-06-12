import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import {
  generateTokenPair,
  storeRefreshToken,
  invalidateRefreshToken,
  invalidateAllUserTokens,
  isRefreshTokenValid,
  verifyRefreshToken,
} from '../utils/jwt';
import { generateOTP, storeOTP, sendOTP, verifyOTP } from '../services/otpService';
import { sendWelcomeEmail } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['user', 'pharmacy_owner']).default('user'),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    if (!data.email && !data.phone) {
      res.status(400).json({ success: false, message: 'Email or phone required' });
      return;
    }

    // Check existing user
    if (data.email) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existing.rows.length > 0) {
        res.status(409).json({ success: false, message: 'Email already registered' });
        return;
      }
    }
    if (data.phone) {
      const existing = await query('SELECT id FROM users WHERE phone = $1', [data.phone]);
      if (existing.rows.length > 0) {
        res.status(409).json({ success: false, message: 'Phone already registered' });
        return;
      }
    }

    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 12);
    }

    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, is_verified, created_at`,
      [data.name, data.email || null, data.phone || null, passwordHash, data.role]
    );

    const user = result.rows[0];

    if (data.email) {
      await sendWelcomeEmail(data.email, data.name);
    }

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email || '', user.role);
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    if (!data.email && !data.phone) {
      res.status(400).json({ success: false, message: 'Email or phone required' });
      return;
    }

    let result;
    if (data.email) {
      result = await query('SELECT * FROM users WHERE email = $1', [data.email]);
    } else {
      result = await query('SELECT * FROM users WHERE phone = $1', [data.phone]);
    }

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    if (data.password && user.password_hash) {
      const isValid = await bcrypt.compare(data.password, user.password_hash);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
    } else if (data.password && !user.password_hash) {
      res.status(401).json({ success: false, message: 'Password login not available. Use OTP.' });
      return;
    }

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email || '', user.role);
    await storeRefreshToken(user.id, refreshToken);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      return;
    }
    next(error);
  }
};

export const sendOTPHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number required' });
      return;
    }

    const otp = generateOTP();
    await storeOTP(phone, otp);
    await sendOTP(phone, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTPHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP required' });
      return;
    }

    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    // Mark user as verified or create new user
    let userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user = userResult.rows[0];

    if (!user) {
      const newUser = await query(
        'INSERT INTO users (name, phone, is_verified) VALUES ($1, $2, TRUE) RETURNING *',
        [`User ${phone.slice(-4)}`, phone]
      );
      user = newUser.rows[0];
    } else {
      await query('UPDATE users SET is_verified = TRUE WHERE phone = $1', [phone]);
      user.is_verified = true;
    }

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email || '', user.role);
    await storeRefreshToken(user.id, refreshToken);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    // Verify token signature
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    // Check if token exists in DB
    const isValid = await isRefreshTokenValid(token);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Refresh token expired or revoked' });
      return;
    }

    // Rotate token
    await invalidateRefreshToken(token);
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      payload.userId,
      payload.email,
      payload.role
    );
    await storeRefreshToken(payload.userId, newRefreshToken);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await invalidateRefreshToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.userId) {
      await invalidateAllUserTokens(req.user.userId);
    }
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role, location_lat, location_lng, is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user?.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, location_lat, location_lng } = req.body;
    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           location_lat = COALESCE($2, location_lat),
           location_lng = COALESCE($3, location_lng)
       WHERE id = $4
       RETURNING id, name, email, phone, role, location_lat, location_lng, is_verified`,
      [name || null, location_lat ?? null, location_lng ?? null, req.user?.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }

    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user?.userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    if (!user.password_hash) {
      res.status(400).json({ success: false, message: 'No password set. Use OTP login.' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user?.userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
