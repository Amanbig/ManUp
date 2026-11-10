import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  PlusCircle,
  Edit,
  Trash2,
  RotateCcw,
  KeyRound,
  LogIn,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Info,
} from 'lucide-react';
import { api } from '../../api';
import type { AuditLog } from '../../types';

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const limit = 25;

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        limit,
        offset: page * limit,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        search: search.trim() || undefined,
      });

      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to retrieve audit trail');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SECRET_CREATED':
        return {
          icon: <PlusCircle className="h-3.5 w-3.5" />,
          label: 'Secret Created',
          style: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
        };
      case 'SECRET_UPDATED':
        return {
          icon: <Edit className="h-3.5 w-3.5" />,
          label: 'Secret Updated',
          style: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
        };
      case 'SECRET_DELETED':
        return {
          icon: <Trash2 className="h-3.5 w-3.5" />,
          label: 'Secret Deleted',
          style: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
        };
      case 'SECRET_ROLLED_BACK':
        return {
          icon: <RotateCcw className="h-3.5 w-3.5" />,
          label: 'Secret Restored',
          style: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400',
        };
      case 'SECRETS_BULK_IMPORTED':
        return {
          icon: <FileCode2 className="h-3.5 w-3.5" />,
          label: 'Bulk Imported',
          style: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400',
        };
      case 'ENVIRONMENT_CREATED':
        return {
          icon: <Layers className="h-3.5 w-3.5" />,
          label: 'Env Created',
          style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        };
      case 'ENVIRONMENT_DELETED':
        return {
          icon: <Layers className="h-3.5 w-3.5" />,
          label: 'Env Deleted',
          style: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
        };
      case 'API_KEY_CREATED':
        return {
          icon: <KeyRound className="h-3.5 w-3.5" />,
          label: 'API Key Created',
          style: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400',
        };
      case 'API_KEY_REVOKED':
        return {
          icon: <KeyRound className="h-3.5 w-3.5" />,
          label: 'API Key Revoked',
          style: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
        };
      case 'USER_LOGIN':
        return {
          icon: <LogIn className="h-3.5 w-3.5" />,
          label: 'User Login',
          style: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400',
        };
      default:
        return {
          icon: <Info className="h-3.5 w-3.5" />,
          label: action,
          style: 'bg-neutral-500/10 border-neutral-500/20 text-neutral-700 dark:text-neutral-400',
        };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display">
              Security Audit Logs
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Comprehensive chronological trail of secret changes, access events, and administrative
              activities
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by secret key, action, or IP address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-orange-500 transition text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-orange-500 transition text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="SECRET_CREATED">Secret Created</option>
            <option value="SECRET_UPDATED">Secret Updated</option>
            <option value="SECRET_DELETED">Secret Deleted</option>
            <option value="SECRET_ROLLED_BACK">Secret Restored</option>
            <option value="SECRETS_BULK_IMPORTED">Bulk Imported</option>
            <option value="ENVIRONMENT_CREATED">Environment Created</option>
            <option value="ENVIRONMENT_DELETED">Environment Deleted</option>
            <option value="API_KEY_CREATED">API Key Created</option>
            <option value="API_KEY_REVOKED">API Key Revoked</option>
            <option value="USER_LOGIN">User Login</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs outline-none focus:border-orange-500 transition text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            <option value="">All Resource Types</option>
            <option value="secret">Secrets</option>
            <option value="environment">Environments</option>
            <option value="api_key">API Keys</option>
            <option value="auth">Authentication</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950/20 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/30 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Target Resource</th>
                <th className="px-5 py-3.5">Scope</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">IP / Client</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900 font-sans">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-neutral-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-orange-500" />
                    <p className="text-xs">Loading audit trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-neutral-400">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-neutral-400 opacity-40" />
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      No Audit Records Found
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {search || actionFilter || entityFilter
                        ? 'Try clearing active filters to see all audit events.'
                        : 'Audit events will appear here as users perform actions.'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/30 transition group"
                    >
                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.style}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Target Resource */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-medium text-neutral-900 dark:text-neutral-200">
                        {log.entityName || '-'}
                      </td>

                      {/* Scope */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          {log.project?.name && (
                            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] border border-neutral-200 dark:border-neutral-700">
                              {log.project.name}
                            </span>
                          )}
                          {log.environment?.name && (
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-mono border border-orange-500/20">
                              {log.environment.name}
                            </span>
                          )}
                          {!log.project && !log.environment && (
                            <span className="text-neutral-400 text-[11px]">Org-wide</span>
                          )}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
                              {(log.user.name || log.user.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-xs block leading-tight">
                                {log.user.name || log.user.username}
                              </span>
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                {log.user.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">
                            System / API Key
                          </span>
                        )}
                      </td>

                      {/* IP / Client */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                        {log.ipAddress || 'Internal'}
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-neutral-500 text-[11px] font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Details toggle */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {log.metadata ? (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition cursor-pointer"
                            title="Toggle metadata details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-neutral-300 dark:text-neutral-700">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Metadata Drawer */}
        {expandedLogId && (
          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800">
            <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Event Metadata:
            </h4>
            <pre className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-800 dark:text-neutral-200 overflow-x-auto">
              {JSON.stringify(logs.find((l) => l.id === expandedLogId)?.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 text-xs text-neutral-500">
          <div>
            Showing <span className="font-semibold">{logs.length}</span> of{' '}
            <span className="font-semibold">{total}</span> total events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-mono text-[11px]">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
