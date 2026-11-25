const rateLimit = require('express-rate-limit');

// Demo mode: one presenter logs in/out many times as different roles, so the
// production limits would lock them out mid-demo. Multiply limits generously.
const factor = process.env.DEMO_MODE === 'true' ? 50 : 1;

// Global limiter — loose cap on all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 * factor,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Auth limiter — for login, register, reset-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 * factor,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait 15 minutes and try again.' }
});

// OTP limiter — strict cap to prevent email abuse
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3 * factor,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait 10 minutes before requesting again.' }
});

module.exports = { globalLimiter, authLimiter, otpLimiter };
