import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Project } from '../../types';
import type { ThemeMode } from '../../lib/theme';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeTab: string;
  loading: boolean;
  selectedProject: Project | null;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function Header({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  loading,
  selectedProject,
  theme,
  onThemeChange,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-4 md:px-8 shrink-0 bg-[#0e0e13]/60 backdrop-blur gap-3 font-sans">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsSidebarOpen((v) => !v)}
          className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition shrink-0 md:hidden"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </button>
        <h2 className="text-lg font-bold tracking-tight text-white font-display truncate">
          {activeTab === 'secrets' && 'Secrets Vault'}
          {activeTab === 'members' && 'Access & RBAC Memberships'}
          {activeTab === 'apikeys' && 'Programmatic API Keys'}
          {activeTab === 'settings' && 'Settings'}
        </h2>
      </div>

      <div className="flex items-center gap-3 text-sm text-neutral-400">
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-orange-400 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
            Syncing...
          </span>
        )}
        <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-medium font-sans">
          Project: {selectedProject?.name || 'None'}
        </span>
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} compact />
      </div>
    </header>
  );
}
