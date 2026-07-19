import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { organizations } from "../models/organizations.js";
import { eq } from "drizzle-orm";

/**
 * Get the current user's organization details.
 */
export const getCurrentOrganization = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const org = await database
            .select()
            .from(organizations)
            .where(eq(organizations.id as any, user.organizationId))
            .limit(1);

        if (org.length === 0 || !org[0]) {
            return res.status(404).json({ detail: "Organization not found" });
        }

        return res.json(org[0]);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to retrieve organization" });
    }
};

/**
 * Update the current user's organization.
 */
export const updateCurrentOrganization = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
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

        const [updatedOrg] = await database
            .update(organizations)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(organizations.id as any, user.organizationId))
            .returning();

        if (!updatedOrg) {
            return res.status(404).json({ detail: "Organization not found" });
        }

        return res.json(updatedOrg);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to update organization" });
    }
};