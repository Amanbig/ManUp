import { Building2, Briefcase, Globe, Plus, Trash2 } from 'lucide-react';
import type { Member, Project, Environment } from '../../types';

interface MembersViewProps {
  currentUser: any;
  orgMembers: Member[];
  projMembers: Member[];
  envMembers: Member[];
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  setIsInviteOpen: (open: boolean) => void;
  setIsAddProjMemberOpen: (open: boolean) => void;
  setIsAddEnvMemberOpen: (open: boolean) => void;
  handleRemoveProjMember: (userId: string) => void;
  handleRemoveEnvMember: (userId: string) => void;
  handleRemoveOrgMember: (userId: string) => void;
  getProjectRole: () => string;
  getEnvRole: () => string;
}

export default function MembersView({
  currentUser,
  orgMembers,
  projMembers,
  envMembers,
  selectedProject,
  selectedEnvironment,
  setIsInviteOpen,
  setIsAddProjMemberOpen,
  setIsAddEnvMemberOpen,
  handleRemoveProjMember,
  handleRemoveEnvMember,
  handleRemoveOrgMember,
  getProjectRole,
  getEnvRole,
}: MembersViewProps) {
  const canDeleteOrgMember = (memberToDelete: Member) => {
    if (!currentUser) return false;
    // Cannot delete yourself
    if (memberToDelete.id === currentUser.id) return false;
    // Cannot delete the owner of the organization
    if (memberToDelete.type === 'owner') return false;

    if (currentUser.type === 'owner') return true;
    if (currentUser.type === 'admin') {
      // Admins can delete members, but not other admins/owner
      return memberToDelete.type !== 'admin';
    }
    return false;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Organization Members */}
      <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              Organization Members
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              List of users associated with this organization.
            </p>
          </div>
          {(currentUser?.type === 'owner' || currentUser?.type === 'admin') && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Invite User</span>
            </button>
          )}
        </div>
        <div className="divide-y divide-neutral-900">
          {orgMembers.map((member) => (
            <div key={member.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-neutral-200">{member.name}</span>
                <span className="text-neutral-500 ml-2 font-mono">@{member.username}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">{member.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-orange-950/30 text-orange-400 border border-orange-800/30 text-xs font-medium uppercase tracking-wider">
                  {member.type || member.role || 'member'}
                </span>
                {canDeleteOrgMember(member) && (
                  <button
                    onClick={() => handleRemoveOrgMember(member.id)}
                    className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition"
                    title="Remove Member from Organization"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project & Environment Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Members */}
        <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-200 flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                Project Members
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active Project: {selectedProject?.name || 'None'}
              </p>
            </div>
            {getProjectRole() === 'admin' && (
              <button
                disabled={!selectedProject}
                onClick={() => setIsAddProjMemberOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-neutral-900">
            {projMembers.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-neutral-200">{member.name}</span>
                  <span className="block text-xs text-neutral-500 font-mono mt-0.5">
                    @{member.username}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">
                    {member.role}
                  </span>
                  {getProjectRole() === 'admin' && (
                    <button
                      onClick={() => handleRemoveProjMember(member.userId || '')}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {projMembers.length === 0 && (
              <p className="text-sm text-neutral-500 py-4 text-center">
                No members assigned to this project yet.
              </p>
            )}
          </div>
        </div>

        {/* Environment Access */}
        <div className="bg-[#0e0e13]/40 border border-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-200 flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-teal-400" />
                Environment Access
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active Environment: {selectedEnvironment?.name || 'None'}
              </p>
            </div>
            {getEnvRole() === 'admin' && (
              <button
                disabled={!selectedEnvironment}
                onClick={() => setIsAddEnvMemberOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-neutral-900">
            {envMembers.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-neutral-200">{member.name}</span>
                  <span className="block text-xs text-neutral-500 font-mono mt-0.5">
                    @{member.username}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">
                    {member.role}
                  </span>
                  {getEnvRole() === 'admin' && (
                    <button
                      onClick={() => handleRemoveEnvMember(member.userId || '')}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {envMembers.length === 0 && (
              <p className="text-sm text-neutral-500 py-4 text-center">
                No members assigned to this environment yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
