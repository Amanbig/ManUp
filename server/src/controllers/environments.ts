import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { environments } from "../models/environments.js";
import { projects } from "../models/projects.js";
import { generateDEK, encryptDEK } from "../utils/crypto.js";
import { isValidName, isValidDescription } from "../utils/validation.js";
import { eq, and } from "drizzle-orm";

/**
 * Create a new environment inside a project.
 * Automatically generates a secure, unique DEK and encrypts it using the server MASTER_KEY.
 */
export const createEnvironment = async (req: Request, res: Response) => {
    try {
        const { name, description, projectId } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!name || !projectId) {
            return res.status(400).json({ detail: "Missing required fields (name, projectId)" });
        }
        if (!isValidName(name)) {
            return res.status(400).json({ detail: "Environment name must be 1-100 characters" });
        }
        if (!isValidDescription(description)) {
            return res.status(400).json({ detail: "Description must be 255 characters or fewer" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // Verify the project exists and belongs to the user's organization
        const projectRecord = await database
            .select()
            .from(projects)
            .where(and(
                eq(projects.id as any, projectId),
                eq(projects.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (projectRecord.length === 0 || !projectRecord[0]) {
            return res.status(403).json({ detail: "Access to project denied or project not found" });
        }

        // Generate and encrypt a new DEK for this environment
        const dek = generateDEK();
        const encryptedDek = encryptDEK(dek);

        const [env] = await database
            .insert(environments)
            .values({
                name,
                description: description || "",
                organization_id: user.organizationId,
                project_id: projectId,
                encrypted_dek: encryptedDek
            })
            .returning();

        if (!env) {
            return res.status(500).json({ detail: "Failed to create environment" });
        }

        return res.status(201).json({
            id: env.id,
            name: env.name,
            description: env.description,
            projectId: env.project_id,
            organizationId: env.organization_id,
            createdAt: env.createdAt,
            updatedAt: env.updatedAt
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to create environment" });
    }
};

/**
 * List all environments under a project.
 */
export const listEnvironments = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!projectId) {
            return res.status(400).json({ detail: "Project ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // Verify the project belongs to the user's organization
        const projectRecord = await database
            .select()
            .from(projects)
            .where(and(
                eq(projects.id as any, projectId),
                eq(projects.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (projectRecord.length === 0 || !projectRecord[0]) {
            return res.status(403).json({ detail: "Access to project denied or project not found" });
        }

        const projectEnvironments = await database
            .select({
                id: environments.id,
                name: environments.name,
                description: environments.description,
                projectId: environments.project_id,
                organizationId: environments.organization_id,
                createdAt: environments.createdAt,
                updatedAt: environments.updatedAt
            })
            .from(environments)
            .where(eq(environments.project_id as any, projectId));

        return res.json(projectEnvironments);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to list environments" });
    }
};

/**
 * Get details for a specific environment, verifying organization ownership.
 */
export const getEnvironment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Environment ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const envRecord = await database
            .select({
                id: environments.id,
                name: environments.name,
                description: environments.description,
                projectId: environments.project_id,
                organizationId: environments.organization_id,
                createdAt: environments.createdAt,
                updatedAt: environments.updatedAt
            })
            .from(environments)
            .where(and(
                eq(environments.id as any, id),
                eq(environments.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (envRecord.length === 0 || !envRecord[0]) {
            return res.status(404).json({ detail: "Environment not found" });
        }

        return res.json(envRecord[0]);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to retrieve environment" });
    }
};

/**
 * Update an environment, verifying organization ownership.
 */
export const updateEnvironment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Environment ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        if (name !== undefined && !isValidName(name)) {
            return res.status(400).json({ detail: "Environment name must be 1-100 characters" });
        }
        if (!isValidDescription(description)) {
            return res.status(400).json({ detail: "Description must be 255 characters or fewer" });
        }

        const updateData: Record<string, any> = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ detail: "No update fields provided" });
        }

        const [updatedEnv] = await database
            .update(environments)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(and(
                eq(environments.id as any, id),
                eq(environments.organization_id as any, user.organizationId)
            ))
            .returning();

        if (!updatedEnv) {
            return res.status(404).json({ detail: "Environment not found" });
        }

        return res.json({
            id: updatedEnv.id,
            name: updatedEnv.name,
            description: updatedEnv.description,
            projectId: updatedEnv.project_id,
            organizationId: updatedEnv.organization_id,
            createdAt: updatedEnv.createdAt,
            updatedAt: updatedEnv.updatedAt
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to update environment" });
    }
};

/**
 * Delete an environment, verifying organization ownership.
 */
export const deleteEnvironment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Environment ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const deleted = await database
            .delete(environments)
            .where(and(
                eq(environments.id as any, id),
                eq(environments.organization_id as any, user.organizationId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Environment not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete environment" });
    }
};
