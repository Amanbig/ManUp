const API_URL = '/api';

/**
 * Auth is handled via two httpOnly cookies (never accessible to JS):
 *   - accessToken  (15 min)  — sent with every request
 *   - refreshToken (7 days)  — sent to /api/users/refresh
 *
 * On 401 the client transparently calls /refresh once. If that also fails,
 * the registered onAuthExpired callback is invoked (App.tsx uses this to
 * reset the auth state and show the login screen — NO page reload).
 */

let _onAuthExpired: (() => void) | null = null;

/**
 * Register a callback that is called when the session fully expires
 * (access token 401 + refresh token 401).
 * App.tsx registers handleLogout() here on mount.
 */
export const setOnAuthExpired = (cb: () => void) => {
  _onAuthExpired = cb;
};

// No-op exports kept for any legacy call-sites
export const setAuthToken = (_token: string) => {};
export const getAuthToken = () => '';
export const clearAuthToken = () => {};

let _refreshing: Promise<boolean> | null = null;

/** Attempt to refresh the access token. Returns true on success. */
const tryRefresh = async (): Promise<boolean> => {
  // Deduplicate concurrent refresh calls
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/users/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
};

// Auth bootstrap endpoints can legitimately 401 for reasons that have nothing to do with
// an expired session (e.g. wrong password) — they must never trigger the silent-refresh dance.
const AUTH_BOOTSTRAP_PATHS = ['/users/login', '/users/register'];

const request = async (path: string, options: RequestInit = {}, _isRetry = false): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !_isRetry && !AUTH_BOOTSTRAP_PATHS.includes(path)) {
    // Try to silently refresh the access token once
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request(path, options, true); // retry original request
    }
    // Both access and refresh tokens have expired — notify the app
    // to show the login screen (NO window.location.reload — avoids infinite loops)
    if (_onAuthExpired) _onAuthExpired();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
};

export const api = {
  // Authentication
  getAuthConfig: (): Promise<{ signupEnabled: boolean }> => request('/users/auth-config'),
  register: async (data: any) =>
    request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  login: async (data: any) =>
    request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: async () => request('/users/logout', { method: 'POST' }),
  refresh: async () => request('/users/refresh', { method: 'POST' }),
  getCurrentUser: () => request('/users/me'),
  updateCurrentUser: (data: {
    name?: string;
    email?: string;
    username?: string;
    currentPassword?: string;
  }) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  deleteCurrentUser: (data?: { currentPassword?: string }) =>
    request('/users/me', { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),

  // Organizations
  getCurrentOrg: () => request('/organizations/current'),
  updateCurrentOrg: (data: { name: string; description?: string }) =>
    request('/organizations/current', { method: 'PUT', body: JSON.stringify(data) }),
  deleteCurrentOrg: () => request('/organizations/current', { method: 'DELETE' }),
  listOrgMembers: () => request('/organizations/members'),
  addOrgMember: (data: any) =>
    request('/organizations/members', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrgMember: (userId: string) =>
    request(`/organizations/members/${userId}`, { method: 'DELETE' }),

  // Projects
  createProject: (data: { name: string; description?: string }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  listProjects: () => request('/projects'),
  getProject: (id: string) => request(`/projects/${id}`),
  updateProject: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
  listProjectMembers: (id: string) => request(`/projects/${id}/members`),
  addProjectMember: (id: string, data: { userId: string; role: string }) =>
    request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  deleteProjectMember: (id: string, userId: string) =>
    request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  // Environments
  createEnvironment: (data: { name: string; description?: string; projectId: string }) =>
    request('/environments', { method: 'POST', body: JSON.stringify(data) }),
  listEnvironments: (projectId: string) => request(`/environments/${projectId}`),
  getEnvironment: (id: string) => request(`/environments/detail/${id}`),
  updateEnvironment: (id: string, data: any) =>
    request(`/environments/detail/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEnvironment: (id: string) => request(`/environments/detail/${id}`, { method: 'DELETE' }),
  listEnvironmentMembers: (id: string) => request(`/environments/detail/${id}/members`),
  addEnvironmentMember: (id: string, data: { userId: string; role: string }) =>
    request(`/environments/detail/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEnvironmentMember: (id: string, userId: string) =>
    request(`/environments/detail/${id}/members/${userId}`, { method: 'DELETE' }),

  // Secrets
  getSecrets: (environmentId: string) => request(`/secrets/${environmentId}`),
  setSecret: (data: { environmentId: string; key: string; value: string; name?: string }) =>
    request('/secrets', { method: 'POST', body: JSON.stringify(data) }),
  bulkSetSecrets: (data: {
    environmentId: string;
    secrets: Array<{ key: string; value: string; name?: string }>;
    overwrite?: boolean;
  }) => request('/secrets/bulk', { method: 'POST', body: JSON.stringify(data) }),
  updateSecret: (id: string, data: { key?: string; value?: string }) =>
    request(`/secrets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSecret: (id: string) => request(`/secrets/${id}`, { method: 'DELETE' }),

  // API Keys
  createApiKey: (data: {
    name: string;
    expiresAt?: string;
    rateLimit?: number;
    scope?: string;
    projectId?: string;
  }) => request('/users/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  listApiKeys: () => request('/users/api-keys'),
  deleteApiKey: (id: string) => request(`/users/api-keys/${id}`, { method: 'DELETE' }),
};
