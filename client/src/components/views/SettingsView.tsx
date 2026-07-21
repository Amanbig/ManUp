import React from 'react';
import { Check, Globe } from 'lucide-react';
import type { Project } from '../../types';

interface SettingsViewProps {
  successMsg: string;
  currentUser: any;
  currentOrg: any;
  selectedProject: Project | null;
  getProjectRole: () => string;

  // Profile settings state/actions
  profileName: string;
  setProfileName: (val: string) => void;
  profileUsername: string;
  setProfileUsername: (val: string) => void;
  profileEmail: string;
  setProfileEmail: (val: string) => void;
  profilePassword: string;
  setProfilePassword: (val: string) => void;
  handleSaveProfile: (e: React.FormEvent) => void;

  // Project settings state/actions
  projName: string;
  setProjName: (val: string) => void;
  projDesc: string;
  setProjDesc: (val: string) => void;
  handleSaveProjectDetails: (e: React.FormEvent) => void;

  // Org settings state/actions
  orgName: string;
  setOrgName: (val: string) => void;
  orgDesc: string;
  setOrgDesc: (val: string) => void;
  handleSaveOrgDetails: (e: React.FormEvent) => void;

  // Export actions
  handleExportJSON: () => void;
  handleExportCSV: () => void;

  // Delete action triggers
  onDeleteProjectClick: () => void;
  onDeleteOrgClick: () => void;
  onDeleteAccountClick: () => void;
}

export default function SettingsView({
  successMsg,
  currentUser,
  currentOrg,
  selectedProject,
  getProjectRole,

  profileName,
  setProfileName,
  profileUsername,
  setProfileUsername,
  profileEmail,
  setProfileEmail,
  profilePassword,
  setProfilePassword,
  handleSaveProfile,

  projName,
  setProjName,
  projDesc,
  setProjDesc,
  handleSaveProjectDetails,

  orgName,
  setOrgName,
  orgDesc,
  setOrgDesc,
  handleSaveOrgDetails,

  handleExportJSON,
  handleExportCSV,

  onDeleteProjectClick,
  onDeleteOrgClick,
  onDeleteAccountClick,
}: SettingsViewProps) {
  return (
    <div className="space-y-8 max-w-4xl pb-16 font-sans">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2 animate-fadeIn">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: User Profile Settings */}
      <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white">Profile Settings</h3>
          <p className="text-xs text-neutral-500 mt-0.5 font-sans">
            Manage your user identity and email details.
          </p>
        </div>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
              value={profileUsername}
              onChange={(e) => setProfileUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
            />
          </div>
          {currentUser && (profileUsername !== currentUser.username || profileEmail !== currentUser.email) && (
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-red-400 uppercase tracking-wider">
                Current Password (Required to change username or email)
              </label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-red-800/40 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500/50"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="Confirm changes with password"
              />
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Project Settings */}
      {selectedProject && getProjectRole() === 'admin' && (
        <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Project Settings</h3>
            <p className="text-xs text-neutral-500 mt-0.5 font-sans">
              Modify workspace environment context and naming.
            </p>
          </div>
          <form onSubmit={handleSaveProjectDetails} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Project Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
              >
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 3: Organization Settings */}
      {currentOrg && (currentUser?.type === 'owner' || currentUser?.type === 'admin') && (
        <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Organization Settings</h3>
            <p className="text-xs text-neutral-500 mt-0.5 font-sans">
              Rename org namespace and core configurations.
            </p>
          </div>
          <form onSubmit={handleSaveOrgDetails} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Organization Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-orange-500/50"
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-orange-600/10"
              >
                Save Organization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 4: Data Export */}
      {getProjectRole() !== 'viewer' && (
        <div className="border border-neutral-900 bg-neutral-950/20 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Data Export</h3>
            <p className="text-xs text-neutral-500 mt-0.5 font-sans">
              Export decrypted environment secret configurations to files.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Globe className="h-4 w-4 text-orange-500" />
              <span>Export as JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Globe className="h-4 w-4 text-orange-500" />
              <span>Export as CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 5: Danger Zone */}
      <div className="border border-red-500/20 bg-red-950/5 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-red-500">Danger Zone</h3>
          <p className="text-xs text-neutral-500 mt-0.5 font-sans">
            Irreversible and destructive actions. Proceed with caution.
          </p>
        </div>
        <div className="divide-y divide-neutral-900">
          {selectedProject && getProjectRole() === 'admin' && (
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">Delete Project</h4>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                  Permanently delete project <strong className="text-neutral-300">"{selectedProject.name}"</strong> and all its environments & secrets.
                </p>
              </div>
              <button
                onClick={onDeleteProjectClick}
                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
              >
                Delete Project
              </button>
            </div>
          )}

          {currentOrg && (currentUser?.type === 'owner' || currentUser?.type === 'admin') && (
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">Delete Organization</h4>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                  Permanently delete organization <strong className="text-neutral-300">"{currentOrg.name}"</strong> and all associated resources.
                </p>
              </div>
              <button
                onClick={onDeleteOrgClick}
                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
              >
                Delete Org
              </button>
            </div>
          )}

          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-neutral-200">Delete Account</h4>
              <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                Wipe your profile information and purge your user credentials permanently.
              </p>
            </div>
            <button
              onClick={onDeleteAccountClick}
              className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-800 text-red-400 rounded-lg text-xs font-semibold transition shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
