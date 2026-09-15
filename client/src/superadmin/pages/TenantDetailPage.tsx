import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Store,
  Users,
  Sliders,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Save,
  Trash2,
  Key,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { tenantsApi } from '../services/tenantsApi';
import type { TenantFullDetails } from '../types';

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<TenantFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'outlets' | 'users' | 'invoices' | 'features' | 'audit'>('overview');

  // Feature flags state
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [featureSaveSuccess, setFeatureSaveSuccess] = useState(false);

  // Modals & Action Confirmations
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [confirmImpersonateOpen, setConfirmImpersonateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tenantsApi.getTenantFullDetails(id);
      if (res.success && res.data) {
        setDetails(res.data);
        setFeatures(res.data.tenant.features || {});
      } else {
        setError('Could not retrieve full tenant record.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching tenant details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!details || !id) return;
    setIsActionProcessing(true);
    const newActive = !details.tenant.isActive;
    try {
      await tenantsApi.toggleTenantStatus(id, newActive);
      setDetails({
        ...details,
        tenant: { ...details.tenant, isActive: newActive },
      });
      setConfirmSuspendOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsActionProcessing(true);
    try {
      await tenantsApi.deleteTenant(id);
      setConfirmDeleteOpen(false);
      navigate('/superadmin/tenants');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate tenant.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmImpersonate = async () => {
    if (!id) return;
    setIsActionProcessing(true);
    try {
      const res = await tenantsApi.impersonateTenant(id);
      if (res.success && res.data?.token) {
        // Backup superadmin token
        const superToken = localStorage.getItem('quantrobill_access_token');
        if (superToken) {
          sessionStorage.setItem('quantrobill_superadmin_restore_token', superToken);
        }
        // Set impersonated access token
        localStorage.setItem('quantrobill_access_token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('quantrobill_user', JSON.stringify(res.data.user));
          if (res.data.user.outletId) {
            localStorage.setItem(
              'quantrobill_active_outlet',
              JSON.stringify({ id: res.data.user.outletId, name: res.data.user.outletName || 'Main Outlet' })
            );
          }
        }
        setConfirmImpersonateOpen(false);
        window.location.href = res.data.targetUrl || '/owner/dashboard';
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize impersonation session.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleSaveFeatures = async () => {
    if (!id) return;
    setIsSavingFeatures(true);
    try {
      await tenantsApi.updateTenantFeatures(id, features);
      setFeatureSaveSuccess(true);
      setTimeout(() => setFeatureSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save feature toggles.');
    } finally {
      setIsSavingFeatures(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading full restaurant portfolio...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">{error || 'Restaurant record not found.'}</h3>
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 hover:underline"
        >
          Return to Tenants
        </button>
      </div>
    );
  }

  const { tenant, outlets, users, invoices, auditLogs } = details;

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants & Tenants</span>
        </button>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xl shrink-0">
            {tenant.businessName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{tenant.businessName}</h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  tenant.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {tenant.isActive ? 'Active' : 'Suspended'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                Plan: {tenant.subscriptionPlan}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>Legal: {tenant.legalName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {tenant.city}, {tenant.state}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">ID: {tenant.id}</span>
            </p>
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Impersonate Button */}
          <button
            onClick={() => setConfirmImpersonateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition cursor-pointer"
            title="Log in to this restaurant as owner for support"
          >
            <Key className="w-4 h-4" />
            <span>Login as Tenant</span>
          </button>

          {/* Suspend / Reactivate */}
          <button
            onClick={() => setConfirmSuspendOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border shadow-2xs transition cursor-pointer ${
              tenant.isActive
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <span>{tenant.isActive ? 'Suspend Tenant' : 'Reactivate Tenant'}</span>
          </button>

          {/* Delete / Deactivate */}
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 cursor-pointer"
            title="Soft Delete Tenant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Outlets"
          value={`${outlets.length} / ${tenant.maxOutlets}`}
          icon={Store}
          colorScheme="blue"
          subtext="Branches configured"
        />
        <StatCard
          label="Registered Staff"
          value={users.length}
          icon={Users}
          colorScheme="emerald"
          subtext="Total user accounts"
        />
        <StatCard
          label="Invoices Generated"
          value={invoices.length}
          icon={Receipt}
          colorScheme="purple"
          subtext={`Latest: ${invoices[0]?.status || 'None'}`}
        />
        <StatCard
          label="Audit Trail Events"
          value={auditLogs.length}
          icon={ShieldCheck}
          colorScheme="slate"
          subtext="Activity records"
        />
      </div>

      {/* TABS NAVIGATION */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Profile & Overview', icon: Building2 },
            { id: 'outlets', label: `Outlets (${outlets.length})`, icon: Store },
            { id: 'users', label: `Staff & Users (${users.length})`, icon: Users },
            { id: 'invoices', label: `Billing History (${invoices.length})`, icon: Receipt },
            { id: 'features', label: 'Feature Flags', icon: Sliders },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Owner & Contact Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Owner Email</span>
                <span className="font-semibold text-slate-900">{tenant.ownerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Owner Phone</span>
                <span className="font-semibold text-slate-900">{tenant.ownerPhone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">GSTIN Registration</span>
                <span className="font-semibold font-mono text-slate-900">{tenant.gstin || 'Unregistered'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Business Category</span>
                <span className="font-semibold text-slate-900">{tenant.businessType}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Subscription & Entitlement Status
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Current Plan Tier</span>
                <span className="font-bold text-blue-600 text-sm">QuantroBill {tenant.subscriptionPlan}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Subscription Expiration</span>
                <span className="font-semibold text-slate-900">
                  {tenant.subscriptionExpiresAt
                    ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString('en-IN')
                    : 'Ongoing'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Branch Quota</span>
                <span className="font-semibold text-slate-900">
                  {outlets.length} used of {tenant.maxOutlets} allowed
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Onboarded Since</span>
                <span className="font-semibold text-slate-900">
                  {new Date(tenant.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outlets' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Configured Outlets ({outlets.length})</h3>
            <span className="text-xs text-slate-400">Limit: {tenant.maxOutlets} outlets</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Outlet Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">City / Address</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {outlets.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{o.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{o.code}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {o.city} {o.address ? `• ${o.address}` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          o.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {o.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Restaurant Employees & Accounts ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Login / Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName || u.username}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Subscription Invoices ({invoices.length})</h3>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No invoices generated yet for this tenant.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Plan & Cycle</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        {inv.planName} ({inv.billingCycle})
                      </td>
                      <td className="py-3 px-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Module Feature Flags
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable operational modules specifically for this restaurant tenant.
              </p>
            </div>

            <button
              onClick={handleSaveFeatures}
              disabled={isSavingFeatures}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingFeatures ? 'Saving...' : 'Save Toggles'}</span>
            </button>
          </div>

          {featureSaveSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Feature flags saved successfully for this tenant.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'enableKds', label: 'Kitchen Display System (KDS)', desc: 'Live kitchen ticket display' },
              { key: 'enableWaiterApp', label: 'Waiter & Captain Mobile App', desc: 'Floor order taking' },
              { key: 'enableAggregators', label: 'Online Aggregator Bridge', desc: 'Zomato & Swiggy auto-sync' },
              { key: 'enableRecipeInventory', label: 'Recipe Inventory Deduction', desc: 'BOM ingredient tracking' },
              { key: 'enableKhataBook', label: 'KhataBook / Credit Ledger', desc: 'Post-pay tab settlement' },
            ].map((f) => {
              const enabled = Boolean(features[f.key]);
              return (
                <label
                  key={f.key}
                  onClick={() => setFeatures({ ...features, [f.key]: !enabled })}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer select-none ${
                    enabled
                      ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold block">{f.label}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{f.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Tenant Activity Log ({auditLogs.length})</h3>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No audit logs recorded for this tenant yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-xs hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">• by {log.userName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DIALOGS */}
      {/* 1. Impersonate */}
      <ConfirmDialog
        isOpen={confirmImpersonateOpen}
        title="Impersonate Restaurant Owner?"
        message={`You are about to start a temporary administrative session as the owner of "${tenant.businessName}". This action will be logged in the immutable security audit trail.`}
        confirmText="Start Impersonation"
        variant="warning"
        isProcessing={isActionProcessing}
        onConfirm={handleConfirmImpersonate}
        onCancel={() => setConfirmImpersonateOpen(false)}
      />

      {/* 2. Suspend / Activate */}
      <ConfirmDialog
        isOpen={confirmSuspendOpen}
        title={`${tenant.isActive ? 'Suspend' : 'Reactivate'} Restaurant?`}
        message={`Are you sure you want to ${
          tenant.isActive ? 'suspend all POS and billing access for' : 'restore access for'
        } "${tenant.businessName}"?`}
        confirmText={tenant.isActive ? 'Suspend Tenant' : 'Reactivate Tenant'}
        variant={tenant.isActive ? 'danger' : 'primary'}
        isProcessing={isActionProcessing}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmSuspendOpen(false)}
      />

      {/* 3. Delete */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Soft Delete Tenant?"
        message={`Are you sure you want to deactivate "${tenant.businessName}"? The restaurant and its outlets will be archived and marked inactive.`}
        confirmText="Deactivate Tenant"
        variant="danger"
        isProcessing={isActionProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
