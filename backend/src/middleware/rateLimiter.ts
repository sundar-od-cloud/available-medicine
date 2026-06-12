import rateLimit from 'express-rate-limit';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Auth endpoints - stricter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again after 15 minutes',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// OTP limiter - very strict
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 1 hour',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Search endpoint limiter
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many search requests, please slow down',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests, please try again later',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});
