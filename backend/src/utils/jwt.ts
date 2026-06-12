import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const signAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } as SignOptions
  );
};

export const signRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const generateTokenPair = (userId: string, email: string, role: string) => {
  const payload = { userId, email, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
};

export const invalidateRefreshToken = async (token: string): Promise<void> => {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

export const invalidateAllUserTokens = async (userId: string): Promise<void> => {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

export const isRefreshTokenValid = async (token: string): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  return result.rows.length > 0;
};
