import React from 'react';

interface InviteUserModalProps {
  inviteForm: { name: string; username: string; email: string; password: string; role: string };
  onFormChange: (form: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function InviteUserModal({
  inviteForm,
  onFormChange,
  onSubmit,
  onCancel,
}: InviteUserModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Invite new User</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50"
              placeholder="Alice Vance"
              value={inviteForm.name}
              onChange={(e) => onFormChange({ ...inviteForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50"
              placeholder="alice_vance"
              value={inviteForm.username}
              onChange={(e) => onFormChange({ ...inviteForm, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50"
              placeholder="alice@acme.com"
              value={inviteForm.email}
              onChange={(e) => onFormChange({ ...inviteForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/50"
              placeholder="••••••••••••"
              value={inviteForm.password}
              onChange={(e) => onFormChange({ ...inviteForm, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Organization Role
            </label>
            <select
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
              value={inviteForm.role}
              onChange={(e) => onFormChange({ ...inviteForm, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition"
            >
              Invite User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
