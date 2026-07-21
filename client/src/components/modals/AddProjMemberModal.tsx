import React from 'react';

interface AddProjMemberModalProps {
  unassignedOrgMembers: any[];
  userId: string;
  onUserIdChange: (id: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function AddProjMemberModal({
  unassignedOrgMembers,
  userId,
  onUserIdChange,
  role,
  onRoleChange,
  onSubmit,
  onCancel,
}: AddProjMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md border border-neutral-800 bg-neutral-900 p-6 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Add Project Member</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              Select Organization User
            </label>
            <select
              required
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
            >
              <option value="">Select User...</option>
              {unassignedOrgMembers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} (@{u.username})
                </option>
              ))}
            </select>
            {unassignedOrgMembers.length === 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                All organization members are already added to this project.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              Project Role
            </label>
            <select
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/50"
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
              className="px-4 py-2 border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userId}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
