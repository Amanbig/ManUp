import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../models/users.js";
import { projects } from "../models/projects.js";
import { environments } from "../models/environments.js";
import { projectMembers } from "../models/projectMembers.js";
import { environmentMembers } from "../models/environmentMembers.js";
import { eq, and } from "drizzle-orm";

// PROJECT MEMBERS

export const addProjectMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // project ID
        const { userId, role } = req.body;
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });
        if (!userId) return res.status(400).json({ detail: "User ID is required" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        // Verify caller is owner/admin or organization owner
        const callerRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, currentUser.id))
            .limit(1);

        const caller = callerRecord[0];
        if (!caller) return res.status(404).json({ detail: "Caller user not found" });

        // Retrieve project
        const projectRecord = await database
            .select()
            .from(projects)
            .where(eq(projects.id as any, id))
            .limit(1);

        if (projectRecord.length === 0) return res.status(404).json({ detail: "Project not found" });

        if (caller.type !== "owner" && caller.type !== "admin") {
            // Check if caller is project admin
            const projectMembership = await database
                .select()
                .from(projectMembers)
                .where(and(
                    eq(projectMembers.project_id as any, id),
                    eq(projectMembers.user_id as any, currentUser.id),
                    eq(projectMembers.role as any, "admin")
                ))
                .limit(1);

            if (projectMembership.length === 0) {
                return res.status(403).json({ detail: "Only project/organization owners or admins can manage members" });
            }
        }

        // Add user to project
        const [membership] = await database
            .insert(projectMembers)
            .values({
                project_id: id as any,
                user_id: userId as any,
                role: role || "member"
            })
            .returning();

        return res.status(201).json(membership);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to add project member" });
    }
};

export const listProjectMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // project ID
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        // Retrieve project members joined with users
        const members = await database
            .select({
                id: projectMembers.id,
                userId: users.id,
                name: users.name,
                username: users.username,
                email: users.email,
                role: projectMembers.role,
                createdAt: projectMembers.createdAt
            })
            .from(projectMembers)
            .innerJoin(users, eq(projectMembers.user_id as any, users.id))
            .where(eq(projectMembers.project_id as any, id));

        return res.json(members);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to list project members" });
    }
};

export const deleteProjectMember = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params; // project ID, user ID
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        // Verify caller permission
        const callerRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, currentUser.id))
            .limit(1);

        const caller = callerRecord[0];
        if (!caller) return res.status(404).json({ detail: "Caller user not found" });

        if (caller.type !== "owner" && caller.type !== "admin") {
            const projectMembership = await database
                .select()
                .from(projectMembers)
                .where(and(
                    eq(projectMembers.project_id as any, id),
                    eq(projectMembers.user_id as any, currentUser.id),
                    eq(projectMembers.role as any, "admin")
                ))
                .limit(1);

            if (projectMembership.length === 0) {
                return res.status(403).json({ detail: "Only project/organization owners or admins can manage members" });
            }
        }

        const deleted = await database
            .delete(projectMembers)
            .where(and(
                eq(projectMembers.project_id as any, id),
                eq(projectMembers.user_id as any, userId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Project membership not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to remove project member" });
    }
};

// ENVIRONMENT MEMBERS

export const addEnvironmentMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // environment ID
        const { userId, role } = req.body;
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });
        if (!userId) return res.status(400).json({ detail: "User ID is required" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        // Verify caller permission (org owner/admin, or project admin)
        const callerRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, currentUser.id))
            .limit(1);

        const caller = callerRecord[0];
        if (!caller) return res.status(404).json({ detail: "Caller user not found" });

        // Get environment
        const envRecord = await database
            .select()
            .from(environments)
            .where(eq(environments.id as any, id))
            .limit(1);

        const env = envRecord[0];
        if (!env) return res.status(404).json({ detail: "Environment not found" });

        if (caller.type !== "owner" && caller.type !== "admin") {
            const projectMembership = await database
                .select()
                .from(projectMembers)
                .where(and(
                    eq(projectMembers.project_id as any, env.project_id),
                    eq(projectMembers.user_id as any, currentUser.id),
                    eq(projectMembers.role as any, "admin")
                ))
                .limit(1);

            if (projectMembership.length === 0) {
                return res.status(403).json({ detail: "Only project/organization owners or admins can manage environment access" });
            }
        }

        const [membership] = await database
            .insert(environmentMembers)
            .values({
                environment_id: id as any,
                user_id: userId as any,
                role: role || "member"
            })
            .returning();

        return res.status(201).json(membership);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to add environment member" });
    }
};

export const listEnvironmentMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // environment ID
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        const members = await database
            .select({
                id: environmentMembers.id,
                userId: users.id,
                name: users.name,
                username: users.username,
                email: users.email,
                role: environmentMembers.role,
                createdAt: environmentMembers.createdAt
            })
            .from(environmentMembers)
            .innerJoin(users, eq(environmentMembers.user_id as any, users.id))
            .where(eq(environmentMembers.environment_id as any, id));

        return res.json(members);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to list environment members" });
    }
};

export const deleteEnvironmentMember = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params; // environment ID, user ID
        const currentUser = req.user;

        if (!currentUser) return res.status(401).json({ detail: "Unauthorized" });

        const database = db();
        if (!database) return res.status(503).json({ detail: "Database unavailable" });

        // Verify caller permission
        const callerRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, currentUser.id))
            .limit(1);

        const caller = callerRecord[0];
        if (!caller) return res.status(404).json({ detail: "Caller user not found" });

        // Retrieve environment
        const envRecord = await database
            .select()
            .from(environments)
            .where(eq(environments.id as any, id))
            .limit(1);

        const env = envRecord[0];
        if (!env) return res.status(404).json({ detail: "Environment not found" });

        if (caller.type !== "owner" && caller.type !== "admin") {
            const projectMembership = await database
                .select()
                .from(projectMembers)
                .where(and(
                    eq(projectMembers.project_id as any, env.project_id),
                    eq(projectMembers.user_id as any, currentUser.id),
                    eq(projectMembers.role as any, "admin")
                ))
                .limit(1);

            if (projectMembership.length === 0) {
                return res.status(403).json({ detail: "Only project/organization owners or admins can manage environment access" });
            }
        }

        const deleted = await database
            .delete(environmentMembers)
            .where(and(
                eq(environmentMembers.environment_id as any, id),
                eq(environmentMembers.user_id as any, userId)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "Environment membership not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to remove environment member" });
    }
};
