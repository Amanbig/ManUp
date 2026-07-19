const API_URL = "/api";

/**
 * Auth token is stored in an httpOnly cookie set by the server (not accessible to JS — XSS-safe).
 * We keep a minimal in-memory reference ONLY for API consumers that pass it via Authorization header
 * (e.g. direct SDK usage). The browser dashboard exclusively uses the cookie path.
 */
let _inMemoryToken = "";

export const setAuthToken = (token: string) => {
    _inMemoryToken = token;
    // No localStorage — cookies are the single source of truth for the browser session.
};

export const getAuthToken = () => _inMemoryToken;

export const clearAuthToken = () => {
    _inMemoryToken = "";
};

const request = async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include", // send & receive httpOnly cookies automatically
    });

    if (response.status === 401) {
        clearAuthToken();
        window.location.reload();
        throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const api = {
    // Authentication
    register: async (data: any) => {
        const res = await request("/users/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (res?.token) setAuthToken(res.token);
        return res;
    },
    login: async (data: any) => {
        const res = await request("/users/login", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (res?.token) setAuthToken(res.token);
        return res;
    },
    logout: async () => {
        await request("/users/logout", { method: "POST" });
        clearAuthToken();
    },

    // Organizations
    createOrganization: async (data: { name: string; description?: string }) => {
        const res = await request("/organizations", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (res?.token) setAuthToken(res.token);
        return res;
    },
    getCurrentOrg: () => request("/organizations/current"),
    updateCurrentOrg: (data: { name: string; description?: string }) =>
        request("/organizations/current", {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    deleteCurrentOrg: () =>
        request("/organizations/current", {
            method: "DELETE",
        }),
    listOrgMembers: () => request("/organizations/members"),
    addOrgMember: (data: any) =>
        request("/organizations/members", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Projects
    createProject: (data: { name: string; description?: string }) =>
        request("/projects", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    listProjects: () => request("/projects"),
    getProject: (id: string) => request(`/projects/${id}`),
    updateProject: (id: string, data: any) =>
        request(`/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    deleteProject: (id: string) =>
        request(`/projects/${id}`, {
            method: "DELETE",
        }),
    listProjectMembers: (id: string) => request(`/projects/${id}/members`),
    addProjectMember: (id: string, data: { userId: string; role: string }) =>
        request(`/projects/${id}/members`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteProjectMember: (id: string, userId: string) =>
        request(`/projects/${id}/members/${userId}`, {
            method: "DELETE",
        }),

    // Environments
    createEnvironment: (data: { name: string; description?: string; projectId: string }) =>
        request("/environments", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    listEnvironments: (projectId: string) => request(`/environments/${projectId}`),
    getEnvironment: (id: string) => request(`/environments/detail/${id}`),
    updateEnvironment: (id: string, data: any) =>
        request(`/environments/detail/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),
    deleteEnvironment: (id: string) =>
        request(`/environments/detail/${id}`, {
            method: "DELETE",
        }),
    listEnvironmentMembers: (id: string) => request(`/environments/detail/${id}/members`),
    addEnvironmentMember: (id: string, data: { userId: string; role: string }) =>
        request(`/environments/detail/${id}/members`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteEnvironmentMember: (id: string, userId: string) =>
        request(`/environments/detail/${id}/members/${userId}`, {
            method: "DELETE",
        }),

    // Secrets
    getSecrets: (environmentId: string) => request(`/secrets/${environmentId}`),
    setSecret: (data: { environmentId: string; key: string; value: string; name?: string }) =>
        request("/secrets", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    deleteSecret: (id: string) =>
        request(`/secrets/${id}`, {
            method: "DELETE",
        }),

    // API Keys
    createApiKey: (data: { name: string; expiresAt?: string; rateLimit?: number }) =>
        request("/users/api-keys", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    listApiKeys: () => request("/users/api-keys"),
    deleteApiKey: (id: string) =>
        request(`/users/api-keys/${id}`, {
            method: "DELETE",
        }),
};
