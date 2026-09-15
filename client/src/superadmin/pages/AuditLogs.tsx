import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Activity,
  Lock,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTableToolbar } from '../components/DataTableToolbar';
import { auditLogApi } from '../services/auditLogApi';
import type { AuditLogEntry, AuditStats } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [targetFilter, setTargetFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Row expand for details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logRes, statRes] = await Promise.all([
        auditLogApi.getAuditLogs({
          search: searchQuery || undefined,
          action: actionFilter !== 'All' ? actionFilter : undefined,
          targetType: targetFilter !== 'All' ? targetFilter : undefined,
          page,
          pageSize,
        }),
        auditLogApi.getAuditStats(),
      ]);

      if (logRes.success && Array.isArray(logRes.data)) {
        setLogs(logRes.data);
        setTotalCount(logRes.pagination?.totalItems || logRes.data.length);
      } else {
        setLogs([]);
      }

      if (statRes.success && statRes.data) {
        setStats(statRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit log trail.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, actionFilter, targetFilter, page, pageSize]);

  const getActionBadge = (action: string, status?: string) => {
    if (status === 'Warning' || action.includes('Impersonate') || action.includes('Delete')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('Status') || action.includes('Toggle')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('Create') || action.includes('Initialize')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs & Activity Trail"
        subtitle="Immutable security audit trail logging every administrative change, plan update, and support impersonation."
        icon={ShieldCheck}
        onRefresh={loadData}
        isRefreshing={loading}
      />

      {/* STAT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Activity Records"
          value={stats?.totalEvents ?? totalCount}
          icon={Activity}
          colorScheme="blue"
          subtext="Indexed administrative events"
        />
        <StatCard
          label="Events Today"
          value={stats?.eventsToday ?? 0}
          icon={Clock}
          colorScheme="emerald"
          subtext="Recorded in last 24 hours"
        />
        <StatCard
          label="Security & Impersonations"
          value={stats?.securityActions ?? 0}
          icon={Lock}
          colorScheme="rose"
          subtext="High-privilege actions"
        />
        <StatCard
          label="Config & Feature Changes"
          value={stats?.configChanges ?? 0}
          icon={Sliders}
          colorScheme="amber"
          subtext="Plan & toggle mutations"
        />
      </div>

      {/* TOOLBAR */}
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Filter by actor, action, target, or details..."
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
        filters={[
          {
            id: 'action',
            value: actionFilter,
            onChange: (v) => {
              setActionFilter(v);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Actions' },
              { value: 'ImpersonateTenant', label: 'Impersonations' },
              { value: 'ToggleTenantStatus', label: 'Tenant Status' },
              { value: 'UpdateTenantPlan', label: 'Plan Changes' },
              { value: 'UpdateTenantFeatures', label: 'Feature Toggles' },
              { value: 'CreateTenant', label: 'Tenant Created' },
              { value: 'CreatePlan', label: 'Plan Created' },
            ],
          },
          {
            id: 'target',
            value: targetFilter,
            onChange: (v) => {
              setTargetFilter(v);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Targets' },
              { value: 'Tenant', label: 'Tenant' },
              { value: 'Plan', label: 'Plan Tier' },
              { value: 'PlatformStaff', label: 'Staff' },
              { value: 'Invoice', label: 'Invoice' },
            ],
          },
        ]}
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading security audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Activity Logs Found</h3>
            <p className="text-xs text-slate-400 mt-1">No log events match your current query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Event Details</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          <div>{new Date(log.timestamp).toLocaleDateString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                              {log.userName.charAt(0).toUpperCase()}
                            </span>
                            <span>{log.userName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {log.actorEmail || 'platform-admin'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getActionBadge(
                              log.action,
                              log.status
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{log.targetType || 'Platform'}</span>
                          {log.targetId && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {log.targetId.length > 16 ? `${log.targetId.substring(0, 16)}...` : log.targetId}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {log.details}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <td colSpan={6} className="p-4 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 space-y-2">
                              <div className="font-bold text-slate-900">Complete Event Breakdown:</div>
                              <p className="text-slate-600 leading-relaxed">{log.details}</p>
                              {log.changesJson && (
                                <div>
                                  <span className="font-bold text-slate-700 block mb-1">Before / After Diff:</span>
                                  <pre className="p-2 rounded bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                                    {log.changesJson}
                                  </pre>
                                </div>
                              )}
                              <div className="flex gap-4 text-[11px] text-slate-400 pt-1">
                                <span>Record ID: {log.id}</span>
                                <span>Tenant Context: {log.tenantId}</span>
                                <span>Status: {log.status}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
