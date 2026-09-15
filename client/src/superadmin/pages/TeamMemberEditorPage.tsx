import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { teamApi } from '../services/teamApi';

const availablePermissions = [
  { id: 'tenants.read', label: 'View Restaurants & Tenants', desc: 'Read-only access to all restaurant accounts' },
  { id: 'tenants.manage', label: 'Manage & Onboard Tenants', desc: 'Create, edit profile, and toggle active status' },
  { id: 'tenants.impersonate', label: 'Support Impersonation', desc: 'Generate login sessions into tenant POS/owner portal' },
  { id: 'billing.manage', label: 'Billing & Invoices Management', desc: 'View revenue, issue invoices, and mark paid' },
  { id: 'plans.manage', label: 'Plans Catalog Control', desc: 'Create and edit pricing tiers and feature allocations' },
  { id: 'coupons.manage', label: 'Coupons & Discounts', desc: 'Create discount codes and track redemptions' },
  { id: 'announcements.manage', label: 'Broadcast Announcements', desc: 'Compose and dispatch system alerts to restaurants' },
  { id: 'logs.read', label: 'Audit Log Trail Access', desc: 'Inspect platform immutable activity trails' },
  { id: 'settings.manage', label: 'Global Platform Settings', desc: 'Configure SMTP, gateway credentials, and defaults' },
];

export const TeamMemberEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    email: string;
    username: string;
    fullName: string;
    phone: string;
    password?: string;
    permissions: string[];
    isActive: boolean;
  }>({
    email: '',
    username: '',
    fullName: '',
    phone: '',
    password: '',
    permissions: ['tenants.read', 'logs.read'],
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      teamApi
        .getTeamMemberById(id)
        .then((res) => {
          if (res.success && res.data) {
            setFormData({
              email: res.data.email,
              username: res.data.username,
              fullName: res.data.fullName,
              phone: res.data.phone || '',
              permissions: res.data.permissions || [],
              isActive: res.data.isActive,
            });
          } else {
            setError('Team member not found.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load team member.');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditing, id]);

  const handlePermissionToggle = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email?.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!isEditing && !formData.password?.trim()) {
      setError('Password is required for new team members.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await teamApi.updateTeamMember(id, formData);
        setSuccessMessage('Team member updated successfully.');
      } else {
        await teamApi.createTeamMember({
          email: formData.email,
          username: formData.username || formData.email.split('@')[0],
          fullName: formData.fullName || formData.email.split('@')[0],
          phone: formData.phone,
          password: formData.password || 'TempPass@#2026',
          permissions: formData.permissions,
        });
        setSuccessMessage('New admin staff member created.');
      }
      setTimeout(() => {
        navigate('/superadmin/team');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save team member.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading member details...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/superadmin/team')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Team</span>
        </button>
      </div>

      <PageHeader
        title={isEditing ? `Configure Admin Staff: ${formData.fullName}` : 'Add New Admin Staff'}
        subtitle="Provision platform administrative accounts with granular role capabilities."
        icon={Users}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            1. Staff Member Identity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Kulkarni"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address (Login ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                disabled={isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. ramesh@quantromind.com"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Identifier
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. ramesh_support"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEditing ? 'Change Password (leave blank to keep current)' : 'Account Password *'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Account is Active & Allowed to Sign In</span>
              </label>
            </div>
          </div>
        </div>

        {/* Granular Permissions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Granular Role Capabilities
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check specific modules and features this staff member is authorized to access.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  permissions: availablePermissions.map((p) => p.id),
                })
              }
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Grant All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availablePermissions.map((perm) => {
              const checked = formData.permissions.includes(perm.id);
              return (
                <label
                  key={perm.id}
                  onClick={() => handlePermissionToggle(perm.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                    checked
                      ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">{perm.label}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{perm.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/team')}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Staff Changes' : 'Create Staff Member'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
