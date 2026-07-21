import type { Request, Response, NextFunction } from 'express';

const ipCache = new Map<string, { count: number; windowStart: number }>();

// Cleanup stale entries every 5 minutes to avoid memory leaks
setInterval(
  () => {
    const cutoff = Date.now() - 60_000;
    for (const [ip, record] of ipCache.entries()) {
      if (record.windowStart < cutoff) ipCache.delete(ip);
    }
  },
  5 * 60 * 1000,
);

/**
 * Memory-based rate limiter middleware.
 * @param maxRequests Maximum allowed requests in the window
 * @param windowMs Window size in milliseconds
 */
export const authRateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = ipCache.get(ip);

    if (!record || now - record.windowStart > windowMs) {
      ipCache.set(ip, { count: 1, windowStart: now });
      next();
    } else {
      if (record.count >= maxRequests) {
        return res.status(429).json({
          detail: 'Too many login or registration attempts. Please try again in a minute.',
        });
      }
      record.count += 1;
      next();
    }
  };
};
