import React, { useState, useEffect, useMemo, useRef } from "react";
import { api, setAuthToken, setOnAuthExpired } from "./api";
import {
    Key,
    Users,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Copy,
    CopyPlus,
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
    Lock,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    UserMinus,
    Settings
} from "lucide-react";
import type { Project, Environment, Secret, ApiKey, Member } from "./types";
import Dropdown from "./components/Dropdown";

/** Picks a fresh, non-colliding key for a duplicated secret (e.g. KEY -> KEY_COPY -> KEY_COPY_2). */
const generateDuplicateKey = (baseKey: string, existingKeys: Set<string>): string => {
    let candidate = `${baseKey}_COPY`;
    let i = 2;
    while (existingKeys.has(candidate)) {
        candidate = `${baseKey}_COPY_${i}`;
        i++;
    }
    return candidate;
};

export default function App() {
    // Session State — session is driven by httpOnly cookie; we verify via /users/me on mount
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [sessionChecked, setSessionChecked] = useState<boolean>(false);
    const [currentOrg, setCurrentOrg] = useState<any>(null);

    // Sidebar: open by default on desktop, closed (drawer) by default on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
        typeof window === "undefined" || window.innerWidth >= 768
    );

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

    // Navigation Active Panel: "secrets" | "members" | "apikeys" | "settings"
    const [activeTab, setActiveTab] = useState<"secrets" | "members" | "apikeys" | "settings">("secrets");
    const [currentUser, setCurrentUser] = useState<any>(null);

    // UI Feedback
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [copiedId, setCopiedId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [revealSecretId, setRevealSecretId] = useState<string | null>(null);
    const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState<string>("");
    const [editingValue, setEditingValue] = useState<string>("");



    // Modals & Forms State
    const [isRegMode, setIsRegMode] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [authForm, setAuthForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        organizationName: ""
    });

    const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
    const [editOrgForm, setEditOrgForm] = useState({ name: "", description: "" });

    const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
    const [newProjForm, setNewProjForm] = useState({ name: "", description: "" });

    const [isEditProjOpen, setIsEditProjOpen] = useState(false);
    const [editProjForm, setEditProjForm] = useState({ name: "", description: "" });

    const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
    const [newEnvForm, setNewEnvForm] = useState({ name: "", description: "" });

    const [isEditEnvOpen, setIsEditEnvOpen] = useState(false);
    const [editEnvForm, setEditEnvForm] = useState({ name: "", description: "" });

    const [isAddSecretOpen, setIsAddSecretOpen] = useState(false);
    const [secretForm, setSecretForm] = useState({ key: "", value: "" });

    const [successMsg, setSuccessMsg] = useState<string>("");

    // Profile Settings States
    const [profileName, setProfileName] = useState("");
    const [profileUsername, setProfileUsername] = useState("");
    const [profileEmail, setProfileEmail] = useState("");

    // Project & Org Settings States
    const [projName, setProjName] = useState("");
    const [projDesc, setProjDesc] = useState("");
    const [orgName, setOrgName] = useState("");
    const [orgDesc, setOrgDesc] = useState("");

    // Danger Zone Deletion Confirmations
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteTargetType, setDeleteTargetType] = useState<"project" | "organization" | "account" | null>(null);

    useEffect(() => {
        if (currentUser) {
            setProfileName(currentUser.name || "");
            setProfileUsername(currentUser.username || "");
            setProfileEmail(currentUser.email || "");
        }
    }, [currentUser]);

    useEffect(() => {
        if (selectedProject) {
            setProjName(selectedProject.name || "");
            setProjDesc(selectedProject.description || "");
        }
    }, [selectedProject]);

    useEffect(() => {
        if (currentOrg) {
            setOrgName(currentOrg.name || "");
            setOrgDesc(currentOrg.description || "");
        }
    }, [currentOrg]);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const editingTextareaRef = useRef<HTMLTextAreaElement>(null);
    const addTextareaRef = useRef<HTMLTextAreaElement>(null);



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
    const [apiKeyForm, setApiKeyForm] = useState({ name: "", expiresDays: "30", rateLimit: "60" });
    const [generatedKeyResult, setGeneratedKeyResult] = useState<{ id: string; name: string; apiKey: string; rateLimit?: number } | null>(null);

    const [selectedSecretIds, setSelectedSecretIds] = useState<string[]>([]);
    const [isCopySecretsOpen, setIsCopySecretsOpen] = useState(false);
    const [targetCopyEnvId, setTargetCopyEnvId] = useState("");
    const [copyProgress, setCopyProgress] = useState(false);

    // Delete confirmation modal state
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
    const [deleteProgress, setDeleteProgress] = useState(false);

    const [isDeleteEnvOpen, setIsDeleteEnvOpen] = useState(false);
    const [deleteEnvProgress, setDeleteEnvProgress] = useState(false);

    // Generic styled confirmation dialog — replaces native confirm() popups app-wide
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        icon?: React.ComponentType<{ className?: string }>;
        onConfirm: () => Promise<void>;
    } | null>(null);
    const [confirmDialogBusy, setConfirmDialogBusy] = useState(false);

    const openConfirm = (opts: {
        title: string;
        message: string;
        confirmLabel?: string;
        icon?: React.ComponentType<{ className?: string }>;
        onConfirm: () => Promise<void>;
    }) => setConfirmDialog(opts);

    const runConfirmDialog = async () => {
        if (!confirmDialog) return;
        try {
            setConfirmDialogBusy(true);
            setLoading(true);
            await confirmDialog.onConfirm();
            setConfirmDialog(null);
        } catch (err: any) {
            setError(err.message || "Action failed");
        } finally {
            setConfirmDialogBusy(false);
            setLoading(false);
        }
    };

    // On mount: register the auth-expiry handler, then verify cookie session
    useEffect(() => {
        // When any API call detects a fully-expired session mid-use,
        // call handleLogout() to show the login screen — NO page reload.
        setOnAuthExpired(() => {
            setIsAuthenticated(false);
            setCurrentOrg(null);
            setProjects([]);
            setSelectedProject(null);
            setEnvironments([]);
            setSelectedEnvironment(null);
            setSecrets([]);
            setSessionChecked(true);
        });

        // Verify existing cookie session (won't trigger onAuthExpired — errors are caught below)
        (async () => {
            try {
                await api.getCurrentOrg();
                setIsAuthenticated(true);
                loadInitialData();
            } catch {
                // Not logged in — just show the login screen, no reload
                setIsAuthenticated(false);
            } finally {
                setSessionChecked(true);
            }
        })();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError("");
            const [org, user, projectsList] = await Promise.all([
                api.getCurrentOrg(),
                api.getCurrentUser(),
                api.listProjects()
            ]);
            setCurrentOrg(org);
            setCurrentUser(user);
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
        setSelectedSecretIds([]);
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

        if (isRegMode && authForm.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            if (isRegMode) {
                await api.register(authForm);
                setIsAuthenticated(true);
                await loadInitialData();
            } else {
                await api.login({
                    username: authForm.username,
                    password: authForm.password
                });
                setIsAuthenticated(true);
                await loadInitialData();
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try { await api.logout(); } catch { /* ignore */ }
        setAuthToken("");
        setIsAuthenticated(false);
        setCurrentOrg(null);
        setCurrentUser(null);
        setProjects([]);
        setSelectedProject(null);
        setEnvironments([]);
        setSelectedEnvironment(null);
        setSecrets([]);
    };

    // Settings Action Handlers
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            const updated = await api.updateCurrentUser({
                name: profileName,
                username: profileUsername,
                email: profileEmail
            });
            setCurrentUser(updated);
            setSuccessMsg("Profile updated successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProjectDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            const updated = await api.updateProject(selectedProject.id, {
                name: projName,
                description: projDesc
            });
            setSelectedProject(updated);
            setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSuccessMsg("Project details updated successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to update project");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOrgDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            const updated = await api.updateCurrentOrg({
                name: orgName,
                description: orgDesc
            });
            setCurrentOrg(updated);
            setSuccessMsg("Organization details updated successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to update organization");
        } finally {
            setLoading(false);
        }
    };

    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(secrets, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${selectedProject?.name || "project"}_${selectedEnvironment?.name || "env"}_secrets.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSuccessMsg("Secrets exported to JSON successfully!");
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Key,Value\n";
        secrets.forEach(s => {
            const escapedKey = s.key.replace(/"/g, '""');
            const escapedValue = s.value.replace(/"/g, '""');
            csvContent += `"${escapedKey}","${escapedValue}"\n`;
        });
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", encodeURI(csvContent));
        downloadAnchor.setAttribute("download", `${selectedProject?.name || "project"}_${selectedEnvironment?.name || "env"}_secrets.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setSuccessMsg("Secrets exported to CSV successfully!");
    };

    const executeDeleteProject = async () => {
        if (!selectedProject) return;
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            await api.deleteProject(selectedProject.id);
            const remainingProjects = projects.filter(p => p.id !== selectedProject.id);
            setProjects(remainingProjects);
            if (remainingProjects.length > 0) {
                setSelectedProject(remainingProjects[0]);
            } else {
                setSelectedProject(null);
            }
            setDeleteTargetType(null);
            setDeleteConfirmText("");
            setActiveTab("secrets");
            setSuccessMsg("Project deleted permanently.");
        } catch (err: any) {
            setError(err.message || "Failed to delete project");
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteOrg = async () => {
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            await api.deleteCurrentOrg();
            setDeleteTargetType(null);
            setDeleteConfirmText("");
            await handleLogout();
        } catch (err: any) {
            setError(err.message || "Failed to delete organization");
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteAccount = async () => {
        setError("");
        setSuccessMsg("");
        try {
            setLoading(true);
            await api.deleteCurrentUser();
            setDeleteTargetType(null);
            setDeleteConfirmText("");
            await handleLogout();
        } catch (err: any) {
            setError(err.message || "Failed to delete user account");
        } finally {
            setLoading(false);
        }
    };

    // CRUD creation actions
    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.updateCurrentOrg(editOrgForm);
            setCurrentOrg((prev: any) => ({ ...prev, ...editOrgForm }));
            setIsEditOrgOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to update organization");
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

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        try {
            setLoading(true);
            await api.updateProject(selectedProject.id, editProjForm);
            const updated = { ...selectedProject, ...editProjForm };
            setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updated : p)));
            setSelectedProject(updated);
            setIsEditProjOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to update project");
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

    const handleUpdateEnvironment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEnvironment) return;
        try {
            setLoading(true);
            await api.updateEnvironment(selectedEnvironment.id, editEnvForm);
            const updated = { ...selectedEnvironment, ...editEnvForm };
            setEnvironments((prev) => prev.map((env) => (env.id === selectedEnvironment.id ? updated : env)));
            setSelectedEnvironment(updated);
            setIsEditEnvOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to update environment");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEnvironment = () => {
        if (!selectedEnvironment) return;
        setIsDeleteEnvOpen(true);
    };

    const confirmDeleteEnvironment = async () => {
        if (!selectedProject || !selectedEnvironment) return;
        try {
            setDeleteEnvProgress(true);
            setLoading(true);
            await api.deleteEnvironment(selectedEnvironment.id);
            await loadEnvironments(selectedProject.id);
            setIsDeleteEnvOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to delete environment");
        } finally {
            setDeleteEnvProgress(false);
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
                value: secretForm.value
            });
            setIsAddSecretOpen(false);
            setSecretForm({ key: "", value: "" });
            await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to set secret");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSecret = async (secret: Secret) => {
        if (!selectedEnvironment) return;
        if (!editingKey.trim()) {
            setError("Secret key cannot be empty");
            return;
        }
        try {
            setLoading(true);
            await api.updateSecret(secret.id, {
                key: editingKey !== secret.key ? editingKey : undefined,
                value: editingValue
            });
            setEditingSecretId(null);
            await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to update secret");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSecret = async (id: string) => {
        setDeleteConfirm({ type: 'single', id });
    };

    const handleBulkDelete = () => {
        if (selectedSecretIds.length === 0) return;
        setDeleteConfirm({ type: 'bulk' });
    };

    const handleDuplicateSecret = async (secret: Secret) => {
        if (!selectedEnvironment) return;
        try {
            setLoading(true);
            const existingKeys = new Set(secrets.map((s) => s.key));
            const newKey = generateDuplicateKey(secret.key, existingKeys);
            await api.setSecret({ environmentId: selectedEnvironment.id, key: newKey, value: secret.value });
            await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to duplicate secret");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDuplicateSecrets = async () => {
        if (!selectedEnvironment || selectedSecretIds.length === 0) return;
        try {
            setLoading(true);
            const existingKeys = new Set(secrets.map((s) => s.key));
            const toDuplicate = secrets.filter((s) => selectedSecretIds.includes(s.id));
            for (const secret of toDuplicate) {
                const newKey = generateDuplicateKey(secret.key, existingKeys);
                existingKeys.add(newKey);
                await api.setSecret({ environmentId: selectedEnvironment.id, key: newKey, value: secret.value });
            }
            setSelectedSecretIds([]);
            await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to duplicate secrets");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setDeleteProgress(true);
            setLoading(true);
            if (deleteConfirm.type === 'single' && deleteConfirm.id) {
                await api.deleteSecret(deleteConfirm.id);
                setSelectedSecretIds(prev => prev.filter(id => id !== deleteConfirm.id));
            } else if (deleteConfirm.type === 'bulk') {
                for (const id of selectedSecretIds) {
                    await api.deleteSecret(id);
                }
                setSelectedSecretIds([]);
            }
            if (selectedEnvironment) await loadSecrets(selectedEnvironment.id);
        } catch (err: any) {
            setError(err.message || "Failed to delete secret(s)");
        } finally {
            setDeleteProgress(false);
            setLoading(false);
            setDeleteConfirm(null);
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

    const handleRemoveProjMember = (userId: string) => {
        if (!selectedProject) return;
        openConfirm({
            title: "Remove Member?",
            message: "This removes their access to the project. This action cannot be undone.",
            confirmLabel: "Remove",
            icon: UserMinus,
            onConfirm: async () => {
                await api.deleteProjectMember(selectedProject.id, userId);
                await loadMembersData();
            }
        });
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

    const handleRemoveEnvMember = (userId: string) => {
        if (!selectedEnvironment) return;
        openConfirm({
            title: "Remove Member?",
            message: "This removes their access to the environment. This action cannot be undone.",
            confirmLabel: "Remove",
            icon: UserMinus,
            onConfirm: async () => {
                await api.deleteEnvironmentMember(selectedEnvironment.id, userId);
                await loadMembersData();
            }
        });
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
                expiresAt: expiry.toISOString(),
                rateLimit: parseInt(apiKeyForm.rateLimit) || 60
            });

            setGeneratedKeyResult(res);
            setApiKeyForm({ name: "", expiresDays: "30", rateLimit: "60" });
            await loadApiKeys();
        } catch (err: any) {
            setError(err.message || "Failed to generate API Key");
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeApiKey = (id: string) => {
        openConfirm({
            title: "Revoke API Key?",
            message: "Any scripts or integrations using this key will immediately lose access. This action cannot be undone.",
            confirmLabel: "Revoke",
            icon: KeyRound,
            onConfirm: async () => {
                await api.deleteApiKey(id);
                await loadApiKeys();
            }
        });
    };

    const handleCopySecrets = async () => {
        if (selectedSecretIds.length === 0) return;
        if (!targetCopyEnvId) {
            setError("Please select a target environment.");
            return;
        }

        try {
            setCopyProgress(true);
            setLoading(true);

            // Filter secrets that are selected
            const secretsToCopy = secrets.filter(s => selectedSecretIds.includes(s.id));

            // Copy each selected secret to target environment
            for (const s of secretsToCopy) {
                await api.setSecret({
                    environmentId: targetCopyEnvId,
                    key: s.key,
                    value: s.value,
                    name: s.name
                });
            }

            // Reset state
            setSelectedSecretIds([]);
            setIsCopySecretsOpen(false);
            setTargetCopyEnvId("");
            
            // Reload secrets if target env is the active one
            if (selectedEnvironment && targetCopyEnvId === selectedEnvironment.id) {
                await loadSecrets(selectedEnvironment.id);
            }
        } catch (err: any) {
            setError(err.message || "Failed to copy secrets.");
        } finally {
            setCopyProgress(false);
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

    // Render loading while checking session cookie
    if (!sessionChecked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0b0b0f]">
                <div className="text-neutral-500 text-sm animate-pulse">Verifying session...</div>
            </div>
        );
    }

    // Render Sign-in/Sign-up if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0b0b0f] px-4 relative overflow-hidden">
                {/* Orange-Red Background Glow */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

                <div className="w-full max-w-md border border-neutral-800 bg-neutral-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600/10 border border-orange-500/30 text-orange-400 mb-3">
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
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                        placeholder="Alice Vance"
                                        value={authForm.name}
                                        onChange={(e) => { if (error) setError(""); setAuthForm({ ...authForm, name: e.target.value }); }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                        Initial Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                        placeholder="Acme Corp"
                                        value={authForm.organizationName}
                                        onChange={(e) => { if (error) setError(""); setAuthForm({ ...authForm, organizationName: e.target.value }); }}
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
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                placeholder="alice_vance"
                                value={authForm.username}
                                onChange={(e) => { if (error) setError(""); setAuthForm({ ...authForm, username: e.target.value }); }}
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="alice@acme.com"
                                    value={authForm.email}
                                    onChange={(e) => { if (error) setError(""); setAuthForm({ ...authForm, email: e.target.value }); }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={isRegMode ? 8 : undefined}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 pr-10 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="••••••••••••"
                                    value={authForm.password}
                                    onChange={(e) => { if (error) setError(""); setAuthForm({ ...authForm, password: e.target.value }); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300 transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {isRegMode && (
                                <p className="text-[11px] text-neutral-500 mt-1">At least 8 characters</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 mt-2"
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
                            className="text-orange-400 hover:text-orange-300 font-medium transition"
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
            {/* Mobile backdrop — closes the drawer, never shown on desktop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar — off-canvas drawer on mobile, width-collapsible panel on desktop */}
            <aside
                className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-[#0e0e13] border-r border-neutral-900 flex flex-col shrink-0 overflow-hidden transition-transform md:transition-[width] duration-200 ease-in-out ${
                    isSidebarOpen ? "translate-x-0 md:w-72" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0"
                }`}
                aria-hidden={!isSidebarOpen}
            >
                {/* Brand / Logo */}
                <div className="h-16 border-b border-neutral-900 flex items-center px-6 gap-3 w-72 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600/10 border border-orange-500/30 text-orange-400">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white font-display leading-none">
                            ManUp
                        </h1>
                        <span className="text-[10px] text-orange-400 font-medium tracking-wider uppercase">
                            Secure Vault
                        </span>
                    </div>
                </div>

                {/* Switchers Section */}
                <div className="p-4 border-b border-neutral-900 space-y-4 w-72 shrink-0">
                    {/* Organization Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Organization
                            </span>
                            <button
                                onClick={() => {
                                    setEditOrgForm({ name: currentOrg?.name || "", description: currentOrg?.description || "" });
                                    setIsEditOrgOpen(true);
                                }}
                                disabled={!currentOrg}
                                className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                                title="Edit Organization"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-sm text-neutral-200">
                            <Building2 className="h-4 w-4 text-orange-400 shrink-0" />
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (!selectedProject) return;
                                        setEditProjForm({ name: selectedProject.name, description: selectedProject.description || "" });
                                        setIsEditProjOpen(true);
                                    }}
                                    disabled={!selectedProject}
                                    className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                                    title="Edit Project"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setIsCreateProjOpen(true)}
                                    className="text-orange-400 hover:text-orange-300 transition"
                                    title="Create Project"
                                >
                                    <PlusCircle className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                        <Dropdown
                            options={projects.map((p) => ({ id: p.id, label: p.name }))}
                            value={selectedProject?.id || ""}
                            onChange={(id) => {
                                const proj = projects.find((p) => p.id === id);
                                if (proj) setSelectedProject(proj);
                            }}
                            placeholder="No Projects Available"
                        />
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 p-4 space-y-1 w-72 shrink-0">
                    <button
                        onClick={() => setActiveTab("secrets")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === "secrets"
                                ? "bg-orange-600/10 border border-orange-500/30 text-orange-400"
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
                                ? "bg-orange-600/10 border border-orange-500/30 text-orange-400"
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
                                ? "bg-orange-600/10 border border-orange-500/30 text-orange-400"
                                : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                        }`}
                    >
                        <KeyRound className="h-4.5 w-4.5" />
                        <span>API Keys</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                            activeTab === "settings"
                                ? "bg-orange-600/10 border border-orange-500/30 text-orange-400"
                                : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                        }`}
                    >
                        <Settings className="h-4.5 w-4.5" />
                        <span>Settings</span>
                    </button>
                </nav>

                {/* User footer & Logout */}
                <div className="p-4 border-t border-neutral-900 bg-neutral-950/40 flex items-center justify-between w-72 shrink-0">
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
                <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-4 md:px-8 shrink-0 bg-[#0e0e13]/60 backdrop-blur gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setIsSidebarOpen((v) => !v)}
                            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition shrink-0"
                            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                        </button>
                        <h2 className="text-lg font-bold tracking-tight text-white font-display truncate">
                            {activeTab === "secrets" && "Secrets Vault"}
                            {activeTab === "members" && "Access & RBAC Memberships"}
                            {activeTab === "apikeys" && "Programmatic API Keys"}
                            {activeTab === "settings" && "Settings"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                        {loading && (
                            <span className="flex items-center gap-1.5 text-xs text-orange-400 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
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
                                <div className="flex items-center gap-2">
                                    <div className="w-40">
                                        <Dropdown
                                            variant="compact"
                                            options={environments.map((env) => ({ id: env.id, label: env.name }))}
                                            value={selectedEnvironment?.id || ""}
                                            onChange={(id) => {
                                                const env = environments.find((x) => x.id === id);
                                                if (env) setSelectedEnvironment(env);
                                            }}
                                            placeholder="No Environments"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!selectedEnvironment) return;
                                            setEditEnvForm({ name: selectedEnvironment.name, description: selectedEnvironment.description || "" });
                                            setIsEditEnvOpen(true);
                                        }}
                                        disabled={!selectedEnvironment}
                                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 text-neutral-400 hover:text-orange-400 transition disabled:opacity-50"
                                        title="Edit Environment"
                                    >
                                        <Edit2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                        onClick={handleDeleteEnvironment}
                                        disabled={!selectedEnvironment}
                                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 transition disabled:opacity-50"
                                        title="Delete Environment"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                        onClick={() => setIsCreateEnvOpen(true)}
                                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 text-neutral-400 hover:text-orange-400 transition"
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
                                            className="bg-neutral-900 border border-neutral-850 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-orange-500/50 w-60"
                                        />
                                    </div>

                                    {/* Selection action buttons */}
                                    {selectedSecretIds.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const otherEnvs = environments.filter(e => e.id !== selectedEnvironment?.id);
                                                    if (otherEnvs.length > 0) setTargetCopyEnvId(otherEnvs[0].id);
                                                    setIsCopySecretsOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 text-neutral-300 hover:text-white rounded-lg text-sm font-semibold transition"
                                            >
                                                <Copy className="h-4 w-4 text-orange-400" />
                                                <span>Copy ({selectedSecretIds.length})</span>
                                            </button>
                                            <button
                                                onClick={handleBulkDuplicateSecrets}
                                                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 text-neutral-300 hover:text-white rounded-lg text-sm font-semibold transition"
                                            >
                                                <CopyPlus className="h-4 w-4 text-orange-400" />
                                                <span>Duplicate ({selectedSecretIds.length})</span>
                                            </button>
                                            <button
                                                onClick={handleBulkDelete}
                                                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 text-neutral-300 hover:text-red-400 rounded-lg text-sm font-semibold transition"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                                <span>Delete ({selectedSecretIds.length})</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Add Secret Trigger */}
                                    <button
                                        onClick={() => {
                                            setSecretForm({ key: "", value: "" });
                                            setIsAddSecretOpen(true);
                                        }}
                                        disabled={!selectedEnvironment}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
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
                                                <th className="pl-6 pr-2 py-3.5 w-12">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-neutral-800 bg-neutral-950 text-orange-600 focus:ring-orange-500/50 h-4 w-4 cursor-pointer"
                                                        checked={filteredSecrets.length > 0 && selectedSecretIds.length === filteredSecrets.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSecretIds(filteredSecrets.map(s => s.id));
                                                            } else {
                                                                setSelectedSecretIds([]);
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th className="px-6 py-3.5">Secret Key</th>
                                                <th className="px-6 py-3.5">Value (Decrypted)</th>
                                                <th className="px-6 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-900">
                                            {filteredSecrets.map((secret) => {
                                                const isRevealed = revealSecretId === secret.id;
                                                const isEditing = editingSecretId === secret.id;
                                                return (
                                                    <tr key={secret.id} className={`hover:bg-neutral-900/10 transition ${selectedSecretIds.includes(secret.id) ? 'bg-orange-950/10' : ''}`}>
                                                        <td className="pl-6 pr-2 py-4 w-12">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-neutral-800 bg-neutral-950 text-orange-600 focus:ring-orange-500/50 h-4 w-4 cursor-pointer"
                                                                checked={selectedSecretIds.includes(secret.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedSecretIds([...selectedSecretIds, secret.id]);
                                                                    } else {
                                                                        setSelectedSecretIds(selectedSecretIds.filter(id => id !== secret.id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-bold text-neutral-200">
                                                            <input
                                                                autoFocus={isEditing}
                                                                type="text"
                                                                readOnly={!isEditing}
                                                                className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none font-mono font-bold transition-all ${
                                                                    isEditing 
                                                                        ? "border-orange-500/50 bg-neutral-950 text-neutral-100" 
                                                                        : "border-neutral-800 bg-neutral-950/40 text-neutral-300 cursor-pointer hover:border-neutral-700 hover:text-neutral-200"
                                                                }`}
                                                                value={isEditing ? editingKey : secret.key}
                                                                onChange={(e) => {
                                                                    if (isEditing) {
                                                                        setEditingKey(e.target.value.toUpperCase());
                                                                    }
                                                                }}
                                                                onClick={() => {
                                                                    if (!isEditing) {
                                                                        setEditingSecretId(secret.id);
                                                                        setEditingKey(secret.key);
                                                                        setEditingValue(secret.value);
                                                                        setRevealSecretId(secret.id);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleUpdateSecret(secret);
                                                                    if (e.key === "Escape") setEditingSecretId(null);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 font-mono max-w-md">
                                                            <div className="relative flex items-center w-full">
                                                                <textarea
                                                                    ref={(el) => {
                                                                        if (isEditing) {
                                                                            editingTextareaRef.current = el;
                                                                        }
                                                                        if (el) {
                                                                            el.style.height = "auto";
                                                                            el.style.height = `${el.scrollHeight}px`;
                                                                        }
                                                                    }}
                                                                    readOnly={!isEditing}
                                                                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none font-mono transition-all resize-none ${
                                                                        isEditing 
                                                                            ? "border-orange-500/50 bg-neutral-950 text-neutral-100 overflow-y-auto max-h-56 pr-2.5" 
                                                                            : "border-neutral-800 bg-neutral-950/40 text-neutral-300 cursor-pointer hover:border-neutral-700 hover:text-neutral-200 overflow-hidden pr-14"
                                                                    }`}
                                                                    rows={1}
                                                                    value={isEditing ? editingValue : (isRevealed ? secret.value : "••••••••••••••••")}
                                                                    onChange={(e) => {
                                                                        if (isEditing) {
                                                                            setEditingValue(e.target.value);
                                                                        }
                                                                    }}
                                                                    onClick={() => {
                                                                        if (!isEditing) {
                                                                            setEditingSecretId(secret.id);
                                                                            setEditingKey(secret.key);
                                                                            setEditingValue(secret.value);
                                                                            setRevealSecretId(secret.id);
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            handleUpdateSecret(secret);
                                                                        }
                                                                        if (e.key === "Escape") setEditingSecretId(null);
                                                                    }}
                                                                />
                                                                {!isEditing && (
                                                                    <div className="absolute right-2.5 flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-neutral-800/40">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setRevealSecretId(isRevealed ? null : secret.id);
                                                                            }}
                                                                            className="text-neutral-500 hover:text-neutral-300 transition"
                                                                            title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                                                                        >
                                                                            {isRevealed ? (
                                                                                <EyeOff className="h-3.5 w-3.5" />
                                                                            ) : (
                                                                                <Eye className="h-3.5 w-3.5" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                copyToClipboard(secret.value, secret.id);
                                                                            }}
                                                                            className="text-neutral-500 hover:text-neutral-300 transition relative"
                                                                            title="Copy Secret"
                                                                        >
                                                                            {copiedId === secret.id ? (
                                                                                <Check className="h-3.5 w-3.5 text-green-400" />
                                                                            ) : (
                                                                                <Copy className="h-3.5 w-3.5" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleUpdateSecret(secret)}
                                                                            className="p-1 rounded hover:bg-neutral-900 text-green-400 hover:text-green-300 transition"
                                                                            title="Save"
                                                                        >
                                                                            <Check className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingSecretId(null)}
                                                                            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
                                                                            title="Cancel"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingSecretId(secret.id);
                                                                                setEditingKey(secret.key);
                                                                                setEditingValue(secret.value);
                                                                                setRevealSecretId(secret.id);
                                                                            }}
                                                                            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
                                                                            title="Edit Secret"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDuplicateSecret(secret)}
                                                                            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
                                                                            title="Duplicate Secret"
                                                                        >
                                                                            <CopyPlus className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSecret(secret.id)}
                                                                            className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-red-400 transition"
                                                                            title="Delete Secret"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </>
                                                                )}
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
                                            <Building2 className="h-5 w-5 text-orange-400" />
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
                                            <span className="px-2 py-0.5 rounded bg-orange-950/30 text-orange-400 border border-orange-800/30 text-xs font-medium uppercase tracking-wider">
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
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-sm font-semibold transition"
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
                                                <th className="px-6 py-3.5">Rate Limit</th>
                                                <th className="px-6 py-3.5">Usage Metrics</th>
                                                <th className="px-6 py-3.5">Expires At</th>
                                                <th className="px-6 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-900">
                                            {apiKeys.map((key) => {
                                                const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
                                                return (
                                                    <tr key={key.id} className="hover:bg-neutral-900/10 transition">
                                                        <td className="px-6 py-4 font-semibold text-neutral-200">
                                                            {key.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-neutral-300 font-mono text-xs">
                                                            {key.rateLimit === 0 ? "Unlimited" : key.rateLimit ? `${key.rateLimit} req/min` : "60 req/min"}
                                                        </td>
                                                        <td className="px-6 py-4 text-neutral-400">
                                                            <div className="flex flex-col gap-0.5 text-xs">
                                                                <span>Requests: <strong className="text-neutral-200">{key.requestCount || 0}</strong></span>
                                                                <span className="text-neutral-500 text-[11px]">
                                                                    Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-neutral-400">
                                                            {key.expiresAt ? (
                                                                <span className={isExpired ? "text-red-500 font-semibold" : "text-neutral-400"}>
                                                                    {new Date(key.expiresAt).toLocaleDateString()} {isExpired && "(Expired)"}
                                                                </span>
                                                            ) : (
                                                                <span className="text-neutral-500">Never</span>
                                                            )}
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
                                                );
                                            })}
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
                    {activeTab === "settings" && (
                        <div className="space-y-8 max-w-4xl pb-16">
                            {/* Success Notification */}
                            {successMsg && (
                                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2 animate-fadeIn">
                                    <Check className="h-4 w-4 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            {/* Section 1: User Profile Settings */}
                            <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-base font-bold text-white">Profile Settings</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">Manage your user identity and email details.</p>
                                </div>
                                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                            value={profileUsername}
                                            onChange={(e) => setProfileUsername(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Section 2: Project Settings */}
                            {selectedProject && (
                                <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
                                    <div>
                                        <h3 className="text-base font-bold text-white">Project Settings</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Modify workspace environment context and naming.</p>
                                    </div>
                                    <form onSubmit={handleSaveProjectDetails} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                Project Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                                value={projName}
                                                onChange={(e) => setProjName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                                value={projDesc}
                                                onChange={(e) => setProjDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
                                            >
                                                Save Project
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Section 3: Organization Settings */}
                            {currentOrg && (
                                <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
                                    <div>
                                        <h3 className="text-base font-bold text-white">Organization Settings</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Rename org namespace and core configurations.</p>
                                    </div>
                                    <form onSubmit={handleSaveOrgDetails} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                Organization Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                                value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                                value={orgDesc}
                                                onChange={(e) => setOrgDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
                                            >
                                                Save Organization
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Section 4: Data Export */}
                            <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-base font-bold text-white">Data Export</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">Export decrypted environment secret configurations to files.</p>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handleExportJSON}
                                        className="px-4 py-2.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 rounded-lg text-sm font-medium transition flex items-center gap-2"
                                    >
                                        <Globe className="h-4 w-4 text-orange-500" />
                                        <span>Export as JSON</span>
                                    </button>
                                    <button
                                        onClick={handleExportCSV}
                                        className="px-4 py-2.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 rounded-lg text-sm font-medium transition flex items-center gap-2"
                                    >
                                        <Globe className="h-4 w-4 text-orange-500" />
                                        <span>Export as CSV</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section 5: Danger Zone */}
                            <div className="border border-red-500/20 bg-red-950/5 rounded-2xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-base font-bold text-red-500">Danger Zone</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">Irreversible and destructive actions. Proceed with caution.</p>
                                </div>
                                <div className="divide-y divide-neutral-900">
                                    {selectedProject && (
                                        <div className="py-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-neutral-200">Delete Project</h4>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Permanently delete project <strong className="text-neutral-300">"{selectedProject.name}"</strong> and all its environments & secrets.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDeleteTargetType("project");
                                                    setDeleteConfirmText("");
                                                }}
                                                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
                                            >
                                                Delete Project
                                            </button>
                                        </div>
                                    )}

                                    {currentOrg && (
                                        <div className="py-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-neutral-200">Delete Organization</h4>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Permanently delete organization <strong className="text-neutral-300">"{currentOrg.name}"</strong> and all associated resources.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDeleteTargetType("organization");
                                                    setDeleteConfirmText("");
                                                }}
                                                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
                                            >
                                                Delete Org
                                            </button>
                                        </div>
                                    )}

                                    <div className="py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-neutral-200">Delete Account</h4>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Wipe your profile information and purge your user credentials permanently.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setDeleteTargetType("account");
                                                setDeleteConfirmText("");
                                            }}
                                            className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}

            {/* Danger Zone Deletion Confirmation Modal */}
            {deleteTargetType !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="w-full max-w-md border border-red-500/20 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <AlertCircle className="h-6 w-6" />
                            <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            This action is permanent and cannot be undone. Please confirm by typing{" "}
                            <strong className="text-white font-mono select-all bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                                {deleteTargetType === "project" && selectedProject?.name}
                                {deleteTargetType === "organization" && currentOrg?.name}
                                {deleteTargetType === "account" && "DELETE MY ACCOUNT"}
                            </strong>{" "}
                            below.
                        </p>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500/50 font-mono"
                            placeholder="Type to confirm..."
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteTargetType(null);
                                    setDeleteConfirmText("");
                                }}
                                className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={
                                    (deleteTargetType === "project" && deleteConfirmText !== selectedProject?.name) ||
                                    (deleteTargetType === "organization" && deleteConfirmText !== currentOrg?.name) ||
                                    (deleteTargetType === "account" && deleteConfirmText !== "DELETE MY ACCOUNT")
                                }
                                onClick={() => {
                                    if (deleteTargetType === "project") executeDeleteProject();
                                    else if (deleteTargetType === "organization") executeDeleteOrg();
                                    else if (deleteTargetType === "account") executeDeleteAccount();
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Org Modal */}
            {isEditOrgOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Edit Organization</h3>
                        <form onSubmit={handleUpdateOrg} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="Acme Inc"
                                    value={editOrgForm.name}
                                    onChange={(e) => setEditOrgForm({ ...editOrgForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="Vault for all environments"
                                    value={editOrgForm.description}
                                    onChange={(e) => setEditOrgForm({ ...editOrgForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOrgOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Save Changes
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {isEditProjOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Edit Project</h3>
                        <form onSubmit={handleUpdateProject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="ManUp Portal"
                                    value={editProjForm.name}
                                    onChange={(e) => setEditProjForm({ ...editProjForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="Backend client services"
                                    value={editProjForm.description}
                                    onChange={(e) => setEditProjForm({ ...editProjForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProjOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Save Changes
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Environment Modal */}
            {isEditEnvOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Edit Environment</h3>
                        <form onSubmit={handleUpdateEnvironment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Environment Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="staging"
                                    value={editEnvForm.name}
                                    onChange={(e) => setEditEnvForm({ ...editEnvForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                    placeholder="Staging environment credentials"
                                    value={editEnvForm.description}
                                    onChange={(e) => setEditEnvForm({ ...editEnvForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditEnvOpen(false)}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-950/50 border border-red-500/30 shrink-0">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    {deleteConfirm.type === 'bulk'
                                        ? `Delete ${selectedSecretIds.length} Secret${selectedSecretIds.length > 1 ? 's' : ''}?`
                                        : 'Delete Secret?'}
                                </h3>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    {deleteConfirm.type === 'bulk'
                                        ? 'This will permanently delete all selected secrets. This action cannot be undone.'
                                        : 'This will permanently remove this secret. This action cannot be undone.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleteProgress}
                                className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteProgress}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleteProgress ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Environment Confirmation Modal */}
            {isDeleteEnvOpen && selectedEnvironment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-950/50 border border-red-500/30 shrink-0">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    Delete Environment "{selectedEnvironment.name}"?
                                </h3>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    This permanently deletes all secrets in this environment. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                onClick={() => setIsDeleteEnvOpen(false)}
                                disabled={deleteEnvProgress}
                                className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteEnvironment}
                                disabled={deleteEnvProgress}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleteEnvProgress ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generic Confirmation Modal — used for API key revoke, member removal, etc. */}
            {confirmDialog && (() => {
                const Icon = confirmDialog.icon || Trash2;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-sm border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-950/50 border border-red-500/30 shrink-0">
                                    <Icon className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">{confirmDialog.message}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    disabled={confirmDialogBusy}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={runConfirmDialog}
                                    disabled={confirmDialogBusy}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {confirmDialogBusy ? "Working..." : (confirmDialog.confirmLabel || "Confirm")}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Copy Secrets Modal */}
            {isCopySecretsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Copy className="h-5 w-5 text-orange-400" />
                            <span>Copy Secrets to Environment</span>
                        </h3>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                            This will copy the <strong>{selectedSecretIds.length}</strong> selected secrets from the current environment (<strong>{selectedEnvironment?.name}</strong>) to the destination environment. Note: Existing secrets with matching keys in the destination environment will be updated.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Target Environment
                                </label>
                                <select
                                    value={targetCopyEnvId}
                                    onChange={(e) => setTargetCopyEnvId(e.target.value)}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                >
                                    {environments
                                        .filter((e) => e.id !== selectedEnvironment?.id)
                                        .map((env) => (
                                            <option key={env.id} value={env.id}>
                                                {env.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCopySecretsOpen(false);
                                        setTargetCopyEnvId("");
                                    }}
                                    className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
                                    disabled={copyProgress}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCopySecrets}
                                    disabled={copyProgress || !targetCopyEnvId}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {copyProgress ? "Copying..." : "Copy Secrets"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Secret Modal */}
            {isAddSecretOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Add Secret</h3>
                        <form onSubmit={handleSaveSecret} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Secret Key
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono"
                                    placeholder="API_DATABASE_URL"
                                    value={secretForm.key}
                                    onChange={(e) => setSecretForm({ ...secretForm, key: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                    Secret Value
                                </label>
                                <textarea
                                    ref={(el) => {
                                        addTextareaRef.current = el;
                                        if (el) {
                                            el.style.height = "auto";
                                            el.style.height = `${el.scrollHeight}px`;
                                        }
                                    }}
                                    required
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono min-h-24 max-h-56 resize-none overflow-y-auto"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
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
                                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
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
                                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
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
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
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
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
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
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
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
                                            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
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
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                            Rate Limit (requests per minute)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                                            placeholder="60"
                                            value={apiKeyForm.rateLimit}
                                            onChange={(e) => setApiKeyForm({ ...apiKeyForm, rateLimit: e.target.value })}
                                        />
                                        <span className="text-[11px] text-neutral-500 mt-1 block">Set to 0 for unlimited requests.</span>
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
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
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
