import { AlertCircle, Plus, Trash2, KeyRound } from 'lucide-react';
import type { ApiKey } from '../../types';

interface ApiKeysViewProps {
  apiKeys: ApiKey[];
  getProjectRole: () => string;
  onOpenCreateModal: () => void;
  handleRevokeApiKey: (id: string) => void;
}

export default function ApiKeysView({
  apiKeys,
  getProjectRole,
  onOpenCreateModal,
  handleRevokeApiKey,
}: ApiKeysViewProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Security Warning */}
      <div className="flex gap-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400 max-w-3xl">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h4 className="font-semibold">Protect your API Keys</h4>
          <p className="text-xs mt-1 text-amber-500/90 leading-relaxed">
            API Keys permit automated scripts to fetch and decrypt environment secrets. Be sure to
            restrict access and rotate keys regularly.
          </p>
        </div>
      </div>

      {/* Header / Add button */}
      <div className="flex items-center justify-between max-w-4xl">
        <h3 className="text-base font-bold text-neutral-200">Active API Keys</h3>
        {getProjectRole() !== 'viewer' && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-sm font-semibold transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create API Key</span>
          </button>
        )}
      </div>

      {/* API Keys Table */}
      {apiKeys.length > 0 ? (
        <div className="border border-neutral-900 rounded-xl overflow-hidden max-w-4xl bg-neutral-950/20">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400 font-semibold">
                <th className="px-6 py-3.5">Key Name</th>
                <th className="px-6 py-3.5">Project Scope</th>
                <th className="px-6 py-3.5">Permissions</th>
                <th className="px-6 py-3.5">Rate Limit</th>
                <th className="px-6 py-3.5">Usage Metrics</th>
                <th className="px-6 py-3.5">Expires At</th>
                {getProjectRole() !== 'viewer' && (
                  <th className="px-6 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {apiKeys.map((key) => {
                const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
                return (
                  <tr key={key.id} className="hover:bg-neutral-900/10 transition">
                    <td className="px-6 py-4 font-semibold text-neutral-200">{key.name}</td>
                    <td className="px-6 py-4 text-xs">
                      {key.projectName ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/20 text-amber-400 border border-amber-500/20">
                          {key.projectName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                          All Projects
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-300">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          key.scope === 'read-only'
                            ? 'bg-blue-950/20 text-blue-400 border-blue-500/20'
                            : 'bg-green-950/20 text-green-400 border-green-500/20'
                        }`}
                      >
                        {key.scope === 'read-only' ? 'Read-only' : 'Full Access'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono text-xs">
                      {key.rateLimit === 0
                        ? 'Unlimited'
                        : key.rateLimit
                          ? `${key.rateLimit} req/min`
                          : '60 req/min'}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span>
                          Requests:{' '}
                          <strong className="text-neutral-200">{key.requestCount || 0}</strong>
                        </span>
                        <span className="text-neutral-500 text-[11px]">
                          Last used:{' '}
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {key.expiresAt ? (
                        <span
                          className={isExpired ? 'text-red-500 font-semibold' : 'text-neutral-400'}
                        >
                          {new Date(key.expiresAt).toLocaleDateString()} {isExpired && '(Expired)'}
                        </span>
                      ) : (
                        <span className="text-neutral-500">Never</span>
                      )}
                    </td>
                    {getProjectRole() !== 'viewer' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeApiKey(key.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 hover:underline ml-auto font-medium transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Revoke</span>
                        </button>
                      </td>
                    )}
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
  );
}
