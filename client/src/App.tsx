import React, { useState, useEffect, useMemo } from "react";
import { api, setAuthToken, getAuthToken } from "./api";
import {
    Key,
    Users,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Copy,
    LogOut,
    Check,
    PlusCircle,
    KeyRound,
    AlertCircle,
    Search,
    Edit2,
    Building2,
    Briefcase,
    Globe,
    Lock
} from "lucide-react";
import type { Project, Environment, Secret, ApiKey, Member } from "./types";

export default function App() {
    // Session State
    const [token, setToken] = useState<string>(getAuthToken());
    const [currentOrg, setCurrentOrg] = useState<any>(null);

    // List States
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [orgMembers, setOrgMembers] = useState<Member[]>([]);
    const [projMembers, setProjMembers] = useState<Member[]>([]);
    const [envMembers, setEnvMembers] = useState<Member[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

    // Navigation Active Panel: "secrets" | "members" | "apikeys"
    const [activeTab, setActiveTab] = useState<"secrets" | "members" | "apikeys">("secrets");

    // UI Feedback
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [copiedId, setCopiedId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [revealSecretId, setRevealSecretId] = useState<string | null>(null);

    // Modals & Forms State
    const [isRegMode, setIsRegMode] = useState<boolean>(false);
    const [authForm, setAuthForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        organizationName: ""
    });

    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [newOrgForm, setNewOrgForm] = useState({ name: "", description: "" });

    const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
    const [newProjForm, setNewProjForm] = useState({ name: "", description: "" });

    const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
    const [newEnvForm, setNewEnvForm] = useState({ name: "", description: "" });

    const [isAddSecretOpen, setIsAddSecretOpen] = useState(false);
    const [secretForm, setSecretForm] = useState({ id: "", name: "", key: "", value: "" });

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "member"
    });

    const [isAddProjMemberOpen, setIsAddProjMemberOpen] = useState(false);
    const [newProjMemberForm, setNewProjMemberForm] = useState({ userId: "", role: "member" });

    const [isAddEnvMemberOpen, setIsAddEnvMemberOpen] = useState(false);
    const [newEnvMemberForm, setNewEnvMemberForm] = useState({ userId: "", role: "member" });

    const [isNewApiKeyOpen, setIsNewApiKeyOpen] = useState(false);
    const [apiKeyForm, setApiKeyForm] = useState({ name: "", expiresDays: "30" });
    const [generatedKeyResult, setGeneratedKeyResult] = useState<{ id: string; name: string; apiKey: string } | null>(null);

    // Fetch initial auth details if token exists
    useEffect(() => {
        if (token) {
            loadInitialData();
        }
    }, [token]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError("");
            const org = await api.getCurrentOrg();
            setCurrentOrg(org);

            // Fetch user identity
            const projectsList = await api.listProjects();
            setProjects(projectsList);

            if (projectsList.length > 0) {
                setSelectedProject(projectsList[0]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load data");
            // If token invalid, clear
            if (err.message.includes("Session expired")) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Load environments when selected project changes
    useEffect(() => {
        if (selectedProject) {
            loadEnvironments(selectedProject.id);
        } else {
            setEnvironments([]);
            setSelectedEnvironment(null);
        }
    }, [selectedProject]);

    const loadEnvironments = async (projectId: string) => {
        try {
            const list = await api.listEnvironments(projectId);
            setEnvironments(list);
            if (list.length > 0) {
                setSelectedEnvironment(list[0]);
            } else {
                setSelectedEnvironment(null);
            }
        } catch (err: any) {
            console.error("Failed to load environments", err);
        }
    };

    // Load Secrets & Members & API Keys when environment / project / tab changes
    useEffect(() => {
        if (activeTab === "secrets" && selectedEnvironment) {
            loadSecrets(selectedEnvironment.id);
        } else if (activeTab === "members") {
            loadMembersData();
        } else if (activeTab === "apikeys") {
            loadApiKeys();
        }
    }, [activeTab, selectedEnvironment, selectedProject]);

    const loadSecrets = async (envId: string) => {
        try {
            setLoading(true);
            const list = await api.getSecrets(envId);
            setSecrets(list);
        } catch (err: any) {
            setSecrets([]);
            setError(err.message || "Access to environment denied");
        } finally {
            setLoading(false);
        }
    };

    const loadMembersData = async () => {
        try {
            setLoading(true);
            const orgUsers = await api.listOrgMembers();
            setOrgMembers(orgUsers);

            if (selectedProject) {
                const projUsers = await api.listProjectMembers(selectedProject.id);
                setProjMembers(projUsers);
            } else {
                setProjMembers([]);
            }

            if (selectedEnvironment) {
                const envUsers = await api.listEnvironmentMembers(selectedEnvironment.id);
                setEnvMembers(envUsers);
            } else {
                setEnvMembers([]);
            }
        } catch (err: any) {
            console.error("Failed to load members data", err);
        } finally {
            setLoading(false);
        }
    };

    const loadApiKeys = async () => {
        try {
            setLoading(true);
            const keys = await api.listApiKeys();
            setApiKeys(keys);
        } catch (err: any) {
            console.error("Failed to load API keys", err);
        } finally {
            setLoading(false);
        }
    };

    // Copied indicator
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(""), 2000);
    };

    // Auth actions
    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isRegMode) {
                const res = await api.register(authForm);
                setToken(res.token);
            } else {
                const res = await api.login({
                    username: authForm.username,
                    password: authForm.password
                });
                setToken(res.token);
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setAuthToken("");
        setToken("");
        setCurrentOrg(null);
        setProjects([]);
        setSelectedProject(null);
        setEnvironments([]);
        setSelectedEnvironment(null);
        setSecrets([]);
    };

    // CRUD creation actions
    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await api.createOrganization(newOrgForm);
            setIsCreateOrgOpen(false);
            setNewOrgForm({ name: "", description: "" });
            // Re-auth on token update
            setToken(res.token);
            await loadInitialData();
        } catch (err: any) {
            setError(err.message || "Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const proj = await api.createProject(newProjForm);
            setIsCreateProjOpen(false);
            setNewProjForm({ name: "", description: "" });
            const list = await api.listProjects();
            setProjects(list);
            setSelectedProject(proj);
        } catch (err: any) {
            setError(err.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEnvironment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        try {
            setLoading(true);
            await api.createEnvironment({
                ...newEnvForm,
                projectId: selectedProject.id
            });
            setIsCreateEnvOpen(false);
            setNewEnvForm({ name: "", description: "" });
            await loadEnvironments(selectedProject.id);
        } catch (err: any) {
            setError(err.message || "Failed to create environment");
        } finally {
            setLoading(false);
        }
    };

    // Secret Operations
    const handleSaveSecret = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEnvironment) return;
        try {
            setLoading(true);
            await api.setSecret({
                environmentId: selectedEnvironment.id,
                key: secretForm.key,
                value: secretForm.value,
                name: secretForm.name
            });
            setIsAddSecretOpen(false);
            setSecretForm({ id: "", name: "", key: "", value: "" });
            await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to set secret");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSecret = async (id: string) => {
        if (!confirm("Are you sure you want to delete this secret?")) return;
        try {
            setLoading(true);
            await api.deleteSecret(id);
            if (selectedEnvironment) {
                await loadSecrets(selectedEnvironment.id);
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete secret");
        } finally {
            setLoading(false);
        }
    };

    // Member Management
    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.addOrgMember(inviteForm);
            setIsInviteOpen(false);
            setInviteForm({ name: "", username: "", email: "", password: "", role: "member" });
            await loadMembersData();
        } catch (err: any) {
            setError(err.message || "Failed to invite member");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProjMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        try {
            setLoading(true);
            await api.addProjectMember(selectedProject.id, newProjMemberForm);
            setIsAddProjMemberOpen(false);
            setNewProjMemberForm({ userId: "", role: "member" });
            await loadMembersData();
        } catch (err: any) {
            setError(err.message || "Failed to add project member");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProjMember = async (userId: string) => {
        if (!selectedProject || !confirm("Remove member from project?")) return;
        try {
            setLoading(true);
            await api.deleteProjectMember(selectedProject.id, userId);
            await loadMembersData();
        } catch (err: any) {
            setError(err.message || "Failed to remove project member");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEnvMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEnvironment) return;
        try {
            setLoading(true);
            await api.addEnvironmentMember(selectedEnvironment.id, newEnvMemberForm);
            setIsAddEnvMemberOpen(false);
            setNewEnvMemberForm({ userId: "", role: "member" });
            await loadMembersData();
        } catch (err: any) {
            setError(err.message || "Failed to add environment member");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEnvMember = async (userId: string) => {
        if (!selectedEnvironment || !confirm("Remove member from environment?")) return;
        try {
            setLoading(true);
            await api.deleteEnvironmentMember(selectedEnvironment.id, userId);
            await loadMembersData();
        } catch (err: any) {
            setError(err.message || "Failed to remove environment member");
        } finally {
            setLoading(false);
        }
    };

    // API Keys Operations
    const handleGenerateApiKey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + parseInt(apiKeyForm.expiresDays));

            const res = await api.createApiKey({
                name: apiKeyForm.name,
                expiresAt: expiry.toISOString()
            });

            setGeneratedKeyResult(res);
            setApiKeyForm({ name: "", expiresDays: "30" });
            await loadApiKeys();
        } catch (err: any) {
            setError(err.message || "Failed to generate API Key");
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeApiKey = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this API Key?")) return;
        try {
            setLoading(true);
            await api.deleteApiKey(id);
            await loadApiKeys();
        } catch (err: any) {
            setError(err.message || "Failed to revoke API Key");
        } finally {
            setLoading(false);
        }
    };

    // Filtering secrets
    const filteredSecrets = useMemo(() => {
        return secrets.filter(
            (s) =>
                s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [secrets, searchQuery]);

    // Unassigned org members for project selection dropdown
    const unassignedOrgMembers = useMemo(() => {
        return orgMembers.filter((om) => !projMembers.some((pm) => pm.userId === om.id));
    }, [orgMembers, projMembers]);

    // Unassigned project members for env selection dropdown
    const unassignedProjMembers = useMemo(() => {
        return projMembers.filter((pm) => !envMembers.some((em) => em.userId === pm.userId));
    }, [projMembers, envMembers]);

    // Render Sign-in/Sign-up if not authenticated
    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0b0b0f] px-4 relative overflow-hidden">
                {/* Purple Background Glow */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

                <div className="w-full max-w-md border border-neutral-800 bg-neutral-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 mb-3">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-neutral-100 font-display">
                            ManUp
                        </h2>
                        <p className="text-sm text-neutral-400 mt-1 text-center">
                            Envelope-encrypted developer secrets management vault.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {isRegMode && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                        placeholder="Alice Vance"
                                        value={authForm.name}
                                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                        Initial Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                        placeholder="Acme Corp"
                                        value={authForm.organizationName}
                                        onChange={(e) => setAuthForm({ ...authForm, organizationName: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                placeholder="alice_vance"
                                value={authForm.username}
                                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                            />
                        </div>

                        {isRegMode && (
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="alice@acme.com"
                                    value={authForm.email}
                                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                placeholder="••••••••••••"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 mt-2"
                        >
                            {loading ? "Authenticating..." : isRegMode ? "Create Account" : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            onClick={() => {
                                setError("");
                                setIsRegMode(!isRegMode);
                            }}
                            className="text-purple-400 hover:text-purple-300 font-medium transition"
                        >
                            {isRegMode ? "Already have an account? Sign In" : "Need a secure vault? Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0b0b0f] text-neutral-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0e0e13] border-r border-neutral-900 flex flex-col shrink-0">
                {/* Brand / Logo */}
                <div className="h-16 border-b border-neutral-900 flex items-center px-6 gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-400">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white font-display leading-none">
                            ManUp
                        </h1>
                        <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">
                            Secure Vault
                        </span>
                    </div>
                </div>

                {/* Switchers Section */}
                <div className="p-4 border-b border-neutral-900 space-y-4">
                    {/* Organization Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Organization
                            </span>
                            <button
                                onClick={() => setIsCreateOrgOpen(true)}
                                className="text-purple-400 hover:text-purple-300 transition"
                                title="Create Organization"
                            >
                                <PlusCircle className="h-4.5 w-4.5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-sm text-neutral-200">
                            <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                            <span className="font-medium truncate">
                                {currentOrg?.name || "Loading Org..."}
                            </span>
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Active Project
                            </span>
                            <button
                                onClick={() => setIsCreateProjOpen(true)}
                                className="text-purple-400 hover:text-purple-300 transition"
                                title="Create Project"
                            >
                                <PlusCircle className="h-4.5 w-4.5" />
                            </button>
                        </div>
                        <select
                            className="w-full bg-neutral-950 border border-neutral-900 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                            value={selectedProject?.id || ""}
                            onChange={(e) => {
                                const proj = projects.find((p) => p.id === e.target.value);
                                if (proj) setSelectedProject(proj);
                            }}
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                            {projects.length === 0 && <option>No Projects Available</option>}
                        </select>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab("secrets")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === "secrets"
                                ? "bg-purple-600/10 border border-purple-500/30 text-purple-400"
                                : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                        }`}
                    >
                        <Key className="h-4.5 w-4.5" />
                        <span>Secrets Vault</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === "members"
                                ? "bg-purple-600/10 border border-purple-500/30 text-purple-400"
                                : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                        }`}
                    >
                        <Users className="h-4.5 w-4.5" />
                        <span>Access Members</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("apikeys")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === "apikeys"
                                ? "bg-purple-600/10 border border-purple-500/30 text-purple-400"
                                : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                        }`}
                    >
                        <KeyRound className="h-4.5 w-4.5" />
                        <span>API Keys</span>
                    </button>
                </nav>

                {/* User footer & Logout */}
                <div className="p-4 border-t border-neutral-900 bg-neutral-950/40 flex items-center justify-between">
                    <div className="truncate max-w-[150px]">
                        <span className="block text-xs font-semibold text-neutral-300 truncate">
                            {currentOrg?.name || "Organization"}
                        </span>
                        <span className="block text-[10px] text-neutral-500 truncate">
                            Developer Context
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-[#0c0c11]">
                {/* Header */}
                <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-8 shrink-0 bg-[#0e0e13]/60 backdrop-blur">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white font-display">
                            {activeTab === "secrets" && "Secrets Vault"}
                            {activeTab === "members" && "Access & RBAC Memberships"}
                            {activeTab === "apikeys" && "Programmatic API Keys"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                        {loading && (
                            <span className="flex items-center gap-1.5 text-xs text-purple-400 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                                Syncing...
                            </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-medium">
                            Project: {selectedProject?.name || "None"}
                        </span>
                    </div>
                </header>

                {/* Main panel inner */}
                <div className="flex-grow p-8">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg bg-red-950/30 border border-red-500/20 p-4 text-sm text-red-400">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-xs hover:underline uppercase tracking-wider font-semibold text-neutral-400"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {/* SECRETS VAULT PANEL */}
                    {activeTab === "secrets" && (
                        <div className="space-y-6">
                            {/* Environment Selector and Controls */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {environments.map((env) => (
                                        <button
                                            key={env.id}
                                            onClick={() => setSelectedEnvironment(env)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                                                selectedEnvironment?.id === env.id
                                                    ? "bg-purple-600 text-white shadow shadow-purple-900/50"
                                                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                                            }`}
                                        >
                                            {env.name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setIsCreateEnvOpen(true)}
                                        className="px-2 py-1.5 rounded-lg border border-dashed border-neutral-800 hover:border-purple-500/50 text-neutral-500 hover:text-purple-400 transition"
                                        title="Add Environment"
                                    >
                                        <Plus className="h-4.5 w-4.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                                        <input
                                            type="text"
                                            placeholder="Search secrets..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-neutral-900 border border-neutral-850 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-purple-500/50 w-60"
                                        />
                                    </div>

                                    {/* Add Secret Trigger */}
                                    <button
                                        onClick={() => {
                                            setSecretForm({ id: "", name: "", key: "", value: "" });
                                            setIsAddSecretOpen(true);
                                        }}
                                        disabled={!selectedEnvironment}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Secret</span>
                                    </button>
                                </div>
                            </div>

                            {/* Secrets Table/Grid */}
                            {filteredSecrets.length > 0 ? (
                                <div className="border border-neutral-900 rounded-xl overflow-hidden bg-neutral-950/20">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400 font-semibold">
                                                <th className="px-6 py-3.5">Secret Key</th>
                                                <th className="px-6 py-3.5">Display Name</th>
                                                <th className="px-6 py-3.5">Value (Decrypted)</th>
                                                <th className="px-6 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-900">
                                            {filteredSecrets.map((secret) => {
                                                const isRevealed = revealSecretId === secret.id;
                                                return (
                                                    <tr key={secret.id} className="hover:bg-neutral-900/10 transition">
                                                        <td className="px-6 py-4 font-mono font-bold text-neutral-200">
                                                            {secret.key}
                                                        </td>
                                                        <td className="px-6 py-4 text-neutral-400">
                                                            {secret.name || secret.key}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono max-w-xs truncate">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-neutral-300 select-all">
                                                                    {isRevealed ? secret.value : "••••••••••••••••"}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        setRevealSecretId(isRevealed ? null : secret.id)
                                                                    }
                                                                    className="text-neutral-500 hover:text-neutral-300 transition"
                                                                >
                                                                    {isRevealed ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => copyToClipboard(secret.value, secret.id)}
                                                                    className="text-neutral-500 hover:text-neutral-300 transition relative"
                                                                >
                                                                    {copiedId === secret.id ? (
                                                                        <Check className="h-4 w-4 text-green-400" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setSecretForm(secret);
                                                                        setIsAddSecretOpen(true);
                                                                    }}
                                                                    className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
                                                                    title="Edit Secret"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSecret(secret.id)}
                                                                    className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-red-400 transition"
                                                                    title="Delete Secret"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-dashed border-neutral-800 rounded-xl p-12 text-center bg-neutral-950/10">
                                    <Lock className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-300">No Secrets Configured</h3>
                                    <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                                        Secrets are envelope-encrypted using on-demand DEK values. Use "Add Secret" to get started.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MEMBERS & RBAC MEMBERSHIP PANEL */}
                    {activeTab === "members" && (
                        <div className="space-y-8">
                            {/* Organization Members */}
                            <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-purple-400" />
                                            Organization Members
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            List of users associated with this organization.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsInviteOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Invite User</span>
                                    </button>
                                </div>
                                <div className="divide-y divide-neutral-900">
                                    {orgMembers.map((member) => (
                                        <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                                            <div>
                                                <span className="font-semibold text-neutral-200">{member.name}</span>
                                                <span className="text-neutral-500 ml-2 font-mono">@{member.username}</span>
                                                <span className="block text-xs text-neutral-500 mt-0.5">{member.email}</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-purple-950/30 text-purple-400 border border-purple-800/30 text-xs font-medium uppercase tracking-wider">
                                                {member.role || "member"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Project & Environment Split grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Project Members */}
                                <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-neutral-200 flex items-center gap-2">
                                                <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                                                Project Members
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Active Project: {selectedProject?.name || "None"}
                                            </p>
                                        </div>
                                        <button
                                            disabled={!selectedProject}
                                            onClick={() => setIsAddProjMemberOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add Member</span>
                                        </button>
                                    </div>
                                    <div className="divide-y divide-neutral-900">
                                        {projMembers.map((member) => (
                                            <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                                                <div>
                                                    <span className="font-semibold text-neutral-200">{member.name}</span>
                                                    <span className="block text-xs text-neutral-500 font-mono mt-0.5">
                                                        @{member.username}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-neutral-400 uppercase tracking-wider">
                                                        {member.role}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveProjMember(member.userId || "")}
                                                        className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {projMembers.length === 0 && (
                                            <p className="text-sm text-neutral-500 py-4 text-center">
                                                No members assigned to this project yet.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Environment Members */}
                                <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-neutral-200 flex items-center gap-2">
                                                <Globe className="h-4.5 w-4.5 text-teal-400" />
                                                Environment Access
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Active Environment: {selectedEnvironment?.name || "None"}
                                            </p>
                                        </div>
                                        <button
                                            disabled={!selectedEnvironment}
                                            onClick={() => setIsAddEnvMemberOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add Member</span>
                                        </button>
                                    </div>
                                    <div className="divide-y divide-neutral-900">
                                        {envMembers.map((member) => (
                                            <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                                                <div>
                                                    <span className="font-semibold text-neutral-200">{member.name}</span>
                                                    <span className="block text-xs text-neutral-500 font-mono mt-0.5">
                                                        @{member.username}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-neutral-400 uppercase tracking-wider">
                                                        {member.role}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveEnvMember(member.userId || "")}
                                                        className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {envMembers.length === 0 && (
                                            <p className="text-sm text-neutral-500 py-4 text-center">
                                                No members assigned to this environment yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API KEYS PANEL */}
                    {activeTab === "apikeys" && (
                        <div className="space-y-6">
                            {/* Security Warning */}
                            <div className="flex gap-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400 max-w-3xl">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Protect your API Keys</h4>
                                    <p className="text-xs mt-1 text-amber-500/90 leading-relaxed">
                                        API Keys permit automated scripts to fetch and decrypt environment secrets. Be sure to restrict access and rotate keys regularly.
                                    </p>
                                </div>
                            </div>

                            {/* Header / Add button */}
                            <div className="flex items-center justify-between max-w-4xl">
                                <h3 className="text-base font-bold text-neutral-200">Active API Keys</h3>
                                <button
                                    onClick={() => {
                                        setGeneratedKeyResult(null);
                                        setIsNewApiKeyOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create API Key</span>
                                </button>
                            </div>

                            {/* API Keys Table */}
                            {apiKeys.length > 0 ? (
                                <div className="border border-neutral-900 rounded-xl overflow-hidden max-w-4xl bg-neutral-950/20">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400 font-semibold">
                                                <th className="px-6 py-3.5">Key Name</th>
                                                <th className="px-6 py-3.5">Created At</th>
                                                <th className="px-6 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-900">
                                            {apiKeys.map((key) => (
                                                <tr key={key.id} className="hover:bg-neutral-900/10 transition">
                                                    <td className="px-6 py-4 font-semibold text-neutral-200">
                                                        {key.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-400">
                                                        {new Date(key.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRevokeApiKey(key.id)}
                                                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 hover:underline ml-auto font-medium transition"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span>Revoke</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-dashed border-neutral-800 rounded-xl p-12 text-center max-w-4xl bg-neutral-950/10">
                                    <KeyRound className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-300">No Programmatic Keys</h3>
                                    <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                                        Create an API Key to fetch vault secrets directly inside CI/CD pipelines.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}

            {/* Create Org Modal */}
            {isCreateOrgOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Create new Organization</h3>
                        <form onSubmit={handleCreateOrg} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Acme Inc"
                                    value={newOrgForm.name}
                                    onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Vault for all environments"
                                    value={newOrgForm.description}
                                    onChange={(e) => setNewOrgForm({ ...newOrgForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOrgOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateProjOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Create new Project</h3>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="ManUp Portal"
                                    value={newProjForm.name}
                                    onChange={(e) => setNewProjForm({ ...newProjForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Backend client services"
                                    value={newProjForm.description}
                                    onChange={(e) => setNewProjForm({ ...newProjForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateProjOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Environment Modal */}
            {isCreateEnvOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Create new Environment</h3>
                        <form onSubmit={handleCreateEnvironment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Environment Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="staging"
                                    value={newEnvForm.name}
                                    onChange={(e) => setNewEnvForm({ ...newEnvForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Staging environment credentials"
                                    value={newEnvForm.description}
                                    onChange={(e) => setNewEnvForm({ ...newEnvForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateEnvOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Secret Modal */}
            {isAddSecretOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">
                            {secretForm.id ? "Edit Secret" : "Add Secret"}
                        </h3>
                        <form onSubmit={handleSaveSecret} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Secret Key
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!secretForm.id}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50 font-mono disabled:opacity-50"
                                    placeholder="API_DATABASE_URL"
                                    value={secretForm.key}
                                    onChange={(e) => setSecretForm({ ...secretForm, key: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Display Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Database connection string"
                                    value={secretForm.name}
                                    onChange={(e) => setSecretForm({ ...secretForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Secret Value
                                </label>
                                <textarea
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50 font-mono min-h-24"
                                    placeholder="postgresql://user:pass@host/db"
                                    value={secretForm.value}
                                    onChange={(e) => setSecretForm({ ...secretForm, value: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddSecretOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Save Secret
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Org User Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Invite new User</h3>
                        <form onSubmit={handleInviteUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="Alice Vance"
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="alice_vance"
                                    value={inviteForm.username}
                                    onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="alice@acme.com"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Initial Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                    placeholder="••••••••••••"
                                    value={inviteForm.password}
                                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Invite User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Project Member Modal */}
            {isAddProjMemberOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Add Project Member</h3>
                        <form onSubmit={handleAddProjMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Select Organization User
                                </label>
                                <select
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                                    value={newProjMemberForm.userId}
                                    onChange={(e) => setNewProjMemberForm({ ...newProjMemberForm, userId: e.target.value })}
                                >
                                    <option value="">Select User...</option>
                                    {unassignedOrgMembers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                {unassignedOrgMembers.length === 0 && (
                                    <p className="text-xs text-neutral-500 mt-1">
                                        All organization members are already added to this project.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProjMemberOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newProjMemberForm.userId}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Environment Member Modal */}
            {isAddEnvMemberOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Grant Environment Access</h3>
                        <form onSubmit={handleAddEnvMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Select Project Member
                                </label>
                                <select
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                                    value={newEnvMemberForm.userId}
                                    onChange={(e) => setNewEnvMemberForm({ ...newEnvMemberForm, userId: e.target.value })}
                                >
                                    <option value="">Select User...</option>
                                    {unassignedProjMembers.map((u) => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                {unassignedProjMembers.length === 0 && (
                                    <p className="text-xs text-neutral-500 mt-1">
                                        All project members are already added to this environment.
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddEnvMemberOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newEnvMemberForm.userId}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                >
                                    Grant Access
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create API Key Modal / Key Generated Success Display */}
            {isNewApiKeyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        {generatedKeyResult ? (
                            <>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-400" />
                                    API Key Generated
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-xs text-neutral-400 leading-relaxed">
                                        Make sure to copy this key now. It will not be shown again!
                                    </p>
                                    <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-200 select-all break-all">
                                        <span>{generatedKeyResult.apiKey}</span>
                                        <button
                                            onClick={() =>
                                                copyToClipboard(generatedKeyResult.apiKey, "generated_apikey")
                                            }
                                            className="text-neutral-500 hover:text-neutral-300 transition shrink-0 ml-auto"
                                        >
                                            {copiedId === "generated_apikey" ? (
                                                <Check className="h-4 w-4 text-green-400" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNewApiKeyOpen(false);
                                            setGeneratedKeyResult(null);
                                        }}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-white">Generate new API Key</h3>
                                <form onSubmit={handleGenerateApiKey} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                            Key Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-purple-500/50"
                                            placeholder="GitHub Actions CI"
                                            value={apiKeyForm.name}
                                            onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                            Expiry Duration
                                        </label>
                                        <select
                                            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                                            value={apiKeyForm.expiresDays}
                                            onChange={(e) =>
                                                setApiKeyForm({ ...apiKeyForm, expiresDays: e.target.value })
                                            }
                                        >
                                            <option value="7">7 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="365">1 Year</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsNewApiKeyOpen(false)}
                                            className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
