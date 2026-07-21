import React, { useRef, useEffect } from 'react';

interface AddSecretModalProps {
  keyVal: string;
  valueVal: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function AddSecretModal({
  keyVal,
  valueVal,
  onKeyChange,
  onValueChange,
  onSubmit,
  onCancel,
}: AddSecretModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [valueVal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Add Secret</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              Secret Key
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono"
              placeholder="API_DATABASE_URL"
              value={keyVal}
              onChange={(e) => onKeyChange(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              Secret Value
            </label>
            <textarea
              ref={textareaRef}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono min-h-24 max-h-56 resize-none overflow-y-auto"
              placeholder="postgresql://user:pass@host/db"
              value={valueVal}
              onChange={(e) => onValueChange(e.target.value)}
            />
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
              Save Secret
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
