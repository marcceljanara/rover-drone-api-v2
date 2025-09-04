// eslint-disable-next-line import/no-extraneous-dependencies
import rateLimit from 'express-rate-limit';

const rateLimiter = (minutes, maxRequests) => {
  if (process.env.NODE_ENV !== 'production') {
    // di dev/test, langsung bypass
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: minutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: 'draft-8', // best practice
    legacyHeaders: false, // jangan kirim header X-RateLimit lama
    message: `Too many requests from this IP, please try again after ${minutes} minutes`,
  });
};

export default rateLimiter;
