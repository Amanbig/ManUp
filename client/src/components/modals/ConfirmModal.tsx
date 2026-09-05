import React from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  icon: Icon = Trash2,
  busy,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden font-sans">
        <div className="p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-neutral-950 border border-red-200 dark:border-neutral-800 shrink-0 text-red-500">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">{title}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-0.5">
              {message}
            </p>
          </div>
        </div>
        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition disabled:opacity-30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-orange-650/15"
          >
            {busy ? 'Working...' : confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
