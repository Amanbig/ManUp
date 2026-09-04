import React from 'react';
import { Check, Copy } from 'lucide-react';
import type { Project } from '../../types';

interface NewApiKeyModalProps {
  generatedKeyResult: { apiKey: string } | null;
  projects: Project[];
  apiKeyForm: {
    name: string;
    expiresDays: string;
    rateLimit: string;
    scope: string;
    projectId: string;
  };
  onFormChange: (form: {
    name: string;
    expiresDays: string;
    rateLimit: string;
    scope: string;
    projectId: string;
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDone: () => void;
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
}

export default function NewApiKeyModal({
  generatedKeyResult,
  projects,
  apiKeyForm,
  onFormChange,
  onSubmit,
  onCancel,
  onDone,
  copiedId,
  copyToClipboard,
}: NewApiKeyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
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
                  onClick={() => copyToClipboard(generatedKeyResult.apiKey, 'generated_apikey')}
                  className="text-neutral-500 hover:text-neutral-300 transition shrink-0 ml-auto"
                >
                  {copiedId === 'generated_apikey' ? (
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
                onClick={onDone}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-white">Generate new API Key</h3>
            <form onSubmit={onSubmit} className="space-y-4">
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
                  onChange={(e) => onFormChange({ ...apiKeyForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Expiry Duration
                </label>
                <select
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
                  value={apiKeyForm.expiresDays}
                  onChange={(e) => onFormChange({ ...apiKeyForm, expiresDays: e.target.value })}
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
                  onChange={(e) => onFormChange({ ...apiKeyForm, rateLimit: e.target.value })}
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Set to 0 for unlimited requests.
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Project Scope
                </label>
                <select
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
                  value={apiKeyForm.projectId}
                  onChange={(e) => onFormChange({ ...apiKeyForm, projectId: e.target.value })}
                >
                  <option value="">All Projects (Organization-wide)</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      Project: {proj.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Project-scoped keys allow CLIs to query secrets passing only the environment
                  keyword (e.g. ?env=production).
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Access Control Scope
                </label>
                <select
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
                  value={apiKeyForm.scope}
                  onChange={(e) => onFormChange({ ...apiKeyForm, scope: e.target.value })}
                >
                  <option value="full">Full Access (Read/Write)</option>
                  <option value="read-only">Read-only</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
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
  );
}
