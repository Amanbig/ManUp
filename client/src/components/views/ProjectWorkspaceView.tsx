import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Copy,
  CopyPlus,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  Download,
  Layers,
  Folder,
  ChevronRight,
} from 'lucide-react';
import type { Project, Environment, Secret } from '../../types';

interface ProjectWorkspaceViewProps {
  project: Project;
  onBackToProjects: () => void;
  onEditProject: () => void;
  environments: Environment[];
  selectedEnvironment: Environment | null;
  setSelectedEnvironment: (env: Environment) => void;
  getProjectRole: () => string;
  getEnvRole: () => string;
  onEditEnvironment: () => void;
  onDeleteEnvironment: () => void;
  onCreateEnvironment: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (val: string) => void;

  // Selection
  selectedSecretIds: string[];
  setSelectedSecretIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onCopySecretsOpen: () => void;
  handleBulkDuplicateSecrets: () => void;
  handleBulkDelete: () => void;

  // Secret creation & export
  onAddSecretClick: () => void;
  onExportEnv: () => void;

  // Secret listing & actions
  filteredSecrets: Secret[];
  revealSecretId: string | null;
  setRevealSecretId: (id: string | null) => void;
  editingSecretId: string | null;
  setEditingSecretId: (id: string | null) => void;
  editingKey: string;
  setEditingKey: (val: string) => void;
  editingValue: string;
  setEditingValue: (val: string) => void;
  handleUpdateSecret: (secret: Secret) => void;
  copyToClipboard: (val: string, id: string) => void;
  copiedId: string | null;
  handleDuplicateSecret: (secret: Secret) => void;
  handleDeleteSecret: (id: string) => void;
}

export default function ProjectWorkspaceView({
  project,
  onBackToProjects,
  onEditProject,
  environments,
  selectedEnvironment,
  setSelectedEnvironment,
  getProjectRole,
  getEnvRole,
  onEditEnvironment,
  onDeleteEnvironment,
  onCreateEnvironment,

  searchQuery,
  setSearchQuery,

  selectedSecretIds,
  setSelectedSecretIds,
  onCopySecretsOpen,
  handleBulkDuplicateSecrets,
  handleBulkDelete,

  onAddSecretClick,
  onExportEnv,

  filteredSecrets,
  revealSecretId,
  setRevealSecretId,
  editingSecretId: currentEditingSecretId,
  setEditingSecretId,
  editingKey,
  setEditingKey,
  editingValue,
  setEditingValue,
  handleUpdateSecret,
  copyToClipboard,
  copiedId,
  handleDuplicateSecret,
  handleDeleteSecret,
}: ProjectWorkspaceViewProps) {
  const envRole = getEnvRole();
  const projRole = getProjectRole();

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Breadcrumb & Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-900">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <button
              onClick={onBackToProjects}
              className="flex items-center gap-1.5 font-medium hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Projects</span>
            </button>
            <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-700" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {project.name}
            </span>
          </div>

          {/* Project Title & Desc */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
                  {project.name}
                </h1>
                {projRole === 'admin' && (
                  <button
                    onClick={onEditProject}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    title="Edit Project"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {projRole}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {project.description || 'Manage environments and secrets for this project.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Environment Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-900 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            Environments:
          </span>

          {environments.map((env) => {
            const isSelected = selectedEnvironment?.id === env.id;
            const isProd = env.name.toLowerCase().includes('prod');
            const isStag = env.name.toLowerCase().includes('stag');

            return (
              <button
                key={env.id}
                onClick={() => setSelectedEnvironment(env)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isProd ? 'bg-red-500' : isStag ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{env.name}</span>
              </button>
            );
          })}

          {projRole === 'admin' && (
            <button
              onClick={onCreateEnvironment}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 border border-dashed border-neutral-300 dark:border-neutral-800 hover:border-orange-500/40 transition shrink-0 cursor-pointer"
              title="Add Environment"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Scope</span>
            </button>
          )}
        </div>

        {/* Environment Actions (Edit / Delete) */}
        {selectedEnvironment && projRole === 'admin' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEditEnvironment}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition"
              title="Edit Environment details"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDeleteEnvironment}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition"
              title="Delete Environment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Secrets Management Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search secrets in this scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-xl pl-9 pr-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50 shadow-xs transition"
          />
        </div>

        {/* Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Action Buttons */}
          {selectedSecretIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={onCopySecretsOpen}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-orange-500" />
                <span>Copy ({selectedSecretIds.length})</span>
              </button>
              <button
                onClick={handleBulkDuplicateSecrets}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <CopyPlus className="h-3.5 w-3.5 text-orange-500" />
                <span>Duplicate ({selectedSecretIds.length})</span>
              </button>
              {envRole === 'admin' && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Delete ({selectedSecretIds.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Export as .env button */}
          {filteredSecrets.length > 0 && (
            <button
              onClick={onExportEnv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
              title="Download or copy secrets as .env file"
            >
              <Download className="h-3.5 w-3.5 text-neutral-500" />
              <span>Export .env</span>
            </button>
          )}

          {/* Add Secret Button */}
          {envRole !== 'viewer' && (
            <button
              onClick={onAddSecretClick}
              disabled={!selectedEnvironment}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-orange-600/15 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Secret</span>
            </button>
          )}
        </div>
      </div>

      {/* Secrets Table or Empty State */}
      {filteredSecrets.length > 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-900 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950/20 shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 font-semibold text-xs">
                {envRole === 'admin' && (
                  <th className="pl-6 pr-2 py-3.5 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-orange-600 focus:ring-orange-500/50 h-4 w-4 cursor-pointer"
                      checked={
                        filteredSecrets.length > 0 &&
                        selectedSecretIds.length === filteredSecrets.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSecretIds(filteredSecrets.map((s) => s.id));
                        } else {
                          setSelectedSecretIds([]);
                        }
                      }}
                    />
                  </th>
                )}
                <th className="px-6 py-3.5">Secret Key</th>
                <th className="px-6 py-3.5">Value (Decrypted)</th>
                {envRole !== 'viewer' && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
              {filteredSecrets.map((secret) => {
                const isRevealed = revealSecretId === secret.id;
                const isEditing = currentEditingSecretId === secret.id;

                return (
                  <tr
                    key={secret.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition ${
                      selectedSecretIds.includes(secret.id)
                        ? 'bg-orange-50/60 dark:bg-orange-950/10'
                        : ''
                    }`}
                  >
                    {envRole === 'admin' && (
                      <td className="pl-6 pr-2 py-4 w-12">
                        <input
                          type="checkbox"
                          className="rounded border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-orange-600 focus:ring-orange-500/50 h-4 w-4 cursor-pointer"
                          checked={selectedSecretIds.includes(secret.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSecretIds((prev) => [...prev, secret.id]);
                            } else {
                              setSelectedSecretIds((prev) => prev.filter((id) => id !== secret.id));
                            }
                          }}
                        />
                      </td>
                    )}

                    {/* Key Column */}
                    <td className="px-6 py-4 font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingKey}
                          onChange={(e) => setEditingKey(e.target.value)}
                          className="bg-white dark:bg-neutral-900 border border-orange-500/50 rounded px-2 py-1 text-sm text-neutral-900 dark:text-white outline-none w-full max-w-xs font-mono"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{secret.key}</span>
                          <button
                            onClick={() => copyToClipboard(secret.key, `key-${secret.id}`)}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition opacity-0 group-hover:opacity-100 p-0.5"
                            title="Copy Key"
                          >
                            {copiedId === `key-${secret.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Value Column */}
                    <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400 min-w-[280px]">
                      {isEditing ? (
                        <textarea
                          rows={1}
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`;
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleUpdateSecret(secret);
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingSecretId(null);
                            }
                          }}
                          className="bg-white dark:bg-neutral-900 border border-orange-500/50 rounded-lg px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none w-full font-mono resize-none overflow-y-auto max-h-60 leading-relaxed break-all whitespace-pre-wrap"
                          placeholder="Secret value..."
                        />
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="max-w-xl font-mono text-sm leading-relaxed min-w-0">
                            {isRevealed ? (
                              <span className="text-neutral-900 dark:text-neutral-100 break-all whitespace-pre-wrap inline-block">
                                {secret.value}
                              </span>
                            ) : (
                              <span className="tracking-widest text-neutral-400 dark:text-neutral-600 select-none">
                                ••••••••••••••••
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            <button
                              onClick={() => setRevealSecretId(isRevealed ? null : secret.id)}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1"
                              title={isRevealed ? 'Hide Value' : 'Reveal Value'}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(secret.value, `val-${secret.id}`)}
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1"
                              title="Copy Value"
                            >
                              {copiedId === `val-${secret.id}` ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    {envRole !== 'viewer' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateSecret(secret)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingSecretId(null)}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
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
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                title="Edit Secret"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateSecret(secret)}
                                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                title="Duplicate Secret"
                              >
                                <CopyPlus className="h-4 w-4" />
                              </button>
                              {envRole === 'admin' && (
                                <button
                                  onClick={() => handleDeleteSecret(secret.id)}
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition"
                                  title="Delete Secret"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-14 text-center bg-white dark:bg-neutral-950/20 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {searchQuery
              ? 'No matching secrets'
              : `No Secrets Configured for ${selectedEnvironment?.name || 'this Scope'}`}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No secrets found matching "${searchQuery}". Clear your search query to see all secrets.`
              : 'Add individual keys, bulk paste raw .env blocks, or upload your existing .env file.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 transition"
              >
                Clear Search
              </button>
            ) : envRole !== 'viewer' ? (
              <button
                onClick={onAddSecretClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-orange-600/15 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Secret or Import .env</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
