import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { projects } from "../models/projects.js";
import { eq, and } from "drizzle-orm";

/**
 * Create a new project under the user's organization.
 */
export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!name) {
            return res.status(400).json({ detail: "Project name is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const [project] = await database
            .insert(projects)
            .values({
                name,
                description: description || "",
                organization_id: user.organizationId
            })
            .returning();

        if (!project) {
            return res.status(500).json({ detail: "Failed to create project" });
        }

        return res.status(201).json(project);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to create project" });
    }
};

/**
 * List all projects belonging to the user's organization.
 */
export const listProjects = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const orgProjects = await database
            .select()
            .from(projects)
            .where(eq(projects.organization_id as any, user.organizationId));

        return res.json(orgProjects);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to list projects" });
    }
};

/**
 * Get project details, verifying organization ownership.
 */
export const getProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Project ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const projectRecord = await database
            .select()
            .from(projects)
            .where(and(
                eq(projects.id as any, id),
                eq(projects.organization_id as any, user.organizationId)
            ))
            .limit(1);

        if (projectRecord.length === 0 || !projectRecord[0]) {
            return res.status(404).json({ detail: "Project not found" });
        }

        return res.json(projectRecord[0]);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to retrieve project" });
    }
};

/**
 * Update a project, verifying organization ownership.
 */
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Project ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const updateData: Record<string, any> = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ detail: "No update fields provided" });
        }

        const [updatedProject] = await database
            .update(projects)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(and(
                eq(projects.id as any, id),
                eq(projects.organization_id as any, user.organizationId)
            ))
            .returning();

        if (!updatedProject) {
            return res.status(404).json({ detail: "Project not found" });
        }

        return res.json(updatedProject);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to update project" });
    }
};

/**
 * Delete a project, verifying organization ownership.
 */
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!id) {
            return res.status(400).json({ detail: "Project ID is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const deleted = await database
            .delete(projects)
            .where(and(
                eq(projects.id as any, id),
                eq(projects.organization_id as any, user.organizationId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Project not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete project" });
    }
};
