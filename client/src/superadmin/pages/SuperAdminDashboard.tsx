import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Store,
  CreditCard,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { initialTenants } from '../services/mockTenantData';
import type { Tenant } from '../types';
import { apiClient } from '../../services/api';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch live tenants from backend
  const loadTenants = () => {
    apiClient
      .get<{ success: boolean; data: any[] }>('/tenants')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const backendTenants: Tenant[] = res.data.data.map((bt: any) => ({
            id: bt.id,
            businessName: bt.businessName,
            legalName: bt.legalName || bt.businessName,
            restaurantType: bt.businessType === 1 ? 'Cafe' : 'FineDine',
            ownerName: bt.ownerEmail?.split('@')[0] || 'Owner',
            ownerEmail: bt.ownerEmail,
            ownerPhone: bt.ownerPhone || '9876543210',
            city: bt.city || 'Pune',
            state: bt.state || 'Maharashtra',
            gstin: bt.gstin || '',
            plan: bt.subscriptionPlan === 3 ? 'Enterprise' : bt.subscriptionPlan === 2 ? 'Professional' : 'Starter',
            status: bt.isActive ? 'Active' : 'Suspended',
            maxOutlets: bt.maxOutlets || 3,
            outlets: bt.outlets || [],
            joinedAt: new Date(bt.createdAt || Date.now()).toISOString().split('T')[0],
            subscriptionExpiresAt: new Date(bt.subscriptionExpiresAt || Date.now() + 365 * 86400000)
              .toISOString()
              .split('T')[0],
            features: bt.features || {
              enableKds: true,
              enableWaiterApp: true,
              enableAggregators: true,
              enableRecipeInventory: true,
              enableKhataBook: false,
            },
          }));

          setTenants((prev) => {
            const ids = new Set(backendTenants.map((b) => b.id));
            return [...backendTenants, ...prev.filter((p) => !ids.has(p.id))];
          });
        }
      })
      .catch((err) => {
        console.debug('Backend tenants load fallback to initial mock:', err);
      });
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newActive = currentStatus !== 'Active';
    try {
      await apiClient.patch(`/tenants/${tenantId}/status`, { isActive: newActive });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newActive ? 'Active' : 'Suspended' } : t))
      );
      setStatusMessage(`Tenant status changed to ${newActive ? 'Active' : 'Suspended'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      // Local optimistic update fallback
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newActive ? 'Active' : 'Suspended' } : t))
      );
      setStatusMessage(`Status updated locally to ${newActive ? 'Active' : 'Suspended'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'Active').length;
  const totalOutlets = tenants.reduce((acc, t) => acc + (t.outlets?.length || 1), 0);
  const trialTenants = tenants.filter((t) => t.status === 'Trial').length;

  // Plan counts
  const starterCount = tenants.filter((t) => t.plan === 'Starter').length;
  const proCount = tenants.filter((t) => t.plan === 'Professional').length;
  const entCount = tenants.filter((t) => t.plan === 'Enterprise').length;

  // Revenue estimation
  const calculatedArr = starterCount * 12000 + proCount * 24000 + entCount * 48000;
  const calculatedMrr = Math.round(calculatedArr / 12);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {statusMessage && (
        <div className="fixed top-20 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SaaS Operations Headquarters
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant monitoring across all onboarded restaurants, branches, and active subscriptions.
          </p>
        </div>

        <button
          onClick={() => navigate('/superadmin/tenants?action=new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tenants */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Restaurants</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalTenants}</p>
            <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {activeTenants} active across network
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Outlets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Outlets</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalOutlets}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Connected POS nodes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Platform MRR & ARR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual SaaS ARR</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{calculatedArr.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
              MRR: ~₹{calculatedMrr.toLocaleString('en-IN')}/mo
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Trials & Attention */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trials & Inactive</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalTenants - activeTenants}</p>
            <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
              {trialTenants} on trial evaluation
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Plan Breakdown & Recent Onboarding Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Tenants List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Onboarded Restaurants</h2>
              <p className="text-[11px] text-slate-400">Latest restaurants operating on QuantroBill SaaS</p>
            </div>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
            >
              <span>View All Tenants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Outlets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.slice(0, 5).map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{tenant.businessName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tenant.ownerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tenant.city}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{tenant.outlets?.length || 1}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tenant.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tenant.status === 'Trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                          tenant.status === 'Active'
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Subscription Plan Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Subscription Tier Distribution</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Starter QSR (₹12k/yr)</span>
                  <span className="text-slate-900 font-bold">{starterCount} restaurants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full"
                    style={{ width: `${totalTenants ? (starterCount / totalTenants) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Professional (₹24k/yr)</span>
                  <span className="text-slate-900 font-bold">{proCount} restaurants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${totalTenants ? (proCount / totalTenants) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Enterprise (₹48k/yr)</span>
                  <span className="text-slate-900 font-bold">{entCount} restaurants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${totalTenants ? (entCount / totalTenants) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/superadmin/subscriptions')}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer border border-blue-200"
            >
              Configure Subscription Plans & Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
