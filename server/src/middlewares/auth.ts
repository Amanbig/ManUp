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
                userId = key.user_id;
                organizationId = key.organization_id;
            } else {
                return res.status(401).json({ detail: "Invalid API Key" });
            }
        }
        // 2. Extract and verify JWT Token if no API key is provided
        else if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
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
