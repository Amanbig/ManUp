import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../models/users.js';
import { verifyPassword } from '../utils/crypto.js';
import { createOrganizationWithOwner } from '../utils/bootstrap.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidName,
} from '../utils/validation.js';
import { eq, or } from 'drizzle-orm';
import config from '../config/config.js';

const COOKIE_OPTS = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge,
});

/** Set both access + refresh token cookies on the response. */
const setAuthCookies = (res: Response, payload: { userId: string; organizationId: string }) => {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.cookie('accessToken', accessToken, COOKIE_OPTS(15 * 60 * 1000)); // 15 min
  res.cookie('refreshToken', refreshToken, COOKIE_OPTS(7 * 24 * 60 * 60 * 1000)); // 7 days
  return { accessToken, refreshToken };
};

/**
 * Public, unauthenticated — lets the client know whether to show the signup form.
 */
export const getAuthConfig = async (_req: Request, res: Response) => {
  return res.json({ signupEnabled: config.SIGNUP_ENABLED });
};

/**
 * Handle new user registration.
 * Creates an organization, default project, development environment, DEK, and user in a single transaction.
 */
export const register = async (req: Request, res: Response) => {
  try {
    if (!config.SIGNUP_ENABLED) {
      return res
        .status(403)
        .json({ detail: 'Signup is currently disabled. Contact your administrator.' });
    }

    const { name, username, email, password, organizationName } = req.body;

    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ detail: 'Missing required fields (name, username, email, password)' });
    }

    if (!isValidName(name)) {
      return res.status(400).json({ detail: 'Name must be 1-100 characters' });
    }
    if (!isValidUsername(username)) {
      return res.status(400).json({
        detail: 'Username must be 3-50 characters (letters, numbers, underscore, hyphen only)',
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ detail: 'Please provide a valid email address' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ detail: 'Password must be 8-128 characters' });
    }
    if (organizationName !== undefined && !isValidName(organizationName)) {
      return res.status(400).json({ detail: 'Organization name must be 1-100 characters' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // Check if user already exists
    const existingUsers = await database
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existingUsers.length > 0) {
      return res.status(400).json({ detail: 'User with this email or username already exists' });
    }

    let result;

    // Run organization, user, project and environment setups inside a transaction
    await database.transaction(async (tx) => {
      const { org, user } = await createOrganizationWithOwner(tx, {
        name,
        username,
        email,
        password,
        organizationName,
      });

      const { accessToken, refreshToken } = setAuthCookies(res, {
        userId: user.id,
        organizationId: org.id,
      });
      result = {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          type: user.type,
          organizationId: org.id,
        },
        token: accessToken,
        refreshToken,
      };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Registration failed' });
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
      return res
        .status(400)
        .json({ detail: 'Missing login credentials (email/username and password)' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const query = email ? eq(users.email, email) : eq(users.username, username!);
    const userRecord = await database.select().from(users).where(query).limit(1);

    if (userRecord.length === 0 || !userRecord[0]) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const user = userRecord[0];
    const isPasswordCorrect = verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = setAuthCookies(res, {
      userId: user.id,
      organizationId: user.organization_id,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        type: user.type,
        organizationId: user.organization_id,
      },
      token: accessToken, // also returned for API consumers using Authorization header
      refreshToken,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: 'Login failed' });
  }
};

/**
 * Refresh — verifies the httpOnly refresh token cookie, header, or JSON payload and issues a new access token.
 * Called automatically by client apps on 401 responses.
 */
export const refreshSession = async (req: Request, res: Response) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    (req.headers['x-refresh-token'] as string);
  if (!refreshToken) {
    return res.status(401).json({ detail: 'No refresh token' });
  }
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    // Refresh token invalid or expired — force re-login
    res.clearCookie('accessToken', COOKIE_OPTS(0));
    res.clearCookie('refreshToken', COOKIE_OPTS(0));
    return res.status(401).json({ detail: 'Refresh token expired. Please log in again.' });
  }
  // Issue a fresh access token (refresh token unchanged — sliding window not needed here)
  const { accessToken, refreshToken: newRefreshToken } = setAuthCookies(res, {
    userId: payload.userId,
    organizationId: payload.organizationId,
  });
  return res.json({ token: accessToken, refreshToken: newRefreshToken || refreshToken });
};

/**
 * Logout — clears both auth cookies.
 */
export const logout = async (req: Request, res: Response) => {
  res.clearCookie('accessToken', COOKIE_OPTS(0));
  res.clearCookie('refreshToken', COOKIE_OPTS(0));
  return res.json({ detail: 'Logged out' });
};

/**
 * Get current authenticated user details.
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const userRecord = await database
      .select()
      .from(users)
      .where(eq(users.id as any, user.id))
      .limit(1);

    if (userRecord.length === 0 || !userRecord[0]) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const dbUser = userRecord[0];
    return res.json({
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
      type: dbUser.type,
      organizationId: dbUser.organization_id,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to retrieve user' });
  }
};

/**
 * Update current user profile.
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, currentPassword } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const userRecord = await database
      .select()
      .from(users)
      .where(eq(users.id as any, user.id))
      .limit(1);

    if (userRecord.length === 0 || !userRecord[0]) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const dbUser = userRecord[0];

    const isEmailChanged = email !== undefined && email !== dbUser.email;
    const isUsernameChanged = username !== undefined && username !== dbUser.username;

    if (isEmailChanged || isUsernameChanged) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ detail: 'Current password is required to change email or username' });
      }
      if (!verifyPassword(currentPassword, dbUser.password_hash)) {
        return res.status(401).json({ detail: 'Incorrect password' });
      }
    }

    if (name !== undefined && !isValidName(name)) {
      return res.status(400).json({ detail: 'Name must be 1-100 characters' });
    }
    if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ detail: 'Please provide a valid email address' });
    }
    if (username !== undefined && !isValidUsername(username)) {
      return res.status(400).json({
        detail: 'Username must be 3-50 characters (letters, numbers, underscore, hyphen only)',
      });
    }

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (username) updateData.username = username;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ detail: 'No update fields provided' });
    }

    const [updatedUser] = await database
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id as any, user.id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      type: updatedUser.type,
      organizationId: updatedUser.organization_id,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to update user' });
  }
};

/**
 * Delete current user account.
 */
export const deleteCurrentUser = async (req: Request, res: Response) => {
  try {
    const { currentPassword } = req.body || {};
    const user = req.user;
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const userRecord = await database
      .select()
      .from(users)
      .where(eq(users.id as any, user.id))
      .limit(1);

    if (userRecord.length === 0 || !userRecord[0]) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const dbUser = userRecord[0];

    if (dbUser.type === 'owner') {
      return res.status(400).json({
        detail:
          'Organization owner cannot delete their account. Please delete the organization instead.',
      });
    }

    if (!currentPassword) {
      return res.status(400).json({ detail: 'Current password is required to delete account' });
    }

    if (!verifyPassword(currentPassword, dbUser.password_hash)) {
      return res.status(401).json({ detail: 'Incorrect password' });
    }

    const deleted = await database
      .delete(users)
      .where(eq(users.id as any, user.id))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to delete user' });
  }
};
