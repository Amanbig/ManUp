import { useRef } from 'react';
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
} from 'lucide-react';
import Dropdown from '../Dropdown';
import type { Environment, Secret } from '../../types';

interface SecretsViewProps {
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

  // Secret creation
  onAddSecretClick: () => void;

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

export default function SecretsView({
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
}: SecretsViewProps) {
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="space-y-6 font-sans">
      {/* Environment Selector and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-900 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Dropdown
              variant="compact"
              options={environments.map((env) => ({ id: env.id, label: env.name }))}
              value={selectedEnvironment?.id || ''}
              onChange={(id) => {
                const env = environments.find((x) => x.id === id);
                if (env) setSelectedEnvironment(env);
              }}
              placeholder="No Environments"
            />
          </div>
          {getProjectRole() === 'admin' && (
            <>
              <button
                onClick={onEditEnvironment}
                disabled={!selectedEnvironment}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 text-neutral-600 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition disabled:opacity-50"
                title="Edit Environment"
              >
                <Edit2 className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={onDeleteEnvironment}
                disabled={!selectedEnvironment}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 text-neutral-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition disabled:opacity-50"
                title="Delete Environment"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={onCreateEnvironment}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 text-neutral-600 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
                title="Add Environment"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search secrets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50 w-60 shadow-xs dark:shadow-none"
            />
          </div>

          {/* Selection action buttons */}
          {selectedSecretIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onCopySecretsOpen}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg text-sm font-semibold transition"
              >
                <Copy className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span>Copy ({selectedSecretIds.length})</span>
              </button>
              <button
                onClick={handleBulkDuplicateSecrets}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg text-sm font-semibold transition"
              >
                <CopyPlus className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span>Duplicate ({selectedSecretIds.length})</span>
              </button>
              {getEnvRole() === 'admin' && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 text-neutral-700 dark:text-neutral-300 hover:text-red-500 dark:hover:text-red-400 rounded-lg text-sm font-semibold transition"
                >
                  <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <span>Delete ({selectedSecretIds.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Add Secret Trigger */}
          {getEnvRole() !== 'viewer' && (
            <button
              onClick={onAddSecretClick}
              disabled={!selectedEnvironment}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-md shadow-orange-600/10"
            >
              <Plus className="h-4 w-4" />
              <span>Add Secret</span>
            </button>
          )}
        </div>
      </div>

      {/* Secrets Table/Grid */}
      {filteredSecrets.length > 0 ? (
        <div className="border border-neutral-200 dark:border-neutral-900 rounded-xl overflow-hidden bg-white dark:bg-neutral-950/20 shadow-xs dark:shadow-none">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-900/30 text-neutral-600 dark:text-neutral-400 font-semibold">
                {getEnvRole() === 'admin' && (
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
                {getEnvRole() !== 'viewer' && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
              {filteredSecrets.map((secret) => {
                const isRevealed = revealSecretId === secret.id;
                const isEditing = currentEditingSecretId === secret.id;
                return (
                  <tr
                    key={secret.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/10 transition ${
                      selectedSecretIds.includes(secret.id) ? 'bg-orange-50/60 dark:bg-orange-950/10' : ''
                    }`}
                  >
                    {getEnvRole() === 'admin' && (
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
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-200">
                      <input
                        autoFocus={isEditing}
                        type="text"
                        readOnly={!isEditing}
                        className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none font-mono font-bold transition-all ${
                          isEditing
                            ? 'border-orange-500/50 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 shadow-xs'
                            : getEnvRole() === 'viewer'
                              ? 'border-neutral-200 dark:border-neutral-900 bg-neutral-100/60 dark:bg-neutral-950/40 text-neutral-400 cursor-not-allowed'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 text-neutral-800 dark:text-neutral-300 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                        value={isEditing ? editingKey : secret.key}
                        onChange={(e) => {
                          if (isEditing) {
                            setEditingKey(e.target.value.toUpperCase());
                          }
                        }}
                        onClick={() => {
                          if (!isEditing && getEnvRole() !== 'viewer') {
                            setEditingSecretId(secret.id);
                            setEditingKey(secret.key);
                            setEditingValue(secret.value);
                            setRevealSecretId(secret.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateSecret(secret);
                          if (e.key === 'Escape') setEditingSecretId(null);
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
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          readOnly={!isEditing}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none font-mono transition-all resize-none ${
                            isEditing
                              ? 'border-orange-500/50 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 shadow-xs overflow-y-auto max-h-56 pr-2.5'
                              : getEnvRole() === 'viewer'
                                ? 'border-neutral-200 dark:border-neutral-900 bg-neutral-100/60 dark:bg-neutral-950/40 text-neutral-400 cursor-not-allowed overflow-hidden pr-14'
                                : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 text-neutral-800 dark:text-neutral-300 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200 overflow-hidden pr-14'
                          }`}
                          rows={1}
                          value={
                            isEditing
                              ? editingValue
                              : isRevealed
                                ? secret.value
                                : '••••••••••••••••'
                          }
                          onChange={(e) => {
                            if (isEditing) {
                              setEditingValue(e.target.value);
                            }
                          }}
                          onClick={() => {
                            if (!isEditing && getEnvRole() !== 'viewer') {
                              setEditingSecretId(secret.id);
                              setEditingKey(secret.key);
                              setEditingValue(secret.value);
                              setRevealSecretId(secret.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleUpdateSecret(secret);
                            }
                            if (e.key === 'Escape') setEditingSecretId(null);
                          }}
                        />
                        {!isEditing && (
                          <div className="absolute right-2.5 flex items-center gap-1.5 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-800/40 shadow-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRevealSecretId(isRevealed ? null : secret.id);
                              }}
                              className="text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition"
                              title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
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
                              className="text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 transition relative"
                              title="Copy Secret"
                            >
                              {copiedId === secret.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    {getEnvRole() !== 'viewer' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateSecret(secret)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-green-500 dark:text-green-400 transition"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingSecretId(null)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
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
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                title="Edit Secret"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateSecret(secret)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                title="Duplicate Secret"
                              >
                                <CopyPlus className="h-4 w-4" />
                              </button>
                              {getEnvRole() === 'admin' && (
                                <button
                                  onClick={() => handleDeleteSecret(secret.id)}
                                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition"
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
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-14 text-center bg-white dark:bg-neutral-950/10 shadow-xs">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">No Secrets Configured</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Secrets are envelope-encrypted using on-demand DEK values. Use "Add Secret" to get
            started.
          </p>
        </div>
      )}
    </div>
  );
}
