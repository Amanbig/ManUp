import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../models/users.js";
import { organizations } from "../models/organizations.js";
import { projects } from "../models/projects.js";
import { environments } from "../models/environments.js";
import { encryptPassword, verifyPassword, generateDEK, encryptDEK } from "../utils/crypto.js";
import { signToken } from "../utils/jwt.js";
import { eq, or } from "drizzle-orm";

/**
 * Handle new user registration.
 * Creates an organization, default project, development environment, DEK, and user in a single transaction.
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { name, username, email, password, organizationName } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ detail: "Missing required fields (name, username, email, password)" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
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

        const passwordHash = encryptPassword(password);
        let result;

        // Run organization, user, project and environment setups inside a transaction
        await database.transaction(async (tx) => {
            // 1. Create Organization
            const [org] = await tx
                .insert(organizations)
                .values({
                    name: organizationName || `${name}'s Org`,
                    description: `Organization for ${name}`
                })
                .returning();

            if (!org) throw new Error("Failed to create organization");

            // 2. Create User linked to the organization
            const [user] = await tx
                .insert(users)
                .values({
                    name,
                    username,
                    email,
                    password_hash: passwordHash,
                    organization_id: org.id,
                    type: "owner"
                })
                .returning();

            if (!user) throw new Error("Failed to create user");

            // 3. Create Default Project
            const [project] = await tx
                .insert(projects)
                .values({
                    name: "Default Project",
                    description: "Main workspace project",
                    organization_id: org.id
                })
                .returning();

            if (!project) throw new Error("Failed to create project");

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

            if (!env) throw new Error("Failed to create environment");

            const token = signToken({ userId: user.id, organizationId: org.id });
            result = {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    type: user.type,
                    organizationId: org.id
                },
                token
            };
        });

        // Set httpOnly cookie — JS cannot read this, protecting against XSS
        res.cookie("authToken", (result as any).token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json(result);
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Registration failed" });
    }
};

/**
 * Handle user login.
 * Validates GCM-encrypted password hash using server MASTER_KEY.
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, username, password } = req.body;

        if ((!email && !username) || !password) {
            return res.status(400).json({ detail: "Missing login credentials (email/username and password)" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const query = email ? eq(users.email, email) : eq(users.username, username!);
        const userRecord = await database
            .select()
            .from(users)
            .where(query)
            .limit(1);

        if (userRecord.length === 0 || !userRecord[0]) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }

        const user = userRecord[0];
        const isPasswordCorrect = verifyPassword(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }

        const token = signToken({ userId: user.id, organizationId: user.organization_id });

        // Set httpOnly cookie — JS cannot read this, protecting against XSS
        res.cookie("authToken", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                type: user.type,
                organizationId: user.organization_id
            },
            token // still returned for API consumers using Authorization header
        });
    } catch (error: any) {
        return res.status(500).json({ detail: "Login failed" });
    }
};

/**
 * Logout — clears the auth cookie.
 */
export const logout = async (req: Request, res: Response) => {
    res.clearCookie("authToken", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    return res.json({ detail: "Logged out" });
};

/**
 * Get current authenticated user details.
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }

        const database = db();
        if (!database) {
            return res.status(503).json({ detail: "Database unavailable" });
        }

        const userRecord = await database
            .select()
            .from(users)
            .where(eq(users.id as any, user.id))
            .limit(1);

        if (userRecord.length === 0 || !userRecord[0]) {
            return res.status(404).json({ detail: "User not found" });
        }

        const dbUser = userRecord[0];
        return res.json({
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username,
            email: dbUser.email,
            type: dbUser.type,
            organizationId: dbUser.organization_id
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to retrieve user" });
    }
};

/**
 * Update current user profile.
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
    try {
        const { name, email, username } = req.body;
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
        if (email) updateData.email = email;
        if (username) updateData.username = username;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ detail: "No update fields provided" });
        }

        const [updatedUser] = await database
            .update(users)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(users.id as any, user.id))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ detail: "User not found" });
        }

        return res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            type: updatedUser.type,
            organizationId: updatedUser.organization_id
        });
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to update user" });
    }
};

/**
 * Delete current user account.
 */
export const deleteCurrentUser = async (req: Request, res: Response) => {
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
            .delete(users)
            .where(eq(users.id as any, user.id))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ detail: "User not found" });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ detail: error.message || "Failed to delete user" });
    }
};
