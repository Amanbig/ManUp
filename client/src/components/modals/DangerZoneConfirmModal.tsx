import { AlertCircle } from 'lucide-react';

interface DangerZoneConfirmModalProps {
  confirmText: string;
  onConfirmTextChange: (val: string) => void;
  expectedText: string;
  showPasswordChallenge: boolean;
  passwordValue: string;
  onPasswordChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}

export default function DangerZoneConfirmModal({
  confirmText,
  onConfirmTextChange,
  expectedText,
  showPasswordChallenge,
  passwordValue,
  onPasswordChange,
  onConfirm,
  onCancel,
  busy,
}: DangerZoneConfirmModalProps) {
  const isConfirmDisabled =
    confirmText !== expectedText || (showPasswordChallenge && !passwordValue) || busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn font-sans">
      <div className="w-full max-w-md border border-red-500/20 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-bold">Are you absolutely sure?</h3>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">
          This action is permanent and cannot be undone. Please confirm by typing{' '}
          <strong className="text-white font-mono select-all bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
            {expectedText}
          </strong>{' '}
          below.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            required
            disabled={busy}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500/50 font-mono"
            placeholder="Type to confirm..."
            value={confirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
          />
          {showPasswordChallenge && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                required
                disabled={busy}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500/50"
                placeholder="Enter password to confirm account deletion"
                value={passwordValue}
                onChange={(e) => onPasswordChange(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition disabled:opacity-30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
          >
            {busy ? 'Working...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
