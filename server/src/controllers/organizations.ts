import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { organizations } from "../models/organizations.js";
import { users } from "../models/users.js";
import { projects } from "../models/projects.js";
import { environments } from "../models/environments.js";
import { generateDEK, encryptDEK } from "../utils/crypto.js";
import { eq, or, and } from "drizzle-orm";

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

/**
 * Delete the current organization (cascades to all children).
 */
export const deleteCurrentOrganization = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const deleted = await database
            .delete(organizations)
            .where(eq(organizations.id as any, user.organizationId))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Organization not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete organization" });
    }
};

/**
 * Create a new organization.
 * Automatically switches the user's active organization, creates a default project,
 * a default development environment, and encrypts a new DEK for it.
 */
export const createOrganization = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        if (!name) {
            return res.status(400).json({ detail: "Organization name is required" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        let resultOrg;

        await database.transaction(async (tx) => {
            // 1. Create Organization
            const [org] = await tx
                .insert(organizations)
                .values({
                    name,
                    description: description || `Organization for ${name}`
                })
                .returning();

            if (!org) throw new Error("Failed to create organization");

            // 2. Update user to be part of the new organization
            await tx
                .update(users)
                .set({ organization_id: org.id })
                .where(eq(users.id as any, user.id));

            // 3. Create Default Project under new organization
            const [project] = await tx
                .insert(projects)
                .values({
                    name: "Default Project",
                    description: "Main workspace project",
                    organization_id: org.id
                })
                .returning();

            if (!project) throw new Error("Failed to create default project");

            // 4. Create Default Environment with secure DEK
            const dek = generateDEK();
            const encryptedDek = encryptDEK(dek);

            const [env] = await tx
                .insert(environments)
                .values({
                    name: "development",
                    description: "Development environment secrets",
                    organization_id: org.id,
                    project_id: project.id,
                    encrypted_dek: encryptedDek
                })
                .returning();

            if (!env) throw new Error("Failed to create default environment");

            resultOrg = org;
        });

        return res.status(201).json(resultOrg);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to create organization" });
    }
};

/**
 * List all members of the current organization.
 */
export const listOrganizationMembers = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const members = await database
            .select({
                id: users.id,
                name: users.name,
                username: users.username,
                email: users.email,
                type: users.type,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
            })
            .from(users)
            .where(eq(users.organization_id as any, user.organizationId));

        return res.json(members);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to list organization members" });
    }
};

/**
 * Add or create a member in the current organization.
 */
export const addOrganizationMember = async (req: Request, res: Response) => {
    try {
        const { userId, name, username, email, password, type } = req.body;
        const currentUser = req.user;

        if (!currentUser) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        // Verify current user is owner or admin in this organization
        const callerRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, currentUser.id))
            .limit(1);

        if (callerRecord.length === 0 || !callerRecord[0]) {
            return res.status(404).json({ detail: "Caller user not found" });
        }

        const caller = callerRecord[0];
        if (caller.type !== "owner" && caller.type !== "admin") {
            return res.status(403).json({ detail: "Only organization owners and admins can manage members" });
        }

        // Fetch organization name
        const orgRecord = await database
            .select()
            .from(organizations)
            .where(eq(organizations.id as any, currentUser.organizationId))
            .limit(1);
        const orgName = orgRecord[0]?.name || "ManUp Organization";

        // Case 1: Associate an existing user by userId
        if (userId) {
            const [updatedUser] = await database
                .update(users)
                .set({
                    organization_id: currentUser.organizationId,
                    type: type || "member",
                    updatedAt: new Date()
                })
                .where(eq(users.id as any, userId))
                .returning();

            if (!updatedUser) {
                return res.status(404).json({ detail: "User not found" });
            }

            // Send invite email asynchronously in the background
            import("../utils/email.js").then(({ sendInviteEmail }) => {
                sendInviteEmail(updatedUser.email, orgName, {
                    name: updatedUser.name,
                    username: updatedUser.username,
                    password: "(Use your existing account credentials)"
                });
            }).catch(err => console.error("Email send failed:", err));

            return res.status(200).json({
                id: updatedUser.id,
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
                type: updatedUser.type,
                organizationId: updatedUser.organization_id
            });
        }

        // Case 2: Create a new user directly in this organization
        if (!name || !username || !email || !password) {
            return res.status(400).json({ detail: "Missing required fields (name, username, email, password) to create a new user" });
        }

        // Check if user already exists
        const existingUsers = await database
            .select()
            .from(users)
            .where(or(eq(users.email, email), eq(users.username, username)))
            .limit(1);

        if (existingUsers.length > 0) {
            return res.status(400).json({ detail: "User with this email or username already exists" });
        }

        const { encryptPassword } = await import("../utils/crypto.js");
        const passwordHash = encryptPassword(password);

        const [newUser] = await database
            .insert(users)
            .values({
                name,
                username,
                email,
                password_hash: passwordHash,
                organization_id: currentUser.organizationId,
                type: type || "member"
            })
            .returning();

        if (!newUser) {
            return res.status(500).json({ detail: "Failed to create user" });
        }

        // Send invite email asynchronously in the background
        import("../utils/email.js").then(({ sendInviteEmail }) => {
            sendInviteEmail(newUser.email, orgName, {
                name: newUser.name,
                username: newUser.username,
                password: password
            });
        }).catch(err => console.error("Email send failed:", err));

        return res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            type: newUser.type,
            organizationId: newUser.organization_id
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to add organization member" });
    }
};