import React from 'react';

interface AddEnvMemberModalProps {
  unassignedProjMembers: any[];
  userId: string;
  onUserIdChange: (id: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function AddEnvMemberModal({
  unassignedProjMembers,
  userId,
  onUserIdChange,
  role,
  onRoleChange,
  onSubmit,
  onCancel,
}: AddEnvMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          Grant Environment Access
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Select Project Member
            </label>
            <select
              required
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
            >
              <option value="">Select User...</option>
              {unassignedProjMembers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} (@{u.username})
                </option>
              ))}
            </select>
            {unassignedProjMembers.length === 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                All project members are already added to this environment.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Environment Access Role
            </label>
            <select
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
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
              disabled={!userId}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
