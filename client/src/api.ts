const API_URL = "/api";

/**
 * Auth is handled via two httpOnly cookies (never accessible to JS):
 *   - accessToken  (15 min)  — sent automatically with every request
 *   - refreshToken (7 days)  — sent automatically to /api/users/refresh
 *
 * On a 401 the client transparently calls /refresh once. If that also fails,
 * the user is sent back to the login screen.
 */

let _refreshing: Promise<boolean> | null = null;

export const setAuthToken = (_token: string) => { /* noop — cookies are managed server-side */ };
export const getAuthToken = () => "";
export const clearAuthToken = () => {};

/** Attempt to refresh the access token. Returns true on success. */
const tryRefresh = async (): Promise<boolean> => {
    if (_refreshing) return _refreshing;
    _refreshing = (async () => {
        try {
            const res = await fetch(`${API_URL}/users/refresh`, {
                method: "POST",
                credentials: "include",
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

const request = async (path: string, options: RequestInit = {}, _isRetry = false): Promise<any> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include", // send httpOnly cookies automatically
    });

    if (response.status === 401 && !_isRetry) {
        // Transparently attempt to refresh the access token once
        const refreshed = await tryRefresh();
        if (refreshed) {
            return request(path, options, true); // retry original request
        }
        // Refresh also failed — session fully expired
        window.location.reload();
        throw new Error("Session expired. Please log in again.");
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
    register: async (data: any) => request("/users/register", { method: "POST", body: JSON.stringify(data) }),
    login: async (data: any) => request("/users/login", { method: "POST", body: JSON.stringify(data) }),
    logout: async () => request("/users/logout", { method: "POST" }),
    refresh: async () => request("/users/refresh", { method: "POST" }),

    // Organizations
    createOrganization: async (data: { name: string; description?: string }) =>
        request("/organizations", { method: "POST", body: JSON.stringify(data) }),
    getCurrentOrg: () => request("/organizations/current"),
    updateCurrentOrg: (data: { name: string; description?: string }) =>
        request("/organizations/current", { method: "PUT", body: JSON.stringify(data) }),
    deleteCurrentOrg: () => request("/organizations/current", { method: "DELETE" }),
    listOrgMembers: () => request("/organizations/members"),
    addOrgMember: (data: any) =>
        request("/organizations/members", { method: "POST", body: JSON.stringify(data) }),

    // Projects
    createProject: (data: { name: string; description?: string }) =>
        request("/projects", { method: "POST", body: JSON.stringify(data) }),
    listProjects: () => request("/projects"),
    getProject: (id: string) => request(`/projects/${id}`),
    updateProject: (id: string, data: any) =>
        request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteProject: (id: string) => request(`/projects/${id}`, { method: "DELETE" }),
    listProjectMembers: (id: string) => request(`/projects/${id}/members`),
    addProjectMember: (id: string, data: { userId: string; role: string }) =>
        request(`/projects/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
    deleteProjectMember: (id: string, userId: string) =>
        request(`/projects/${id}/members/${userId}`, { method: "DELETE" }),

    // Environments
    createEnvironment: (data: { name: string; description?: string; projectId: string }) =>
        request("/environments", { method: "POST", body: JSON.stringify(data) }),
    listEnvironments: (projectId: string) => request(`/environments/${projectId}`),
    getEnvironment: (id: string) => request(`/environments/detail/${id}`),
    updateEnvironment: (id: string, data: any) =>
        request(`/environments/detail/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteEnvironment: (id: string) => request(`/environments/detail/${id}`, { method: "DELETE" }),
    listEnvironmentMembers: (id: string) => request(`/environments/detail/${id}/members`),
    addEnvironmentMember: (id: string, data: { userId: string; role: string }) =>
        request(`/environments/detail/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
    deleteEnvironmentMember: (id: string, userId: string) =>
        request(`/environments/detail/${id}/members/${userId}`, { method: "DELETE" }),

    // Secrets
    getSecrets: (environmentId: string) => request(`/secrets/${environmentId}`),
    setSecret: (data: { environmentId: string; key: string; value: string; name?: string }) =>
        request("/secrets", { method: "POST", body: JSON.stringify(data) }),
    deleteSecret: (id: string) => request(`/secrets/${id}`, { method: "DELETE" }),

    // API Keys
    createApiKey: (data: { name: string; expiresAt?: string; rateLimit?: number }) =>
        request("/users/api-keys", { method: "POST", body: JSON.stringify(data) }),
    listApiKeys: () => request("/users/api-keys"),
    deleteApiKey: (id: string) => request(`/users/api-keys/${id}`, { method: "DELETE" }),
};
