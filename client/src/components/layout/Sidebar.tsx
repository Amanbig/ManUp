import {
  FolderGit2,
  Users,
  Building2,
  Edit2,
  KeyRound,
  Settings,
  LogOut,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { Project } from '../../types';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
  currentOrg: any;
  setSelectedProject: (proj: Project | null) => void;
  activeTab: 'projects' | 'members' | 'apikeys' | 'settings';
  setActiveTab: (tab: 'projects' | 'members' | 'apikeys' | 'settings') => void;
  onEditOrg: () => void;
  onLogoutClick: () => void;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  currentOrg,
  setSelectedProject,
  activeTab,
  setActiveTab,
  onEditOrg,
  onLogoutClick,
}: SidebarProps) {
  return (
    <aside
      className={`fixed md:relative inset-y-0 left-0 z-40 bg-white dark:bg-[#0e0e13] border-r border-neutral-200 dark:border-neutral-900 flex flex-col shrink-0 overflow-hidden transition-transform md:transition-[width] duration-200 ease-in-out font-sans ${
        isSidebarOpen
          ? 'translate-x-0 w-72 md:w-72'
          : '-translate-x-full md:translate-x-0 w-20 md:w-20'
      }`}
    >
      {/* Brand / Logo */}
      <div
        className={`h-16 border-b border-neutral-200 dark:border-neutral-900 flex items-center shrink-0 transition-all duration-200 ${
          isSidebarOpen ? 'justify-between px-4 w-72' : 'justify-center w-20'
        }`}
      >
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 shrink-0">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white font-display leading-none">
                  ManUp
                </h1>
                <span className="text-[9px] text-orange-500 dark:text-orange-400 font-medium tracking-wider uppercase">
                  Secure Vault
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                localStorage.setItem('sidebar_open', 'false');
              }}
              className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition shrink-0 hidden md:block"
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
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition shrink-0"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Switchers Section */}
      <div
        className={`border-b border-neutral-200 dark:border-neutral-900 flex flex-col shrink-0 overflow-hidden transition-all duration-200 ${
          isSidebarOpen ? 'p-4 w-72' : 'p-2 w-20 items-center'
        }`}
      >
        {isSidebarOpen ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Organization
              </span>
              {(currentUser?.type === 'owner' || currentUser?.type === 'admin') && (
                <button
                  onClick={onEditOrg}
                  disabled={!currentOrg}
                  className="text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition disabled:opacity-50"
                  title="Edit Organization"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200">
              <Building2 className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
              <span className="font-medium truncate">{currentOrg?.name || 'Loading Org...'}</span>
            </div>
          </div>
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 text-orange-500 dark:text-orange-400 cursor-default"
            title={`Organization: ${currentOrg?.name || ''}`}
          >
            <Building2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav
        className={`flex-1 transition-all duration-200 ${
          isSidebarOpen ? 'p-4 space-y-1 w-72' : 'p-2 space-y-2 w-20'
        }`}
      >
        <button
          onClick={() => {
            setActiveTab('projects');
            if (activeTab === 'projects') {
              setSelectedProject(null);
            }
          }}
          title={!isSidebarOpen ? 'Projects' : undefined}
          className={`${
            isSidebarOpen
              ? 'w-full flex items-center gap-3 px-3 py-2.5'
              : 'h-10 w-10 flex items-center justify-center mx-auto'
          } rounded-lg text-sm font-medium transition ${
            activeTab === 'projects'
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <FolderGit2 className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>Projects</span>}
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
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
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
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
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
              ? 'bg-orange-600/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 font-semibold'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          {isSidebarOpen && <span>Settings</span>}
        </button>
      </nav>

      {/* User footer & Logout */}
      <div
        className={`border-t border-neutral-200 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-950/40 flex items-center transition-all duration-200 shrink-0 ${
          isSidebarOpen ? 'p-4 justify-between w-72' : 'p-2 justify-center w-20'
        }`}
      >
        {isSidebarOpen && (
          <div className="truncate max-w-[150px]">
            <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-300 truncate">
              {currentOrg?.name || 'Organization'}
            </span>
            <span className="block text-[10px] text-neutral-500 truncate">Developer Context</span>
          </div>
        )}
        <button
          onClick={onLogoutClick}
          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
