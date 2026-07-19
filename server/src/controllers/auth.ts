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

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                type: user.type,
                organizationId: user.organization_id
            },
            token
        });
    } catch (error: any) {
        return res.status(500).json({ detail: "Login failed" });
    }
};
