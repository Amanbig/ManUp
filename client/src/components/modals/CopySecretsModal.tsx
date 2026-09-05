import { Copy } from 'lucide-react';
import type { Environment } from '../../types';

interface CopySecretsModalProps {
  selectedSecretIdsCount: number;
  selectedEnvironmentName: string;
  environments: Environment[];
  selectedEnvironmentId: string;
  targetCopyEnvId: string;
  onTargetCopyEnvIdChange: (val: string) => void;
  onCopy: () => void;
  onCancel: () => void;
  copyProgress: boolean;
}

export default function CopySecretsModal({
  selectedSecretIdsCount,
  selectedEnvironmentName,
  environments,
  selectedEnvironmentId,
  targetCopyEnvId,
  onTargetCopyEnvIdChange,
  onCopy,
  onCancel,
  copyProgress,
}: CopySecretsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Copy className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          <span>Copy Secrets to Environment</span>
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">
          This will copy the <strong>{selectedSecretIdsCount}</strong> selected secrets from the
          current environment (<strong>{selectedEnvironmentName}</strong>) to the destination
          environment. Note: Existing secrets with matching keys in the destination environment will
          be updated.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Target Environment
            </label>
            <select
              value={targetCopyEnvId}
              onChange={(e) => onTargetCopyEnvIdChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50"
            >
              <option value="">Select Target...</option>
              {environments
                .filter((e) => e.id !== selectedEnvironmentId)
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
              onClick={onCancel}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              disabled={copyProgress}
            >
              Cancel
            </button>
            <button
              onClick={onCopy}
              disabled={copyProgress || !targetCopyEnvId}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              {copyProgress ? 'Copying...' : 'Copy Secrets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
