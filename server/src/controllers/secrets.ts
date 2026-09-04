import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { secrets } from '../models/secrets.js';
import { environments } from '../models/environments.js';
import { projects } from '../models/projects.js';
import { users } from '../models/users.js';
import { environmentMembers } from '../models/environmentMembers.js';
import { projectMembers } from '../models/projectMembers.js';
import { decryptDEK, encryptSecret, decryptSecret } from '../utils/crypto.js';
import { isValidSecretKey } from '../utils/validation.js';
import { eq, and } from 'drizzle-orm';

/**
 * Resolves the effective role of a user in a given environment.
 */
const getEnvUserRole = async (
  database: any,
  userId: string,
  organizationId: string,
  environmentId: string,
): Promise<'admin' | 'member' | 'viewer' | null> => {
  const userRecord = await database
    .select()
    .from(users)
    .where(eq(users.id as any, userId))
    .limit(1);

  if (userRecord.length === 0 || !userRecord[0]) return null;
  const user = userRecord[0];

  // Org Owner and Admin are implicitly environment admins
  if (user.type === 'owner' || user.type === 'admin') return 'admin';

  // Get environment to find project_id
  const envRecord = await database
    .select()
    .from(environments)
    .where(eq(environments.id as any, environmentId))
    .limit(1);

  if (envRecord.length === 0 || !envRecord[0]) return null;
  const env = envRecord[0];

  // Check project-level role
  const projMembership = await database
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.project_id as any, env.project_id),
        eq(projectMembers.user_id as any, userId),
      ),
    )
    .limit(1);

  let defaultRole: 'admin' | 'member' | 'viewer' | null = null;
  if (projMembership.length > 0 && projMembership[0]) {
    defaultRole = projMembership[0].role as 'admin' | 'member' | 'viewer';
  }

  // Check environment-level membership role
  const envMembership = await database
    .select()
    .from(environmentMembers)
    .where(
      and(
        eq(environmentMembers.environment_id as any, environmentId),
        eq(environmentMembers.user_id as any, userId),
      ),
    )
    .limit(1);

  if (envMembership.length > 0 && envMembership[0]) {
    return envMembership[0].role as 'admin' | 'member' | 'viewer';
  }

  return defaultRole;
};

/**
 * Query secrets by environment name/keyword and optional project.
 * Ideal for CLIs, automated pipelines, and developer environments.
 * Example:
 *   GET /api/secrets?env=production
 *   GET /api/secrets?env=dev&project=my-service&format=dotenv
 */
export const querySecrets = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    const envQuery = (req.query.env || req.query.environment || req.headers['x-environment']) as
      string | undefined;
    const projectQuery = (req.query.project || req.query.projectId || req.headers['x-project']) as
      string | undefined;
    const format = ((req.query.format as string) || 'json').toLowerCase();

    if (!envQuery || envQuery.trim() === '') {
      return res.status(400).json({
        detail:
          'Environment keyword is required. Specify ?env=<name_or_id> (e.g. ?env=production or ?env=dev)',
      });
    }

    // 1. Resolve Target Project
    let targetProjectId: string;
    let targetProjectName: string;

    if (user.apiKeyProjectId) {
      // API Key is locked to a specific project
      const projRecord = await database
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id as any, user.apiKeyProjectId),
            eq(projects.organization_id as any, user.organizationId),
          ),
        )
        .limit(1);

      if (projRecord.length === 0 || !projRecord[0]) {
        return res.status(403).json({ detail: 'Scoped project not found or inaccessible' });
      }

      // If user also supplied a project query, verify it matches
      if (projectQuery && projectQuery.trim() !== '') {
        const isMatch =
          projectQuery.trim() === projRecord[0].id ||
          projectQuery.trim().toLowerCase() === projRecord[0].name.toLowerCase();
        if (!isMatch) {
          return res.status(403).json({
            detail: `This API key is scoped only to project '${projRecord[0].name}' (${projRecord[0].id}).`,
          });
        }
      }

      targetProjectId = projRecord[0].id;
      targetProjectName = projRecord[0].name;
    } else {
      // Organization-wide API key or User session
      if (projectQuery && projectQuery.trim() !== '') {
        const pTerm = projectQuery.trim();
        const projRecords = await database
          .select()
          .from(projects)
          .where(eq(projects.organization_id as any, user.organizationId));

        const matchedProj = projRecords.find(
          (p) => p.id === pTerm || p.name.toLowerCase() === pTerm.toLowerCase(),
        );

        if (!matchedProj) {
          return res.status(404).json({
            detail: `Project '${pTerm}' not found in organization.`,
          });
        }
        targetProjectId = matchedProj.id;
        targetProjectName = matchedProj.name;
      } else {
        // If organization has only 1 project, infer it automatically
        const orgProjects = await database
          .select()
          .from(projects)
          .where(eq(projects.organization_id as any, user.organizationId));

        if (orgProjects.length === 1 && orgProjects[0]) {
          targetProjectId = orgProjects[0].id;
          targetProjectName = orgProjects[0].name;
        } else if (orgProjects.length === 0) {
          return res.status(404).json({ detail: 'No projects found in organization.' });
        } else {
          return res.status(400).json({
            detail: `Organization has multiple projects (${orgProjects.map((p) => p.name).join(', ')}). Please specify ?project=<name_or_id>.`,
          });
        }
      }
    }

    // 2. Resolve Environment inside targetProject
    const envRecords = await database
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.project_id as any, targetProjectId),
          eq(environments.organization_id as any, user.organizationId),
        ),
      );

    if (envRecords.length === 0) {
      return res.status(404).json({
        detail: `Project '${targetProjectName}' has no configured environments.`,
      });
    }

    const cleanEnvQuery = envQuery.trim().toLowerCase();
    let matchedEnv = envRecords.find((e) => e.id === envQuery.trim());
    if (!matchedEnv) {
      matchedEnv = envRecords.find((e) => e.name.toLowerCase() === cleanEnvQuery);
    }
    if (!matchedEnv) {
      // Common abbreviations match
      matchedEnv = envRecords.find((e) => {
        const n = e.name.toLowerCase();
        if (cleanEnvQuery === 'prod' && (n === 'production' || n.startsWith('prod'))) return true;
        if (cleanEnvQuery === 'dev' && (n === 'development' || n.startsWith('dev'))) return true;
        if (cleanEnvQuery === 'stage' && (n === 'staging' || n.startsWith('stag'))) return true;
        return false;
      });
    }

    if (!matchedEnv) {
      return res.status(404).json({
        detail: `Environment '${envQuery}' not found in project '${targetProjectName}'. Available: ${envRecords.map((e) => e.name).join(', ')}`,
      });
    }

    // 3. Verify fine-grained access control
    const userRole = await getEnvUserRole(database, user.id, user.organizationId, matchedEnv.id);
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
    }

    // 4. Decrypt DEK using MASTER_KEY
    const dek = decryptDEK(matchedEnv.encrypted_dek);

    // 5. Fetch all secrets for this environment
    const secretRecords = await database
      .select()
      .from(secrets)
      .where(eq(secrets.environment_id as any, matchedEnv.id));

    // 6. Decrypt secret values using DEK
    const decryptedSecrets = secretRecords.map((secret) => {
      let decryptedValue = '';
      try {
        decryptedValue = decryptSecret(secret.value, dek);
      } catch (err) {
        decryptedValue = '[Decryption Failed]';
      }
      return {
        id: secret.id,
        name: secret.name,
        key: secret.key,
        value: decryptedValue,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      };
    });

    // 7. Format output
    if (format === 'dotenv' || format === 'env') {
      const dotenvContent = decryptedSecrets
        .map((s) => {
          const val = s.value;
          if (
            val.includes('\n') ||
            val.includes('"') ||
            val.includes(' ') ||
            val.includes('#') ||
            val.includes('$')
          ) {
            return `${s.key}="${val.replace(/"/g, '\\"')}"`;
          }
          return `${s.key}=${val}`;
        })
        .join('\n');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(dotenvContent);
    }

    if (format === 'kv' || format === 'object') {
      const kvMap: Record<string, string> = {};
      for (const s of decryptedSecrets) {
        kvMap[s.key] = s.value;
      }
      return res.json(kvMap);
    }

    // Default JSON list
    return res.json(decryptedSecrets);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to retrieve secrets' });
  }
};

/**
 * Get all decrypted secrets for a given environment by ID.
 */
export const getSecrets = async (req: Request, res: Response) => {
  try {
    const { environmentId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    if (!environmentId) {
      return res.status(400).json({ detail: 'Environment ID is required' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // 1. Fetch environment and verify organization ownership
    const envRecord = await database
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.id as any, environmentId),
          eq(environments.organization_id as any, user.organizationId),
        ),
      )
      .limit(1);

    if (envRecord.length === 0 || !envRecord[0]) {
      return res
        .status(403)
        .json({ detail: 'Access to environment denied or environment not found' });
    }

    const env = envRecord[0];

    // If API key is restricted to a project, enforce restriction
    if (user.apiKeyProjectId && env.project_id !== user.apiKeyProjectId) {
      return res.status(403).json({ detail: 'API key is restricted to a different project' });
    }

    // Verify fine-grained access control
    const userRole = await getEnvUserRole(
      database,
      user.id,
      user.organizationId,
      environmentId as string,
    );
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
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
      let decryptedValue = '';
      try {
        decryptedValue = decryptSecret(secret.value, dek);
      } catch (err) {
        decryptedValue = '[Decryption Failed]';
      }
      return {
        id: secret.id,
        name: secret.name,
        key: secret.key,
        value: decryptedValue,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      };
    });

    return res.json(decryptedSecrets);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to retrieve secrets' });
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
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    if (!environmentId || !key || value === undefined) {
      return res
        .status(400)
        .json({ detail: 'Missing required fields (environmentId, key, value)' });
    }
    if (!isValidSecretKey(key)) {
      return res.status(400).json({
        detail:
          'Secret key must be 1-255 characters: uppercase letters, numbers, and underscores only',
      });
    }
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return res.status(400).json({ detail: 'Secret name must be 100 characters or fewer' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // 1. Fetch environment and verify organization ownership
    const envRecord = await database
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.id as any, environmentId),
          eq(environments.organization_id as any, user.organizationId),
        ),
      )
      .limit(1);

    if (envRecord.length === 0 || !envRecord[0]) {
      return res
        .status(403)
        .json({ detail: 'Access to environment denied or environment not found' });
    }

    const env = envRecord[0];

    // If API key is restricted to a project, enforce restriction
    if (user.apiKeyProjectId && env.project_id !== user.apiKeyProjectId) {
      return res.status(403).json({ detail: 'API key is restricted to a different project' });
    }

    // Verify fine-grained access control
    const userRole = await getEnvUserRole(database, user.id, user.organizationId, environmentId);
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
    }
    if (userRole === 'viewer') {
      return res.status(403).json({ detail: 'Viewers cannot modify secrets' });
    }

    // 2. Decrypt DEK using MASTER_KEY
    const dek = decryptDEK(env.encrypted_dek);

    // 3. Encrypt the secret value using DEK
    const encryptedValue = encryptSecret(value, dek);

    // 4. Check if secret already exists in the environment
    const existingSecret = await database
      .select()
      .from(secrets)
      .where(and(eq(secrets.environment_id as any, environmentId), eq(secrets.key, key)))
      .limit(1);

    let resultSecret;

    if (existingSecret.length > 0 && existingSecret[0]) {
      // Update existing secret
      const [updatedSecret] = await database
        .update(secrets)
        .set({
          value: encryptedValue,
          name: name || key,
          updatedAt: new Date(),
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
          name: name || key,
        })
        .returning();
      resultSecret = newSecret;
    }

    if (!resultSecret) {
      return res.status(500).json({ detail: 'Failed to store secret' });
    }

    return res.status(200).json({
      id: resultSecret.id,
      name: resultSecret.name,
      key: resultSecret.key,
      createdAt: resultSecret.createdAt,
      updatedAt: resultSecret.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to set secret' });
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
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ detail: 'Secret ID is required' });
    }
    if (key !== undefined && !isValidSecretKey(key)) {
      return res.status(400).json({
        detail:
          'Secret key must be 1-255 characters: uppercase letters, numbers, and underscores only',
      });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // Retrieve the secret and verify organization ownership
    const secretRecord = await database
      .select()
      .from(secrets)
      .where(
        and(eq(secrets.id as any, id), eq(secrets.organization_id as any, user.organizationId)),
      )
      .limit(1);

    if (secretRecord.length === 0 || !secretRecord[0]) {
      return res.status(404).json({ detail: 'Secret not found' });
    }

    const secret = secretRecord[0];

    // Retrieve environment to check project restriction and retrieve encryption key
    const envRecord = await database
      .select()
      .from(environments)
      .where(eq(environments.id as any, secret.environment_id))
      .limit(1);

    if (envRecord.length === 0 || !envRecord[0]) {
      return res.status(404).json({ detail: 'Environment not found' });
    }

    if (user.apiKeyProjectId && envRecord[0].project_id !== user.apiKeyProjectId) {
      return res.status(403).json({ detail: 'API key is restricted to a different project' });
    }

    // Verify fine-grained access control
    const userRole = await getEnvUserRole(
      database,
      user.id,
      user.organizationId,
      secret.environment_id,
    );
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
    }
    if (userRole === 'viewer') {
      return res.status(403).json({ detail: 'Viewers cannot modify secrets' });
    }

    const updateData: Record<string, any> = {};

    if (key && key !== secret.key) {
      // The (environment_id, key) pair is unique — check the new key isn't already taken
      const collision = await database
        .select()
        .from(secrets)
        .where(and(eq(secrets.environment_id as any, secret.environment_id), eq(secrets.key, key)))
        .limit(1);

      if (collision.length > 0 && collision[0]) {
        return res
          .status(409)
          .json({ detail: 'A secret with this key already exists in this environment' });
      }
      updateData.key = key;
      updateData.name = key;
    }

    if (value !== undefined) {
      const dek = decryptDEK(envRecord[0].encrypted_dek);
      updateData.value = encryptSecret(value, dek);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ detail: 'No update fields provided' });
    }

    const [updatedSecret] = await database
      .update(secrets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(secrets.id as any, id))
      .returning();

    if (!updatedSecret) {
      return res.status(404).json({ detail: 'Secret not found' });
    }

    return res.json({
      id: updatedSecret.id,
      name: updatedSecret.name,
      key: updatedSecret.key,
      createdAt: updatedSecret.createdAt,
      updatedAt: updatedSecret.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to update secret' });
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
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ detail: 'Secret ID is required' });
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // Retrieve the secret and verify organization ownership
    const secretRecord = await database
      .select()
      .from(secrets)
      .where(
        and(eq(secrets.id as any, id), eq(secrets.organization_id as any, user.organizationId)),
      )
      .limit(1);

    if (secretRecord.length === 0 || !secretRecord[0]) {
      return res.status(404).json({ detail: 'Secret not found' });
    }

    const secret = secretRecord[0];

    // Enforce project restriction if using a project-scoped API key
    if (user.apiKeyProjectId) {
      const envRecord = await database
        .select()
        .from(environments)
        .where(eq(environments.id as any, secret.environment_id))
        .limit(1);

      if (
        envRecord.length === 0 ||
        !envRecord[0] ||
        envRecord[0].project_id !== user.apiKeyProjectId
      ) {
        return res.status(403).json({ detail: 'API key is restricted to a different project' });
      }
    }

    // Verify fine-grained access control
    const userRole = await getEnvUserRole(
      database,
      user.id,
      user.organizationId,
      secret.environment_id,
    );
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
    }
    if (userRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admins can delete secrets' });
    }

    await database.delete(secrets).where(eq(secrets.id as any, id));

    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to delete secret' });
  }
};

/**
 * Bulk import / create secrets for an environment.
 * Accepts an array of { key: string, value: string, name?: string }
 */
export const bulkSetSecrets = async (req: Request, res: Response) => {
  try {
    const { environmentId, secrets: incomingSecrets, overwrite = true } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }

    if (!environmentId || !Array.isArray(incomingSecrets) || incomingSecrets.length === 0) {
      return res
        .status(400)
        .json({ detail: 'Missing required fields (environmentId, non-empty secrets array)' });
    }

    if (incomingSecrets.length > 500) {
      return res.status(400).json({ detail: 'Cannot import more than 500 secrets at once' });
    }

    // Validate keys
    for (const item of incomingSecrets) {
      if (!item.key || !isValidSecretKey(item.key)) {
        return res.status(400).json({
          detail: `Invalid secret key: "${item.key}". Keys must be 1-255 characters: uppercase letters, numbers, and underscores only.`,
        });
      }
      if (item.value === undefined || item.value === null) {
        return res.status(400).json({
          detail: `Missing value for secret key "${item.key}"`,
        });
      }
    }

    const database = db();
    if (!database) {
      return res.status(503).json({ detail: 'Database unavailable' });
    }

    // 1. Fetch environment and verify organization ownership
    const envRecord = await database
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.id as any, environmentId),
          eq(environments.organization_id as any, user.organizationId),
        ),
      )
      .limit(1);

    if (envRecord.length === 0 || !envRecord[0]) {
      return res
        .status(403)
        .json({ detail: 'Access to environment denied or environment not found' });
    }

    const env = envRecord[0];

    // If API key is restricted to a project, enforce restriction
    if (user.apiKeyProjectId && env.project_id !== user.apiKeyProjectId) {
      return res.status(403).json({ detail: 'API key is restricted to a different project' });
    }

    // Verify fine-grained access control
    const userRole = await getEnvUserRole(database, user.id, user.organizationId, environmentId);
    if (!userRole) {
      return res.status(403).json({ detail: 'Access to environment denied' });
    }
    if (userRole === 'viewer') {
      return res.status(403).json({ detail: 'Viewers cannot modify secrets' });
    }

    // 2. Decrypt DEK using MASTER_KEY
    const dek = decryptDEK(env.encrypted_dek);

    // 3. Fetch existing secrets in environment to know what to update vs insert
    const existingRecords = await database
      .select()
      .from(secrets)
      .where(eq(secrets.environment_id as any, environmentId));

    const existingMap = new Map<string, any>();
    for (const s of existingRecords) {
      existingMap.set(s.key, s);
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of incomingSecrets) {
      const encryptedValue = encryptSecret(String(item.value), dek);
      const existing = existingMap.get(item.key);

      if (existing) {
        if (overwrite) {
          await database
            .update(secrets)
            .set({
              value: encryptedValue,
              name: item.name || item.key,
              updatedAt: new Date(),
            })
            .where(eq(secrets.id as any, existing.id));
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        await database.insert(secrets).values({
          environment_id: environmentId,
          organization_id: user.organizationId,
          key: item.key,
          value: encryptedValue,
          name: item.name || item.key,
        });
        insertedCount++;
      }
    }

    return res.status(200).json({
      detail: `Import complete: ${insertedCount} added, ${updatedCount} updated${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      insertedCount,
      updatedCount,
      skippedCount,
      total: insertedCount + updatedCount,
    });
  } catch (error: any) {
    console.error('bulkSetSecrets error:', error);
    return res.status(500).json({ detail: error.message || 'Internal server error' });
  }
};
