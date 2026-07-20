import { organizations } from '../models/organizations.js';
import { users } from '../models/users.js';
import { projects } from '../models/projects.js';
import { environments } from '../models/environments.js';
import { encryptPassword, generateDEK, encryptDEK } from './crypto.js';

/**
 * Creates an organization, its owner user, a default project, and a default
 * environment (with its own DEK) in a single transaction. Shared by the
 * public /register endpoint and the DEFAULT_ADMIN_* startup seed — both
 * need the exact same "brand new tenant" setup.
 */
export const createOrganizationWithOwner = async (
  tx: any,
  params: {
    name: string;
    username: string;
    email: string;
    password: string;
    organizationName?: string;
  },
) => {
  const { name, username, email, password, organizationName } = params;

  const [org] = await tx
    .insert(organizations)
    .values({
      name: organizationName || `${name}'s Org`,
      description: `Organization for ${name}`,
    })
    .returning();
  if (!org) throw new Error('Failed to create organization');

  const [user] = await tx
    .insert(users)
    .values({
      name,
      username,
      email,
      password_hash: encryptPassword(password),
      organization_id: org.id,
      type: 'owner',
    })
    .returning();
  if (!user) throw new Error('Failed to create user');

  const [project] = await tx
    .insert(projects)
    .values({
      name: 'Default Project',
      description: 'Main workspace project',
      organization_id: org.id,
    })
    .returning();
  if (!project) throw new Error('Failed to create project');

  const dek = generateDEK();
  const encryptedDek = encryptDEK(dek);

  const [env] = await tx
    .insert(environments)
    .values({
      name: 'development',
      description: 'Development environment secrets',
      organization_id: org.id,
      project_id: project.id,
      encrypted_dek: encryptedDek,
    })
    .returning();
  if (!env) throw new Error('Failed to create environment');

  return { org, user, project, env };
};
