import { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
  User,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api';
import type { Secret, SecretVersion } from '../../types';

interface SecretHistoryModalProps {
  secret: Secret | null;
  environmentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onRollbackSuccess: () => void;
  canModify: boolean;
}

export default function SecretHistoryModal({
  secret,
  environmentName,
  isOpen,
  onClose,
  onRollbackSuccess,
  canModify,
}: SecretHistoryModalProps) {
  const [versions, setVersions] = useState<SecretVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollingBackVersion, setRollingBackVersion] = useState<number | null>(null);
  const [revealedVersion, setRevealedVersion] = useState<number | null>(null);
  const [copiedVersion, setCopiedVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !secret) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getSecretVersions(secret.id)
      .then((data: any) => {
        if (isMounted) setVersions(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('Failed to fetch secret versions:', err);
          setError(err.message || 'Failed to load secret revision history');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, secret]);

  if (!isOpen || !secret) return null;

  const handleCopy = (val: string, versionNum: number) => {
    navigator.clipboard.writeText(val);
    setCopiedVersion(versionNum);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  const handleRollback = async (version: number) => {
    if (
      !confirm(
        `Are you sure you want to rollback "${secret.key}" to version v${version}? This will create a new revision with its historical value.`,
      )
    ) {
      return;
    }

    setRollingBackVersion(version);
    setError(null);
    try {
      await api.rollbackSecretVersion(secret.id, version);
      onRollbackSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to rollback secret:', err);
      setError(err.message || 'Failed to rollback secret');
    } finally {
      setRollingBackVersion(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <History className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {secret.key}
                </h3>
                {environmentName && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {environmentName}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Revision history and 1-click restore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <p className="text-xs">Loading revision history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No historical revisions found for this secret.
            </div>
          ) : (
            versions.map((ver) => {
              const isRevealed = revealedVersion === ver.version;
              const isCurrent = ver.isCurrent;

              return (
                <div
                  key={ver.id || ver.version}
                  className={`border rounded-xl p-4 transition ${
                    isCurrent
                      ? 'border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/5'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold ${
                          isCurrent
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        v{ver.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                          Active / Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent && canModify && (
                        <button
                          onClick={() => handleRollback(ver.version)}
                          disabled={rollingBackVersion !== null}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-neutral-800 transition disabled:opacity-50 shadow-2xs"
                        >
                          {rollingBackVersion === ver.version ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 mb-3 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(ver.createdAt).toLocaleString()}</span>
                    </div>
                    {ver.createdBy && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{ver.createdBy.name || ver.createdBy.username || 'System'}</span>
                      </div>
                    )}
                  </div>

                  {/* Value Display */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 font-mono text-xs">
                    <span className="truncate text-neutral-800 dark:text-neutral-200 select-all">
                      {isRevealed ? ver.value : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setRevealedVersion(isRevealed ? null : ver.version)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                        title={isRevealed ? 'Hide value' : 'Show value'}
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(ver.value, ver.version)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                        title="Copy to clipboard"
                      >
                        {copiedVersion === ver.version ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
