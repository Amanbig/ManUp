import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { secrets } from "../models/secrets.js";
import { environments } from "../models/environments.js";
import { decryptDEK, encryptSecret, decryptSecret } from "../utils/crypto.js";
import { eq, and } from "drizzle-orm";

/**
 * Get all decrypted secrets for a given environment.
 */
export const getSecrets = async (req: Request, res: Response) => {
    try {
        const { environmentId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!environmentId) {
            return res.status(400).json({ detail: "Environment ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // 1. Fetch environment and verify organization ownership
        const envRecord = await database
            .select()
            .from(environments)
            .where(and(
                eq(environments.id as any, environmentId),
                eq(environments.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (envRecord.length === 0 || !envRecord[0]) {
            return res.status(403).json({ detail: "Access to environment denied or environment not found" });
        }

        const env = envRecord[0];

        // 2. Decrypt DEK using MASTER_KEY
        const dek = decryptDEK(env.encrypted_dek);

        // 3. Fetch all secrets for this environment
        const secretRecords = await database
            .select()
            .from(secrets)
            .where(eq(secrets.environment_id as any, environmentId));

        // 4. Decrypt secret values using DEK
        const decryptedSecrets = secretRecords.map((secret) => {
            let decryptedValue = "";
            try {
                decryptedValue = decryptSecret(secret.value, dek);
            } catch (err) {
                decryptedValue = "[Decryption Failed]";
            }
            return {
                id: secret.id,
                name: secret.name,
                key: secret.key,
                value: decryptedValue,
                createdAt: secret.createdAt,
                updatedAt: secret.updatedAt
            };
        });

        return res.json(decryptedSecrets);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to retrieve secrets" });
    }
};

/**
 * Create or update a secret inside an environment.
 */
export const setSecret = async (req: Request, res: Response) => {
    try {
        const { environmentId, key, value, name } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!environmentId || !key || value === undefined) {
            return res.status(400).json({ detail: "Missing required fields (environmentId, key, value)" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // 1. Fetch environment and verify organization ownership
        const envRecord = await database
            .select()
            .from(environments)
            .where(and(
                eq(environments.id as any, environmentId),
                eq(environments.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (envRecord.length === 0 || !envRecord[0]) {
            return res.status(403).json({ detail: "Access to environment denied or environment not found" });
        }

        const env = envRecord[0];

        // 2. Decrypt DEK using MASTER_KEY
        const dek = decryptDEK(env.encrypted_dek);

        // 3. Encrypt the secret value using DEK
        const encryptedValue = encryptSecret(value, dek);

        // 4. Check if secret already exists in the environment
        const existingSecret = await database
            .select()
            .from(secrets)
            .where(and(
                eq(secrets.environment_id as any, environmentId),
                eq(secrets.key, key)
            ))
            .limit(1);

        let resultSecret;

        if (existingSecret.length > 0 && existingSecret[0]) {
            // Update existing secret
            const [updatedSecret] = await database
                .update(secrets)
                .set({
                    value: encryptedValue,
                    name: name || key,
                    updatedAt: new Date()
                })
                .where(eq(secrets.id as any, existingSecret[0].id))
                .returning();
            resultSecret = updatedSecret;
        } else {
            // Insert new secret
            const [newSecret] = await database
                .insert(secrets)
                .values({
                    environment_id: environmentId,
                    organization_id: user.organizationId,
                    key,
                    value: encryptedValue,
                    name: name || key
                })
                .returning();
            resultSecret = newSecret;
        }

        if (!resultSecret) {
            return res.status(500).json({ detail: "Failed to store secret" });
        }

        return res.status(200).json({
            id: resultSecret.id,
            name: resultSecret.name,
            key: resultSecret.key,
            createdAt: resultSecret.createdAt,
            updatedAt: resultSecret.updatedAt
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to set secret" });
    }
};

/**
 * Delete a secret.
 */
export const deleteSecret = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Secret ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // Verify the secret belongs to the user's organization
        const deleted = await database
            .delete(secrets)
            .where(and(
                eq(secrets.id as any, id),
                eq(secrets.organization_id as any, user.organizationId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Secret not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete secret" });
    }
};
