export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  type: 'owner' | 'admin' | 'member';
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Secret {
  id: string;
  name: string;
  key: string;
  value: string; // decrypted in UI
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  organization_id: string;
  user_id: string;
  createdAt: string;
  expiresAt?: string;
  rateLimit?: number;
  requestCount?: number;
  lastUsedAt?: string;
  scope?: string;
}

export interface Member {
  id: string; // membership id or user id
  userId?: string;
  name: string;
  username: string;
  email: string;
  role: string; // 'admin', 'member', 'viewer'
  type?: 'owner' | 'admin' | 'member';
  createdAt?: string;
}
