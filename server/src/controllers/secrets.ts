import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { secrets } from "../models/secrets.js";
import { environments } from "../models/environments.js";
import { users } from "../models/users.js";
import { environmentMembers } from "../models/environmentMembers.js";
import { decryptDEK, encryptSecret, decryptSecret } from "../utils/crypto.js";
import { isValidSecretKey } from "../utils/validation.js";
import { eq, and } from "drizzle-orm";

/**
 * Get all decrypted secrets for a given environment.
 */
const checkEnvAccess = async (database: any, userId: string, organizationId: string, environmentId: string): Promise<boolean> => {
    const userRecord = await database
        .select()
        .from(users)
        .where(eq(users.id as any, userId))
        .limit(1);

    if (userRecord.length === 0 || !userRecord[0]) return false;
    const user = userRecord[0];

    if (user.type === "owner" || user.type === "admin") return true;

    const isMember = await database
        .select()
        .from(environmentMembers)
        .where(and(
            eq(environmentMembers.environment_id as any, environmentId),
            eq(environmentMembers.user_id as any, userId)
        ))
        .limit(1);

    return isMember.length > 0;
};

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

        // Verify fine-grained access control
        const hasAccess = await checkEnvAccess(database, user.id, user.organizationId, environmentId as string);
        if (!hasAccess) {
            return res.status(403).json({ detail: "Access to environment denied" });
        }

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
        if (!isValidSecretKey(key)) {
            return res.status(400).json({ detail: "Secret key must be 1-255 characters: uppercase letters, numbers, and underscores only" });
        }
        if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
            return res.status(400).json({ detail: "Secret name must be 100 characters or fewer" });
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

        // Verify fine-grained access control
        const hasAccess = await checkEnvAccess(database, user.id, user.organizationId, environmentId);
        if (!hasAccess) {
            return res.status(403).json({ detail: "Access to environment denied" });
        }

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
 * Update an existing secret's key and/or value by id (true rename, unlike setSecret's upsert-by-key).
 */
export const updateSecret = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { key, value } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Secret ID is required" });
        }
        if (key !== undefined && !isValidSecretKey(key)) {
            return res.status(400).json({ detail: "Secret key must be 1-255 characters: uppercase letters, numbers, and underscores only" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // Retrieve the secret and verify organization ownership
        const secretRecord = await database
            .select()
            .from(secrets)
            .where(and(
                eq(secrets.id as any, id),
                eq(secrets.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (secretRecord.length === 0 || !secretRecord[0]) {
            return res.status(404).json({ detail: "Secret not found" });
        }

        const secret = secretRecord[0];

        // Verify fine-grained access control
        const hasAccess = await checkEnvAccess(database, user.id, user.organizationId, secret.environment_id);
        if (!hasAccess) {
            return res.status(403).json({ detail: "Access to environment denied" });
        }

        const updateData: Record<string, any> = {};

        if (key && key !== secret.key) {
            // The (environment_id, key) pair is unique — check the new key isn't already taken
            const collision = await database
                .select()
                .from(secrets)
                .where(and(
                    eq(secrets.environment_id as any, secret.environment_id),
                    eq(secrets.key, key)
                ))
                .limit(1);

            if (collision.length > 0 && collision[0]) {
                return res.status(409).json({ detail: "A secret with this key already exists in this environment" });
            }
            updateData.key = key;
            updateData.name = key;
        }

        if (value !== undefined) {
            const envRecord = await database
                .select()
                .from(environments)
                .where(eq(environments.id as any, secret.environment_id))
                .limit(1);

            if (envRecord.length === 0 || !envRecord[0]) {
                return res.status(404).json({ detail: "Environment not found" });
            }

            const dek = decryptDEK(envRecord[0].encrypted_dek);
            updateData.value = encryptSecret(value, dek);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ detail: "No update fields provided" });
        }

        const [updatedSecret] = await database
            .update(secrets)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(secrets.id as any, id))
            .returning();

        if (!updatedSecret) {
            return res.status(404).json({ detail: "Secret not found" });
        }

        return res.json({
            id: updatedSecret.id,
            name: updatedSecret.name,
            key: updatedSecret.key,
            createdAt: updatedSecret.createdAt,
            updatedAt: updatedSecret.updatedAt
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to update secret" });
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

        // Retrieve the secret and verify organization ownership
        const secretRecord = await database
            .select()
            .from(secrets)
            .where(and(
                eq(secrets.id as any, id),
                eq(secrets.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (secretRecord.length === 0 || !secretRecord[0]) {
            return res.status(404).json({ detail: "Secret not found" });
        }

        const secret = secretRecord[0];

        // Verify fine-grained access control
        const hasAccess = await checkEnvAccess(database, user.id, user.organizationId, secret.environment_id);
        if (!hasAccess) {
            return res.status(403).json({ detail: "Access to environment denied" });
        }

        await database
            .delete(secrets)
            .where(eq(secrets.id as any, id));

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete secret" });
    }
};
