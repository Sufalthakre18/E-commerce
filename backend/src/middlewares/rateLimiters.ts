
import rateLimit from 'express-rate-limit';

// Rate limiter for sending OTP - limit by IP and email
export const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for verifying OTP - limit by IP and email
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification attempts per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email-specific rate limiter for sending OTP
export const sendOtpEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each email to 3 OTP requests per hour
  keyGenerator: (req) => req.body.email, // Use email as the key
  message: {
    success: false,
    message: 'Too many OTP requests for this email, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email-specific rate limiter for verifying OTP
export const verifyOtpEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => req.body.email, // Use email as the key
  message: {
    success: false,
    message: 'Too many verification attempts for this email, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});