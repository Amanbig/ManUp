import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { apiKeys } from "../models/apiKeys.js";
import { generateApiKey, hashApiKey } from "../utils/crypto.js";
import { eq, and } from "drizzle-orm";

/**
 * Create a new API Key for the authenticated user.
 * Displays the plaintext key exactly once.
 */
export const createApiKey = async (req: Request, res: Response) => {
    try {
        const { name, expiresInDays, rateLimit } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!name) {
            return res.status(400).json({ detail: "API key name is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const rawKey = generateApiKey();
        const hashedKey = hashApiKey(rawKey);

        let expiresAt: Date | null = null;
        if (expiresInDays && typeof expiresInDays === "number") {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const limitValue = typeof rateLimit === "number" ? rateLimit : 60;

        const [apiKeyRecord] = await database
            .insert(apiKeys)
            .values({
                name,
                organization_id: user.organizationId,
                user_id: user.id,
                key_hash: hashedKey,
                expiresAt,
                rateLimit: limitValue
            })
            .returning();

        if (!apiKeyRecord) {
            return res.status(500).json({ detail: "Failed to generate API Key" });
        }

        return res.status(201).json({
            id: apiKeyRecord.id,
            name: apiKeyRecord.name,
            apiKey: rawKey, // Shown once
            createdAt: apiKeyRecord.createdAt,
            expiresAt: apiKeyRecord.expiresAt,
            rateLimit: apiKeyRecord.rateLimit,
            requestCount: apiKeyRecord.requestCount,
            lastUsedAt: apiKeyRecord.lastUsedAt
        });
    } catch (error) {
        return res.status(500).json({ detail: "Failed to create API key" });
    }
};

/**
 * List all API Keys for the authenticated user.
 */
export const listApiKeys = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const keys = await database
            .select({
                id: apiKeys.id,
                name: apiKeys.name,
                createdAt: apiKeys.createdAt,
                expiresAt: apiKeys.expiresAt,
                rateLimit: apiKeys.rateLimit,
                requestCount: apiKeys.requestCount,
                lastUsedAt: apiKeys.lastUsedAt
            })
            .from(apiKeys)
            .where(and(eq(apiKeys.user_id, user.id), eq(apiKeys.organization_id, user.organizationId)));

        return res.json(keys);
    } catch (error) {
        return res.status(500).json({ detail: "Failed to retrieve API keys" });
    }
};

/**
 * Delete (revoke) an API Key.
 */
export const deleteApiKey = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "API key ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const deleted = await database
            .delete(apiKeys)
            .where(and(
                eq(apiKeys.id as any, id),
                eq(apiKeys.user_id as any, user.id),
                eq(apiKeys.organization_id as any, user.organizationId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "API key not found" });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ detail: "Failed to delete API key" });
    }
};
