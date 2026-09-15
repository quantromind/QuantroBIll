import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Shield,
  CheckCircle2,
  Trash2,
  Edit2,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTableToolbar } from '../components/DataTableToolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { teamApi } from '../services/teamApi';
import type { PlatformTeamMember } from '../types';

export const TeamManagement: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<PlatformTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<PlatformTeamMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teamApi.getTeamMembers();
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform team members.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleToggleStatus = async (member: PlatformTeamMember) => {
    const newActive = !member.isActive;
    try {
      await teamApi.toggleStatus(member.id, newActive);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: newActive } : m))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update member status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await teamApi.deleteTeamMember(deleteTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete team member.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? m.isActive
        : !m.isActive;

    return matchSearch && matchStatus;
  });

  const totalTeam = members.length;
  const activeStaff = members.filter((m) => m.isActive).length;

  return (
    <div>
      <PageHeader
        title="SuperAdmin Team & Granular Roles"
        subtitle="Manage platform internal support staff, billing officers, and operations team with scoped permissions."
        icon={Users}
        onRefresh={loadMembers}
        isRefreshing={loading}
      >
        <button
          onClick={() => navigate('/superadmin/team/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </PageHeader>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Internal Staff"
          value={totalTeam}
          icon={Users}
          colorScheme="blue"
          subtext="Platform team users"
        />
        <StatCard
          label="Active Accounts"
          value={activeStaff}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtext="Active platform operators"
        />
        <StatCard
          label="Support Operators"
          value={members.filter((m) => m.permissions?.some((p) => p.includes('tenants'))).length}
          icon={Shield}
          colorScheme="purple"
          subtext="Impersonation & troubleshooting"
        />
        <StatCard
          label="Billing Operators"
          value={members.filter((m) => m.permissions?.some((p) => p.includes('billing'))).length}
          icon={Lock}
          colorScheme="amber"
          subtext="Invoice & subscription control"
        />
      </div>

      {/* TOOLBAR */}
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search team by name, email, or username..."
        totalCount={filteredMembers.length}
        filters={[
          {
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'All', label: 'All Staff' },
              { value: 'Active', label: 'Active Only' },
              { value: 'Inactive', label: 'Inactive' },
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
          <button onClick={loadMembers} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading platform team...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Team Members Found</h3>
            <p className="text-xs text-slate-400 mt-1">No admin team records match your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role Title</th>
                  <th className="py-3.5 px-4">Assigned Permissions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{member.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{member.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] border border-blue-200">
                        {member.role || 'SuperAdmin'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {member.permissions?.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider cursor-pointer transition ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/superadmin/team/${member.id}`)}
                          className="w-7 h-7 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition cursor-pointer"
                          title="Configure Member Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {member.email !== 'admin@quantromind.com' && (
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="w-7 h-7 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Team Member?"
        message={`Are you sure you want to remove ${deleteTarget?.fullName} (${deleteTarget?.email}) from the platform administration team?`}
        confirmText="Remove Member"
        variant="danger"
        isProcessing={isProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
