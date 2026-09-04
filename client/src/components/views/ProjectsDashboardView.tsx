import { useState, useMemo } from 'react';
import {
  Folder,
  Plus,
  Search,
  Building2,
  ArrowRight,
  Edit2,
  Trash2,
  Layers,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { Project } from '../../types';

interface ProjectsDashboardViewProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  currentUser: any;
  currentOrg: any;
  getProjectRole: (project?: Project) => string;
}

export default function ProjectsDashboardView({
  projects,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  currentUser,
  currentOrg,
  getProjectRole,
}: ProjectsDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const totalEnvironments = useMemo(() => {
    return projects.reduce(
      (acc, p) => acc + (p.environmentCount || p.environments?.length || 0),
      0,
    );
  }, [projects]);

  const canCreate = currentUser?.type !== 'viewer';

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-900">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              Vault Workspace
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {currentOrg?.name || 'Organization'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-display">
            Projects
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Choose a project to access its environments, view encrypted secrets, or manage RBAC
            access controls.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onCreateProject}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-orange-600/15 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2 font-display">
            {projects.length}
          </p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 block">
            Configured in this vault
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Environments
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2 font-display">
            {totalEnvironments}
          </p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 block">
            Dev, Staging & Production scopes
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Security Model
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white mt-2 font-display">
            Zero-Trust DEK Envelope
          </p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 block">
            Per-environment KMS isolation
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-orange-500/60 transition shadow-xs"
          />
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          Showing {filteredProjects.length} of {projects.length}{' '}
          {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const role = getProjectRole(project);
            const envCount = project.environmentCount || project.environments?.length || 0;
            const createdDate = project.createdAt
              ? new Date(project.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/50 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/80 hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200 cursor-pointer"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20 group-hover:scale-105 transition shrink-0">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition leading-snug line-clamp-1">
                          {project.name}
                        </h3>
                        {createdDate && (
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            <span>{createdDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div
                      className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {role === 'admin' && (
                        <>
                          <button
                            onClick={() => onEditProject(project)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="Edit Project"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProject(project)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 min-h-[32px] leading-relaxed">
                    {project.description || 'No description provided for this project.'}
                  </p>

                  {/* Environments Preview Pills */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-2">
                      Environments ({envCount})
                    </span>
                    {project.environments && project.environments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {project.environments.slice(0, 4).map((env) => (
                          <span
                            key={env.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/60"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                env.name.toLowerCase().includes('prod')
                                  ? 'bg-red-500'
                                  : env.name.toLowerCase().includes('stag')
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                            />
                            {env.name}
                          </span>
                        ))}
                        {project.environments.length > 4 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800">
                            +{project.environments.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic">
                        {envCount > 0
                          ? `${envCount} environments available`
                          : 'No environments yet'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {role.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Project</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Project Card */}
          {canCreate && (
            <div
              onClick={onCreateProject}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-850 hover:border-orange-500/50 dark:hover:border-orange-500/50 bg-neutral-50/40 dark:bg-neutral-900/20 hover:bg-orange-500/5 dark:hover:bg-orange-500/5 transition cursor-pointer text-center group min-h-[220px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:bg-orange-500/10 group-hover:text-orange-500 group-hover:scale-110 transition">
                <Plus className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                Create Another Project
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">
                Organize your microservices, APIs, and client applications.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-12 md:p-16 text-center bg-white dark:bg-neutral-950/20 shadow-xs">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4">
            <Folder className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {searchQuery ? 'No matching projects' : 'No Projects Created Yet'}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No projects matched "${searchQuery}". Try a different search term or clear the filter.`
              : 'Projects isolate your environments and secrets. Create your first project to configure Development, Staging, and Production scopes.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-sm font-medium text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
              >
                Clear Search
              </button>
            ) : canCreate ? (
              <button
                onClick={onCreateProject}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-orange-600/20 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Project</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
