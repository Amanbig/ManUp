import React, { useState, useRef, useEffect } from 'react';
import { Key, FileText, Upload, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { parseDotEnv, type ParsedEnvEntry } from '../../lib/dotenv';

interface AddSecretModalProps {
  keyVal: string;
  valueVal: string;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBulkSubmit?: (entries: ParsedEnvEntry[], overwrite: boolean) => Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}

export default function AddSecretModal({
  keyVal,
  valueVal,
  onKeyChange,
  onValueChange,
  onSubmit,
  onBulkSubmit,
  onCancel,
  busy = false,
}: AddSecretModalProps) {
  const [tab, setTab] = useState<'single' | 'raw' | 'upload'>('single');
  const [rawContent, setRawContent] = useState<string>('');
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [revealValues, setRevealValues] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [bulkError, setBulkError] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-resize single value textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [valueVal]);

  const parsed = parseDotEnv(rawContent);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  const readFile = (file: File) => {
    setBulkError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setRawContent(text);
        setTab('raw'); // Switch to editor to see parsed results
      }
    };
    reader.onerror = () => {
      setBulkError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleBulkFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.entries.length === 0) {
      setBulkError('No valid secrets found to import.');
      return;
    }
    if (onBulkSubmit) {
      try {
        setBulkError('');
        await onBulkSubmit(parsed.entries, overwrite);
      } catch (err: any) {
        setBulkError(err.message || 'Failed to import secrets.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Add Secrets</h3>
          <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('single')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                tab === 'single'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span>Single Secret</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('raw')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                tab === 'raw'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Write / Paste .env</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                tab === 'upload'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload .env</span>
            </button>
          </div>
        </div>

        {bulkError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{bulkError}</span>
          </div>
        )}

        {/* Tab 1: Single Secret Mode */}
        {tab === 'single' && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Secret Key
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono"
                placeholder="API_DATABASE_URL"
                value={keyVal}
                onChange={(e) => onKeyChange(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Secret Value
              </label>
              <textarea
                ref={textareaRef}
                required
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono min-h-24 max-h-56 resize-none overflow-y-auto"
                placeholder="postgresql://user:pass@host/db"
                value={valueVal}
                onChange={(e) => onValueChange(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-orange-600/10"
              >
                {busy ? 'Saving...' : 'Save Secret'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Raw .env Paste / Editor */}
        {tab === 'raw' && (
          <form onSubmit={handleBulkFormSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Direct .env Editor
                </label>
                <span className="text-[11px] text-neutral-500">
                  Format: KEY=VALUE (1 per line, # for comments)
                </span>
              </div>
              <textarea
                rows={8}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50 font-mono resize-none overflow-y-auto"
                placeholder={`# Paste or write multiple environment variables here\nPORT=3000\nDATABASE_URL="postgres://user:pass@localhost:5432/mydb"\nAPI_KEY=sk_test_123456\n`}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
              />
            </div>

            {/* Parser status pill */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-xs">
              <div className="flex items-center gap-2">
                {parsed.entries.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-neutral-400 shrink-0" />
                )}
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {parsed.entries.length > 0
                    ? `${parsed.entries.length} valid secret${parsed.entries.length > 1 ? 's' : ''} parsed`
                    : 'No secrets parsed yet'}
                </span>
                {parsed.errors.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                    ({parsed.errors.length} skipped)
                  </span>
                )}
              </div>
              {parsed.entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium underline"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              )}
            </div>

            {/* Parsed Preview Table */}
            {showPreview && parsed.entries.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                <div className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 flex items-center justify-between font-semibold text-neutral-700 dark:text-neutral-300">
                  <span>Parsed Keys ({parsed.entries.length})</span>
                  <button
                    type="button"
                    onClick={() => setRevealValues(!revealValues)}
                    className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    {revealValues ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{revealValues ? 'Mask Values' : 'Reveal Values'}</span>
                  </button>
                </div>
                {parsed.entries.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 flex items-center justify-between font-mono bg-white dark:bg-neutral-900"
                  >
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[40%]">
                      {item.key}
                    </span>
                    <span className="text-neutral-500 truncate max-w-[55%]">
                      {revealValues ? item.value : '••••••••••••'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="overwrite-keys"
                className="rounded border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-orange-600 focus:ring-orange-500/50 h-4 w-4 cursor-pointer"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              <label
                htmlFor="overwrite-keys"
                className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
              >
                Overwrite existing secrets if keys already exist in this environment
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || parsed.entries.length === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-orange-600/10"
              >
                {busy
                  ? 'Importing...'
                  : `Import ${parsed.entries.length} Secret${parsed.entries.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Upload .env File */}
        {tab === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".env,.env.*,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                  : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40 hover:border-orange-400 hover:bg-neutral-100/50 dark:hover:bg-neutral-950'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Click to select file or drag & drop here
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports .env, .env.local, .env.production, or plain text files
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
