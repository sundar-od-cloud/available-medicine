import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const OTP_EXPIRY_MINUTES = 10;

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  // Invalidate existing OTPs for this phone
  await query('UPDATE otp_tokens SET used = TRUE WHERE phone = $1 AND used = FALSE', [phone]);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await query(
    'INSERT INTO otp_tokens (phone, otp, expires_at) VALUES ($1, $2, $3)',
    [phone, otp, expiresAt]
  );
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM otp_tokens
     WHERE phone = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Mark as used
  await query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [result.rows[0].id]);
  return true;
};

export const sendOTP = async (phone: string, otp: string): Promise<void> => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioAccountSid && twilioAuthToken && twilioPhone) {
    try {
      const twilio = require('twilio');
      const client = twilio(twilioAccountSid, twilioAuthToken);
      await client.messages.create({
        body: `Your Available Medicine verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        from: twilioPhone,
        to: phone,
      });
      console.log(`OTP sent via Twilio to ${phone}`);
    } catch (error) {
      console.error('Twilio error:', error);
      // Fallback to console log in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
      } else {
        throw new AppError('Failed to send OTP. Please try again.', 500);
      }
    }
  } else {
    // Development mode: just log the OTP
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }
};

export const cleanupExpiredOTPs = async (): Promise<void> => {
  await query('DELETE FROM otp_tokens WHERE expires_at < NOW() OR used = TRUE');
};
