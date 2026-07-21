import {
  Key,
  Users,
  Building2,
  Briefcase,
  Edit2,
  PlusCircle,
  KeyRound,
  Settings,
  LogOut,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import Dropdown from '../Dropdown';
import type { Project } from '../../types';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
  currentOrg: any;
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (proj: Project) => void;
  activeTab: 'secrets' | 'members' | 'apikeys' | 'settings';
  setActiveTab: (tab: 'secrets' | 'members' | 'apikeys' | 'settings') => void;
  onEditOrg: () => void;
  onEditProject: () => void;
  onCreateProject: () => void;
  onLogoutClick: () => void;
  getProjectRole: () => string;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  currentOrg,
  projects,
  selectedProject,
  setSelectedProject,
  activeTab,
  setActiveTab,
  onEditOrg,
  onEditProject,
  onCreateProject,
  onLogoutClick,
  getProjectRole,
}: SidebarProps) {
  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-40 bg-[#0e0e13] border-r border-neutral-900 flex flex-col shrink-0 overflow-hidden transition-transform md:transition-[width] duration-200 ease-in-out font-sans ${
        isSidebarOpen
          ? 'translate-x-0 w-72 md:w-72'
          : '-translate-x-full md:translate-x-0 w-20 md:w-20'
      }`}
    >
      {/* Brand / Logo */}
      <div
        className={`h-16 border-b border-neutral-900 flex items-center shrink-0 transition-all duration-200 ${
          isSidebarOpen ? 'justify-between px-4 w-72' : 'justify-center w-20'
        }`}
      >
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600/10 border border-orange-500/30 text-orange-400 shrink-0">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white font-display leading-none">
                  ManUp
                </h1>
                <span className="text-[9px] text-orange-400 font-medium tracking-wider uppercase">
                  Secure Vault
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                localStorage.setItem('sidebar_open', 'false');
              }}
              className="p-1 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition shrink-0 hidden md:block"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setIsSidebarOpen(true);
              localStorage.setItem('sidebar_open', 'true');
            }}
            className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition shrink-0"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Switchers Section */}
      <div
        className={`border-b border-neutral-900 flex flex-col shrink-0 overflow-hidden transition-all duration-200 ${
          isSidebarOpen ? 'p-4 space-y-4 w-72' : 'p-2 space-y-2 w-20 items-center'
        }`}
      >
        {isSidebarOpen ? (
          <>
            {/* Organization Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Organization
                </span>
                {(currentUser?.type === 'owner' || currentUser?.type === 'admin') && (
                  <button
                    onClick={onEditOrg}
                    disabled={!currentOrg}
                    className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                    title="Edit Organization"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-sm text-neutral-200">
                <Building2 className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="font-medium truncate">{currentOrg?.name || 'Loading Org...'}</span>
              </div>
            </div>

            {/* Project Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Active Project
                </span>
                <div className="flex items-center gap-2">
                  {getProjectRole() === 'admin' && (
                    <button
                      onClick={onEditProject}
                      disabled={!selectedProject}
                      className="text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                      title="Edit Project"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {currentUser?.type !== 'viewer' && (
                    <button
                      onClick={onCreateProject}
                      className="text-orange-400 hover:text-orange-300 transition"
                      title="Create Project"
                    >
                      <PlusCircle className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>
              <Dropdown
                options={projects.map((p) => ({ id: p.id, label: p.name }))}
                value={selectedProject?.id || ''}
                onChange={(id) => {
                  const proj = projects.find((p) => p.id === id);
                  if (proj) setSelectedProject(proj);
                }}
                placeholder="No Projects Available"
              />
            </div>
          </>
        ) : (
          <>
            {/* Collapsed views */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-900 text-orange-400 cursor-default"
              title={`Organization: ${currentOrg?.name || ''}`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-900 text-orange-400 cursor-default"
              title={`Active Project: ${selectedProject?.name || ''}`}
            >
              <Briefcase className="h-5 w-5" />
            </div>
          </>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav
        className={`flex-1 transition-all duration-200 ${
          isSidebarOpen ? 'p-4 space-y-1 w-72' : 'p-2 space-y-2 w-20'
        }`}
      >
        <button
          onClick={() => setActiveTab('secrets')}
          title={!isSidebarOpen ? 'Secrets Vault' : undefined}
          className={`${
            isSidebarOpen
              ? 'w-full flex items-center gap-3 px-3 py-2.5'
              : 'h-10 w-10 flex items-center justify-center mx-auto'
          } rounded-lg text-sm font-medium transition ${
            activeTab === 'secrets'
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-400'
              : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
          }`}
        >
          <Key className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>Secrets Vault</span>}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          title={!isSidebarOpen ? 'Access Members' : undefined}
          className={`${
            isSidebarOpen
              ? 'w-full flex items-center gap-3 px-3 py-2.5'
              : 'h-10 w-10 flex items-center justify-center mx-auto'
          } rounded-lg text-sm font-medium transition ${
            activeTab === 'members'
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-400'
              : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>Access Members</span>}
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          title={!isSidebarOpen ? 'API Keys' : undefined}
          className={`${
            isSidebarOpen
              ? 'w-full flex items-center gap-3 px-3 py-2.5'
              : 'h-10 w-10 flex items-center justify-center mx-auto'
          } rounded-lg text-sm font-medium transition ${
            activeTab === 'apikeys'
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-400'
              : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
          }`}
        >
          <KeyRound className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>API Keys</span>}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          title={!isSidebarOpen ? 'Settings' : undefined}
          className={`${
            isSidebarOpen
              ? 'w-full flex items-center gap-3 px-3 py-2.5'
              : 'h-10 w-10 flex items-center justify-center mx-auto'
          } rounded-lg text-sm font-medium transition ${
            activeTab === 'settings'
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-400'
              : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>Settings</span>}
        </button>
      </nav>

      {/* User footer & Logout */}
      <div
        className={`border-t border-neutral-900 bg-neutral-950/40 flex items-center transition-all duration-200 shrink-0 ${
          isSidebarOpen ? 'p-4 justify-between w-72' : 'p-2 justify-center w-20'
        }`}
      >
        {isSidebarOpen && (
          <div className="truncate max-w-[150px]">
            <span className="block text-xs font-semibold text-neutral-300 truncate">
              {currentOrg?.name || 'Organization'}
            </span>
            <span className="block text-[10px] text-neutral-500 truncate">Developer Context</span>
          </div>
        )}
        <button
          onClick={onLogoutClick}
          className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
