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

const apiKeyRateLimitCache = new Map<string, { count: number; windowStart: number }>();

// Cleanup stale API key rate-limit entries every 5 minutes
setInterval(
  () => {
    const cutoff = Date.now() - 60_000;
    for (const [key, record] of apiKeyRateLimitCache.entries()) {
      if (record.windowStart < cutoff) apiKeyRateLimitCache.delete(key);
    }
  },
  5 * 60 * 1000,
);

/**
 * Checks rate limit for a programmatic API key.
 * @param keyId Unique API key identifier
 * @param limit Configured requests per minute, or 0/null/undefined for default/none
 * @returns boolean true if request is allowed, false if limit exceeded
 */
export const checkApiKeyRateLimit = (keyId: string, limit: number | null | undefined): boolean => {
  if (limit === null || limit === undefined || limit > 0) {
    const activeLimit = limit !== null && limit !== undefined ? limit : 60;
    const now = Date.now();
    const record = apiKeyRateLimitCache.get(keyId);

    if (!record || now - record.windowStart > 60000) {
      apiKeyRateLimitCache.set(keyId, { count: 1, windowStart: now });
    } else {
      if (record.count >= activeLimit) {
        return false;
      }
      record.count += 1;
    }
  }
  return true;
};
