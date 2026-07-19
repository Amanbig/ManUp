import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { hashApiKey } from "../utils/crypto.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import { users } from "../models/users.js";
import { apiKeys } from "../models/apiKeys.js";

// Extend Request type to include user details
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                organizationId: string;
            };
        }
    }
}

const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

// Cleanup stale rate-limit entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
    const cutoff = Date.now() - 120_000; // 2 minutes
    for (const [key, record] of rateLimitCache.entries()) {
        if (record.windowStart < cutoff) rateLimitCache.delete(key);
    }
}, 5 * 60 * 1000);

/**
 * Authentication middleware that validates requests using either:
 * 1. An API Key via 'X-API-Key' or 'Authorization: Bearer mp_...' header
 * 2. A JWT Token via 'Authorization: Bearer <token>' header
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let userId: string | undefined;
        let organizationId: string | undefined;

        // 1. Extract API Key if provided
        let apiKey: string | undefined = req.headers["x-api-key"] as string;
        const authHeader = req.headers["authorization"];

        if (!apiKey && authHeader && authHeader.startsWith("Bearer mp_")) {
            apiKey = authHeader.substring(7);
        }

        if (apiKey) {
            const hashedKey = hashApiKey(apiKey);
            const database = db();
            if (!database) {
                return res.status(503).json({ detail: "Database unavailable" });
            }

            const keyRecord = await database
                .select()
                .from(apiKeys)
                .where(eq(apiKeys.key_hash, hashedKey))
                .limit(1);

            if (keyRecord.length > 0 && keyRecord[0]) {
                const key = keyRecord[0];
                if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
                    return res.status(401).json({ detail: "API key has expired" });
                }

                // Rate limiting check
                const limit = key.rateLimit;
                if (limit === null || limit === undefined || limit > 0) {
                    const activeLimit = limit !== null && limit !== undefined ? limit : 60;
                    const now = Date.now();
                    const cacheKey = key.id;
                    const record = rateLimitCache.get(cacheKey);

                    if (!record || (now - record.windowStart) > 60000) {
                        // Start new window
                        rateLimitCache.set(cacheKey, { count: 1, windowStart: now });
                    } else {
                        if (record.count >= activeLimit) {
                            return res.status(429).json({ detail: "Too many requests. Rate limit exceeded." });
                        }
                        record.count += 1;
                    }
                }

                // Update metrics asynchronously in the background
                database
                    .update(apiKeys)
                    .set({
                        requestCount: (key.requestCount || 0) + 1,
                        lastUsedAt: new Date()
                    })
                    .where(eq(apiKeys.id, key.id))
                    .catch((err) => console.error("Failed to update API key metrics:", err));

                userId = key.user_id;
                organizationId = key.organization_id;
            } else {
                return res.status(401).json({ detail: "Invalid API Key" });
            }
        }
        // 2. Extract and verify JWT Token if no API key is provided
        // Cookie takes priority (httpOnly — XSS-safe). Authorization header is a fallback for API consumers.
        else if (req.cookies?.authToken || (authHeader && authHeader.startsWith("Bearer "))) {
            const token = req.cookies?.authToken || authHeader!.substring(7);
            const decoded = verifyToken(token);
            if (decoded) {
                userId = decoded.userId;
                organizationId = decoded.organizationId;
            } else {
                return res.status(401).json({ detail: "Invalid or expired session token" });
            }
        }

        if (!userId || !organizationId) {
            return res.status(401).json({ detail: "Authentication required" });
        }

        req.user = {
            id: userId,
            organizationId: organizationId
        };

        next();
    } catch (error) {
        return res.status(500).json({ detail: "Authentication server error" });
    }
};
