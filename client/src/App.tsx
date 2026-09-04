import React, { useState, useEffect, useMemo } from 'react';
import { api, setAuthToken, setOnAuthExpired } from './api';
import { LogOut, AlertCircle, Trash2, UserMinus, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import type { Project, Environment, Secret, ApiKey, Member } from './types';
import type { ThemeMode } from './lib/theme';
import { getStoredTheme, applyTheme } from './lib/theme';

// Modals
import ConfirmModal from './components/modals/ConfirmModal';
import DangerZoneConfirmModal from './components/modals/DangerZoneConfirmModal';
import CopySecretsModal from './components/modals/CopySecretsModal';
import EditOrgModal from './components/modals/EditOrgModal';
import NewApiKeyModal from './components/modals/NewApiKeyModal';
import ProjectModal from './components/modals/ProjectModal';
import NewEnvModal from './components/modals/NewEnvModal';
import AddSecretModal from './components/modals/AddSecretModal';
import InviteUserModal from './components/modals/InviteUserModal';
import AddProjMemberModal from './components/modals/AddProjMemberModal';
import AddEnvMemberModal from './components/modals/AddEnvMemberModal';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Views
import SecretsView from './components/views/SecretsView';
import MembersView from './components/views/MembersView';
import ApiKeysView from './components/views/ApiKeysView';
import SettingsView from './components/views/SettingsView';

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

  // Theme state ('light' | 'dark' | 'system')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sidebar: open by default on desktop, closed (drawer) by default on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
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
  const [activeTab, setActiveTab] = useState<'secrets' | 'members' | 'apikeys' | 'settings'>(
    'secrets',
  );
  const [currentUser, setCurrentUser] = useState<any>(null);

  // UI Feedback
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealSecretId, setRevealSecretId] = useState<string | null>(null);
  const [editingSecretId, setEditingSecretId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingValue, setEditingValue] = useState<string>('');

  // Modals & Forms State
  const [isRegMode, setIsRegMode] = useState<boolean>(false);
  const [signupEnabled, setSignupEnabled] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    organizationName: '',
  });

  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [editOrgForm, setEditOrgForm] = useState({ name: '', description: '' });

  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
  const [newProjForm, setNewProjForm] = useState({ name: '', description: '' });

  const [isEditProjOpen, setIsEditProjOpen] = useState(false);
  const [editProjForm, setEditProjForm] = useState({ name: '', description: '' });

  const [isCreateEnvOpen, setIsCreateEnvOpen] = useState(false);
  const [newEnvForm, setNewEnvForm] = useState({ name: '', description: '' });

  const [isEditEnvOpen, setIsEditEnvOpen] = useState(false);
  const [editEnvForm, setEditEnvForm] = useState({ name: '', description: '' });

  const [isAddSecretOpen, setIsAddSecretOpen] = useState(false);
  const [secretForm, setSecretForm] = useState({ key: '', value: '' });

  const [successMsg, setSuccessMsg] = useState<string>('');

  // Profile Settings States
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Project & Org Settings States
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');

  // Danger Zone Deletion Confirmations
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteTargetType, setDeleteTargetType] = useState<
    'project' | 'organization' | 'account' | null
  >(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileUsername(currentUser.username || '');
      setProfileEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProject) {
      setProjName(selectedProject.name || '');
      setProjDesc(selectedProject.description || '');
    }
  }, [selectedProject]);

  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name || '');
      setOrgDesc(currentOrg.description || '');
    }
  }, [currentOrg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const getProjectRole = (): 'admin' | 'member' | 'viewer' => {
    if (!currentUser) return 'viewer';
    if (currentUser.type === 'owner' || currentUser.type === 'admin') return 'admin';
    const membership = projMembers.find((m) => m.userId === currentUser.id);
    return (membership?.role as 'admin' | 'member' | 'viewer') || 'viewer';
  };

  const getEnvRole = (): 'admin' | 'member' | 'viewer' => {
    if (!currentUser) return 'viewer';
    if (currentUser.type === 'owner' || currentUser.type === 'admin') return 'admin';

    const projMembership = projMembers.find((m) => m.userId === currentUser.id);
    const envMembership = envMembers.find((m) => m.userId === currentUser.id);

    if (envMembership) {
      return envMembership.role as 'admin' | 'member' | 'viewer';
    }

    if (projMembership) {
      return projMembership.role as 'admin' | 'member' | 'viewer';
    }

    return 'viewer';
  };
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'member',
  });

  const [isAddProjMemberOpen, setIsAddProjMemberOpen] = useState(false);
  const [newProjMemberForm, setNewProjMemberForm] = useState({ userId: '', role: 'member' });

  const [isAddEnvMemberOpen, setIsAddEnvMemberOpen] = useState(false);
  const [newEnvMemberForm, setNewEnvMemberForm] = useState({ userId: '', role: 'member' });

  const [isNewApiKeyOpen, setIsNewApiKeyOpen] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    expiresDays: '30',
    rateLimit: '60',
    scope: 'full',
    projectId: '',
  });
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{
    id: string;
    name: string;
    apiKey: string;
    rateLimit?: number;
  } | null>(null);

  const [profilePassword, setProfilePassword] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');

  const [selectedSecretIds, setSelectedSecretIds] = useState<string[]>([]);
  const [isCopySecretsOpen, setIsCopySecretsOpen] = useState(false);
  const [targetCopyEnvId, setTargetCopyEnvId] = useState('');
  const [copyProgress, setCopyProgress] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);
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
      setError(err.message || 'Action failed');
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

    // Whether to show the "Sign Up" toggle — defaults to true (prior behavior) if this fails
    (async () => {
      try {
        const { signupEnabled } = await api.getAuthConfig();
        setSignupEnabled(signupEnabled);
        if (!signupEnabled) setIsRegMode(false);
      } catch {
        // ignore — leave the default (signup shown)
      }
    })();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [org, user, projectsList] = await Promise.all([
        api.getCurrentOrg(),
        api.getCurrentUser(),
        api.listProjects(),
      ]);
      setCurrentOrg(org);
      setCurrentUser(user);
      setProjects(projectsList);

      if (projectsList.length > 0) {
        setSelectedProject(projectsList[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      // If token invalid, clear
      if (err.message.includes('Session expired')) {
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
      console.error('Failed to load environments', err);
    }
  };

  // Load Secrets & Members & API Keys when environment / project / tab changes
  useEffect(() => {
    setSelectedSecretIds([]);
    if (activeTab === 'secrets' && selectedEnvironment) {
      loadSecrets(selectedEnvironment.id);
    } else if (activeTab === 'members') {
      loadMembersData();
    } else if (activeTab === 'apikeys') {
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
      setError(err.message || 'Access to environment denied');
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
      console.error('Failed to load members data', err);
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
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  };

  // Copied indicator
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Auth actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegMode && authForm.password.length < 8) {
      setError('Password must be at least 8 characters');
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
          password: authForm.password,
        });
        setIsAuthenticated(true);
        await loadInitialData();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setAuthToken('');
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
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const updated = await api.updateCurrentUser({
        name: profileName,
        username: profileUsername,
        email: profileEmail,
        currentPassword: profilePassword || undefined,
      });
      setCurrentUser(updated);
      setProfilePassword('');
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const updated = await api.updateProject(selectedProject.id, {
        name: projName,
        description: projDesc,
      });
      setSelectedProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccessMsg('Project details updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrgDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const updated = await api.updateCurrentOrg({
        name: orgName,
        description: orgDesc,
      });
      setCurrentOrg(updated);
      setSuccessMsg('Organization details updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(secrets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${selectedProject?.name || 'project'}_${selectedEnvironment?.name || 'env'}_secrets.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccessMsg('Secrets exported to JSON successfully!');
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Key,Value\n';
    secrets.forEach((s) => {
      const escapedKey = s.key.replace(/"/g, '""');
      const escapedValue = s.value.replace(/"/g, '""');
      csvContent += `"${escapedKey}","${escapedValue}"\n`;
    });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute(
      'download',
      `${selectedProject?.name || 'project'}_${selectedEnvironment?.name || 'env'}_secrets.csv`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccessMsg('Secrets exported to CSV successfully!');
  };

  const executeDeleteProject = async () => {
    if (!selectedProject) return;
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      await api.deleteProject(selectedProject.id);
      const remainingProjects = projects.filter((p) => p.id !== selectedProject.id);
      setProjects(remainingProjects);
      if (remainingProjects.length > 0) {
        setSelectedProject(remainingProjects[0]);
      } else {
        setSelectedProject(null);
      }
      setDeleteTargetType(null);
      setDeleteConfirmText('');
      setActiveTab('secrets');
      setSuccessMsg('Project deleted permanently.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteOrg = async () => {
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      await api.deleteCurrentOrg();
      setDeleteTargetType(null);
      setDeleteConfirmText('');
      await handleLogout();
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization');
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteAccount = async () => {
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      await api.deleteCurrentUser({ currentPassword: deleteAccountPassword });
      setDeleteTargetType(null);
      setDeleteConfirmText('');
      setDeleteAccountPassword('');
      await handleLogout();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user account');
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
      setError(err.message || 'Failed to update organization');
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
      setNewProjForm({ name: '', description: '' });
      const list = await api.listProjects();
      setProjects(list);
      setSelectedProject(proj);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
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
      setError(err.message || 'Failed to update project');
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
        projectId: selectedProject.id,
      });
      setIsCreateEnvOpen(false);
      setNewEnvForm({ name: '', description: '' });
      await loadEnvironments(selectedProject.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create environment');
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
      setEnvironments((prev) =>
        prev.map((env) => (env.id === selectedEnvironment.id ? updated : env)),
      );
      setSelectedEnvironment(updated);
      setIsEditEnvOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update environment');
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
      setError(err.message || 'Failed to delete environment');
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
        value: secretForm.value,
      });
      setIsAddSecretOpen(false);
      setSecretForm({ key: '', value: '' });
      await loadSecrets(selectedEnvironment.id);
    } catch (err: any) {
      setError(err.message || 'Failed to set secret');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecret = async (secret: Secret) => {
    if (!selectedEnvironment) return;
    if (!editingKey.trim()) {
      setError('Secret key cannot be empty');
      return;
    }
    try {
      setLoading(true);
      await api.updateSecret(secret.id, {
        key: editingKey !== secret.key ? editingKey : undefined,
        value: editingValue,
      });
      setEditingSecretId(null);
      await loadSecrets(selectedEnvironment.id);
    } catch (err: any) {
      setError(err.message || 'Failed to update secret');
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
      await api.setSecret({
        environmentId: selectedEnvironment.id,
        key: newKey,
        value: secret.value,
      });
      await loadSecrets(selectedEnvironment.id);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate secret');
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
        await api.setSecret({
          environmentId: selectedEnvironment.id,
          key: newKey,
          value: secret.value,
        });
      }
      setSelectedSecretIds([]);
      await loadSecrets(selectedEnvironment.id);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate secrets');
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
        setSelectedSecretIds((prev) => prev.filter((id) => id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'bulk') {
        for (const id of selectedSecretIds) {
          await api.deleteSecret(id);
        }
        setSelectedSecretIds([]);
      }
      if (selectedEnvironment) await loadSecrets(selectedEnvironment.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete secret(s)');
    } finally {
      setDeleteProgress(false);
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { role, ...rest } = inviteForm;
      await api.addOrgMember({ ...rest, type: role });
      setIsInviteOpen(false);
      setInviteForm({ name: '', username: '', email: '', password: '', role: 'member' });
      await loadMembersData();
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
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
      setNewProjMemberForm({ userId: '', role: 'member' });
      await loadMembersData();
    } catch (err: any) {
      setError(err.message || 'Failed to add project member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProjMember = (userId: string) => {
    if (!selectedProject) return;
    openConfirm({
      title: 'Remove Member?',
      message: 'This removes their access to the project. This action cannot be undone.',
      confirmLabel: 'Remove',
      icon: UserMinus,
      onConfirm: async () => {
        await api.deleteProjectMember(selectedProject.id, userId);
        await loadMembersData();
      },
    });
  };

  const handleAddEnvMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvironment) return;
    try {
      setLoading(true);
      await api.addEnvironmentMember(selectedEnvironment.id, newEnvMemberForm);
      setIsAddEnvMemberOpen(false);
      setNewEnvMemberForm({ userId: '', role: 'member' });
      await loadMembersData();
    } catch (err: any) {
      setError(err.message || 'Failed to add environment member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEnvMember = (userId: string) => {
    if (!selectedEnvironment) return;
    openConfirm({
      title: 'Remove Member?',
      message: 'This removes their access to the environment. This action cannot be undone.',
      confirmLabel: 'Remove',
      icon: UserMinus,
      onConfirm: async () => {
        await api.deleteEnvironmentMember(selectedEnvironment.id, userId);
        await loadMembersData();
      },
    });
  };

  const handleRemoveOrgMember = (userId: string) => {
    openConfirm({
      title: 'Remove Member from Organization?',
      message:
        'This will completely delete this user account and cascade-remove all their project/environment memberships. This action is permanent and cannot be undone.',
      confirmLabel: 'Delete & Remove',
      icon: UserMinus,
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.deleteOrgMember(userId);
          await loadMembersData();
        } catch (err: any) {
          setError(err.message || 'Failed to remove organization member');
        } finally {
          setLoading(false);
        }
      },
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
        rateLimit: parseInt(apiKeyForm.rateLimit) || 60,
        scope: apiKeyForm.scope,
        projectId: apiKeyForm.projectId || undefined,
      });

      setGeneratedKeyResult(res);
      setApiKeyForm({
        name: '',
        expiresDays: '30',
        rateLimit: '60',
        scope: 'full',
        projectId: '',
      });
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to generate API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = (id: string) => {
    openConfirm({
      title: 'Revoke API Key?',
      message:
        'Any scripts or integrations using this key will immediately lose access. This action cannot be undone.',
      confirmLabel: 'Revoke',
      icon: KeyRound,
      onConfirm: async () => {
        await api.deleteApiKey(id);
        await loadApiKeys();
      },
    });
  };

  const handleCopySecrets = async () => {
    if (selectedSecretIds.length === 0) return;
    if (!targetCopyEnvId) {
      setError('Please select a target environment.');
      return;
    }

    try {
      setCopyProgress(true);
      setLoading(true);

      // Filter secrets that are selected
      const secretsToCopy = secrets.filter((s) => selectedSecretIds.includes(s.id));

      // Copy each selected secret to target environment
      for (const s of secretsToCopy) {
        await api.setSecret({
          environmentId: targetCopyEnvId,
          key: s.key,
          value: s.value,
          name: s.name,
        });
      }

      // Reset state
      setSelectedSecretIds([]);
      setIsCopySecretsOpen(false);
      setTargetCopyEnvId('');

      // Reload secrets if target env is the active one
      if (selectedEnvironment && targetCopyEnvId === selectedEnvironment.id) {
        await loadSecrets(selectedEnvironment.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to copy secrets.');
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
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
                    onChange={(e) => {
                      if (error) setError('');
                      setAuthForm({ ...authForm, name: e.target.value });
                    }}
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
                    onChange={(e) => {
                      if (error) setError('');
                      setAuthForm({ ...authForm, organizationName: e.target.value });
                    }}
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
                onChange={(e) => {
                  if (error) setError('');
                  setAuthForm({ ...authForm, username: e.target.value });
                }}
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
                  onChange={(e) => {
                    if (error) setError('');
                    setAuthForm({ ...authForm, email: e.target.value });
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={isRegMode ? 8 : undefined}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 pr-10 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                  placeholder="••••••••••••"
                  value={authForm.password}
                  onChange={(e) => {
                    if (error) setError('');
                    setAuthForm({ ...authForm, password: e.target.value });
                  }}
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
              {loading ? 'Authenticating...' : isRegMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {(signupEnabled || isRegMode) && (
            <div className="mt-6 text-center text-sm">
              <button
                onClick={() => {
                  setError('');
                  setIsRegMode(!isRegMode);
                }}
                className="text-orange-400 hover:text-orange-300 font-medium transition"
              >
                {isRegMode ? 'Already have an account? Sign In' : 'Need a secure vault? Sign Up'}
              </button>
            </div>
          )}
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
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        currentOrg={currentOrg}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEditOrg={() => {
          setEditOrgForm({
            name: currentOrg?.name || '',
            description: currentOrg?.description || '',
          });
          setIsEditOrgOpen(true);
        }}
        onEditProject={() => {
          if (!selectedProject) return;
          setEditProjForm({
            name: selectedProject.name,
            description: selectedProject.description || '',
          });
          setIsEditProjOpen(true);
        }}
        onCreateProject={() => setIsCreateProjOpen(true)}
        onLogoutClick={() => {
          openConfirm({
            title: 'Sign Out?',
            message: 'Are you sure you want to sign out of your session?',
            confirmLabel: 'Sign Out',
            icon: LogOut,
            onConfirm: async () => {
              await handleLogout();
            },
          });
        }}
        getProjectRole={getProjectRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-[#0c0c11]">
        {/* Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          loading={loading}
          selectedProject={selectedProject}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* Main panel inner */}
        <div className="flex-grow p-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg bg-red-950/30 border border-red-500/20 p-4 text-sm text-red-400 font-sans">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError('')}
                className="text-xs hover:underline uppercase tracking-wider font-semibold text-neutral-400"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SECRETS VAULT PANEL */}
          {activeTab === 'secrets' && (
            <SecretsView
              environments={environments}
              selectedEnvironment={selectedEnvironment}
              setSelectedEnvironment={setSelectedEnvironment}
              getProjectRole={getProjectRole}
              getEnvRole={getEnvRole}
              onEditEnvironment={() => {
                if (!selectedEnvironment) return;
                setEditEnvForm({
                  name: selectedEnvironment.name,
                  description: selectedEnvironment.description || '',
                });
                setIsEditEnvOpen(true);
              }}
              onDeleteEnvironment={handleDeleteEnvironment}
              onCreateEnvironment={() => setIsCreateEnvOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSecretIds={selectedSecretIds}
              setSelectedSecretIds={setSelectedSecretIds}
              onCopySecretsOpen={() => {
                const otherEnvs = environments.filter((e) => e.id !== selectedEnvironment?.id);
                if (otherEnvs.length > 0) setTargetCopyEnvId(otherEnvs[0].id);
                setIsCopySecretsOpen(true);
              }}
              handleBulkDuplicateSecrets={handleBulkDuplicateSecrets}
              handleBulkDelete={handleBulkDelete}
              onAddSecretClick={() => {
                setSecretForm({ key: '', value: '' });
                setIsAddSecretOpen(true);
              }}
              filteredSecrets={filteredSecrets}
              revealSecretId={revealSecretId}
              setRevealSecretId={setRevealSecretId}
              editingSecretId={editingSecretId}
              setEditingSecretId={setEditingSecretId}
              editingKey={editingKey}
              setEditingKey={setEditingKey}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              handleUpdateSecret={handleUpdateSecret}
              copyToClipboard={copyToClipboard}
              copiedId={copiedId}
              handleDuplicateSecret={handleDuplicateSecret}
              handleDeleteSecret={handleDeleteSecret}
            />
          )}

          {/* MEMBERS & RBAC MEMBERSHIP PANEL */}
          {activeTab === 'members' && (
            <MembersView
              currentUser={currentUser}
              orgMembers={orgMembers}
              projMembers={projMembers}
              envMembers={envMembers}
              selectedProject={selectedProject}
              selectedEnvironment={selectedEnvironment}
              setIsInviteOpen={setIsInviteOpen}
              setIsAddProjMemberOpen={setIsAddProjMemberOpen}
              setIsAddEnvMemberOpen={setIsAddEnvMemberOpen}
              handleRemoveProjMember={handleRemoveProjMember}
              handleRemoveEnvMember={handleRemoveEnvMember}
              handleRemoveOrgMember={handleRemoveOrgMember}
              getProjectRole={getProjectRole}
              getEnvRole={getEnvRole}
            />
          )}

          {/* API KEYS PANEL */}
          {activeTab === 'apikeys' && (
            <ApiKeysView
              apiKeys={apiKeys}
              getProjectRole={getProjectRole}
              onOpenCreateModal={() => {
                setGeneratedKeyResult(null);
                setApiKeyForm({
                  name: '',
                  expiresDays: '30',
                  rateLimit: '60',
                  scope: 'full',
                  projectId: selectedProject?.id || '',
                });
                setIsNewApiKeyOpen(true);
              }}
              handleRevokeApiKey={handleRevokeApiKey}
            />
          )}

          {/* SETTINGS PANEL */}
          {activeTab === 'settings' && (
            <SettingsView
              successMsg={successMsg}
              currentUser={currentUser}
              currentOrg={currentOrg}
              selectedProject={selectedProject}
              getProjectRole={getProjectRole}
              theme={theme}
              onThemeChange={setTheme}
              profileName={profileName}
              setProfileName={setProfileName}
              profileUsername={profileUsername}
              setProfileUsername={setProfileUsername}
              profileEmail={profileEmail}
              setProfileEmail={setProfileEmail}
              profilePassword={profilePassword}
              setProfilePassword={setProfilePassword}
              handleSaveProfile={handleSaveProfile}
              projName={projName}
              setProjName={setProjName}
              projDesc={projDesc}
              setProjDesc={setProjDesc}
              handleSaveProjectDetails={handleSaveProjectDetails}
              orgName={orgName}
              setOrgName={setOrgName}
              orgDesc={orgDesc}
              setOrgDesc={setOrgDesc}
              handleSaveOrgDetails={handleSaveOrgDetails}
              handleExportJSON={handleExportJSON}
              handleExportCSV={handleExportCSV}
              onDeleteProjectClick={() => {
                setDeleteTargetType('project');
                setDeleteConfirmText('');
              }}
              onDeleteOrgClick={() => {
                setDeleteTargetType('organization');
                setDeleteConfirmText('');
              }}
              onDeleteAccountClick={() => {
                setDeleteTargetType('account');
                setDeleteConfirmText('');
              }}
            />
          )}
        </div>
      </main>

      {/* MODALS */}

      {/* Danger Zone Deletion Confirmation Modal */}
      {deleteTargetType !== null && (
        <DangerZoneConfirmModal
          confirmText={deleteConfirmText}
          onConfirmTextChange={setDeleteConfirmText}
          expectedText={
            deleteTargetType === 'project'
              ? selectedProject?.name || ''
              : deleteTargetType === 'organization'
                ? currentOrg?.name || ''
                : 'DELETE MY ACCOUNT'
          }
          showPasswordChallenge={deleteTargetType === 'account'}
          passwordValue={deleteAccountPassword}
          onPasswordChange={setDeleteAccountPassword}
          onConfirm={() => {
            if (deleteTargetType === 'project') executeDeleteProject();
            else if (deleteTargetType === 'organization') executeDeleteOrg();
            else if (deleteTargetType === 'account') executeDeleteAccount();
          }}
          onCancel={() => {
            setDeleteTargetType(null);
            setDeleteConfirmText('');
            setDeleteAccountPassword('');
          }}
          busy={false}
        />
      )}

      {/* Edit Org Modal */}
      {isEditOrgOpen && (
        <EditOrgModal
          name={editOrgForm.name}
          description={editOrgForm.description}
          onChangeName={(val) => setEditOrgForm({ ...editOrgForm, name: val })}
          onChangeDescription={(val) => setEditOrgForm({ ...editOrgForm, description: val })}
          onSubmit={handleUpdateOrg}
          onCancel={() => setIsEditOrgOpen(false)}
        />
      )}

      {/* Create Project Modal */}
      {isCreateProjOpen && (
        <ProjectModal
          mode="create"
          name={newProjForm.name}
          description={newProjForm.description}
          onChangeName={(val) => setNewProjForm({ ...newProjForm, name: val })}
          onChangeDescription={(val) => setNewProjForm({ ...newProjForm, description: val })}
          onSubmit={handleCreateProject}
          onCancel={() => setIsCreateProjOpen(false)}
        />
      )}

      {/* Edit Project Modal */}
      {isEditProjOpen && (
        <ProjectModal
          mode="edit"
          name={editProjForm.name}
          description={editProjForm.description}
          onChangeName={(val) => setEditProjForm({ ...editProjForm, name: val })}
          onChangeDescription={(val) => setEditProjForm({ ...editProjForm, description: val })}
          onSubmit={handleUpdateProject}
          onCancel={() => setIsEditProjOpen(false)}
        />
      )}

      {/* Create Environment Modal */}
      {isCreateEnvOpen && (
        <NewEnvModal
          name={newEnvForm.name}
          description={newEnvForm.description}
          onChangeName={(val) => setNewEnvForm({ ...newEnvForm, name: val })}
          onChangeDescription={(val) => setNewEnvForm({ ...newEnvForm, description: val })}
          onSubmit={handleCreateEnvironment}
          onCancel={() => setIsCreateEnvOpen(false)}
        />
      )}

      {/* Edit Environment Modal */}
      {isEditEnvOpen && (
        <NewEnvModal
          name={editEnvForm.name}
          description={editEnvForm.description}
          onChangeName={(val) => setEditEnvForm({ ...editEnvForm, name: val })}
          onChangeDescription={(val) => setEditEnvForm({ ...editEnvForm, description: val })}
          onSubmit={handleUpdateEnvironment}
          onCancel={() => setIsEditEnvOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title={
            deleteConfirm.type === 'bulk'
              ? `Delete ${selectedSecretIds.length} Secret${selectedSecretIds.length > 1 ? 's' : ''}?`
              : 'Delete Secret?'
          }
          message={
            deleteConfirm.type === 'bulk'
              ? 'This will permanently delete all selected secrets. This action cannot be undone.'
              : 'This will permanently remove this secret. This action cannot be undone.'
          }
          confirmLabel={deleteProgress ? 'Deleting...' : 'Delete'}
          icon={Trash2}
          busy={deleteProgress}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Delete Environment Confirmation Modal */}
      {isDeleteEnvOpen && selectedEnvironment && (
        <ConfirmModal
          title={`Delete Environment "${selectedEnvironment.name}"?`}
          message="This permanently deletes all secrets in this environment. This action cannot be undone."
          confirmLabel={deleteEnvProgress ? 'Deleting...' : 'Delete'}
          icon={Trash2}
          busy={deleteEnvProgress}
          onConfirm={confirmDeleteEnvironment}
          onCancel={() => setIsDeleteEnvOpen(false)}
        />
      )}

      {/* Generic Confirmation Modal — used for API key revoke, member removal, etc. */}
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          icon={confirmDialog.icon}
          busy={confirmDialogBusy}
          onConfirm={runConfirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Copy Secrets Modal */}
      {isCopySecretsOpen && (
        <CopySecretsModal
          selectedSecretIdsCount={selectedSecretIds.length}
          selectedEnvironmentName={selectedEnvironment?.name || ''}
          environments={environments}
          selectedEnvironmentId={selectedEnvironment?.id || ''}
          targetCopyEnvId={targetCopyEnvId}
          onTargetCopyEnvIdChange={setTargetCopyEnvId}
          copyProgress={copyProgress}
          onCopy={handleCopySecrets}
          onCancel={() => {
            setIsCopySecretsOpen(false);
            setTargetCopyEnvId('');
          }}
        />
      )}

      {/* Add Secret Modal */}
      {isAddSecretOpen && (
        <AddSecretModal
          keyVal={secretForm.key}
          valueVal={secretForm.value}
          onKeyChange={(val) => setSecretForm({ ...secretForm, key: val })}
          onValueChange={(val) => setSecretForm({ ...secretForm, value: val })}
          onSubmit={handleSaveSecret}
          onCancel={() => setIsAddSecretOpen(false)}
        />
      )}

      {/* Invite Org User Modal */}
      {isInviteOpen && (
        <InviteUserModal
          inviteForm={inviteForm}
          onFormChange={setInviteForm}
          onSubmit={handleInviteUser}
          onCancel={() => setIsInviteOpen(false)}
        />
      )}

      {/* Add Project Member Modal */}
      {isAddProjMemberOpen && (
        <AddProjMemberModal
          unassignedOrgMembers={unassignedOrgMembers}
          userId={newProjMemberForm.userId}
          onUserIdChange={(val) => setNewProjMemberForm({ ...newProjMemberForm, userId: val })}
          role={newProjMemberForm.role}
          onRoleChange={(val) => setNewProjMemberForm({ ...newProjMemberForm, role: val })}
          onSubmit={handleAddProjMember}
          onCancel={() => setIsAddProjMemberOpen(false)}
        />
      )}

      {/* Add Environment Member Modal */}
      {isAddEnvMemberOpen && (
        <AddEnvMemberModal
          unassignedProjMembers={unassignedProjMembers}
          userId={newEnvMemberForm.userId}
          onUserIdChange={(val) => setNewEnvMemberForm({ ...newEnvMemberForm, userId: val })}
          role={newEnvMemberForm.role}
          onRoleChange={(val) => setNewEnvMemberForm({ ...newEnvMemberForm, role: val })}
          onSubmit={handleAddEnvMember}
          onCancel={() => setIsAddEnvMemberOpen(false)}
        />
      )}

      {/* Create API Key Modal / Key Generated Success Display */}
      {isNewApiKeyOpen && (
        <NewApiKeyModal
          generatedKeyResult={generatedKeyResult}
          projects={projects}
          apiKeyForm={apiKeyForm}
          onFormChange={setApiKeyForm}
          onSubmit={handleGenerateApiKey}
          onCancel={() => setIsNewApiKeyOpen(false)}
          onDone={() => {
            setIsNewApiKeyOpen(false);
            setGeneratedKeyResult(null);
          }}
          copiedId={copiedId}
          copyToClipboard={copyToClipboard}
        />
      )}
    </div>
  );
}
