import React from 'react';
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

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Metrics
  const totalTenants = initialTenants.length;
  const activeTenants = initialTenants.filter((t) => t.status === 'Active').length;
  const totalOutlets = initialTenants.reduce((acc, t) => acc + t.outlets.length, 0);
  const trialTenants = initialTenants.filter((t) => t.status === 'Trial').length;

  // Plan counts
  const starterCount = initialTenants.filter((t) => t.plan === 'Starter').length;
  const proCount = initialTenants.filter((t) => t.plan === 'Professional').length;
  const entCount = initialTenants.filter((t) => t.plan === 'Enterprise').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            SaaS Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-tenant monitoring across all onboarded restaurants and outlets.
          </p>
        </div>

        <button
          onClick={() => navigate('/superadmin/tenants?action=new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tenants */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Restaurants</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalTenants}</p>
            <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {activeTenants} active across network
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Outlets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Branch Outlets</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalOutlets}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Connected POS nodes</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Platform MRR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual SaaS ARR</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹1,84,000</p>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">Active subscription billing</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Trials & Attention */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Trials</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{trialTenants}</p>
            <span className="text-[10px] text-amber-600 font-semibold mt-1 block">14-day evaluation period</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Plan Breakdown & Recent Onboarding Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Tenants List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Onboarded Restaurants</h2>
              <p className="text-[11px] text-slate-400">Latest tenants registered on the platform</p>
            </div>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
            >
              <span>View All</span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {initialTenants.slice(0, 5).map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{tenant.businessName}</p>
                      <p className="text-[10px] text-slate-400">{tenant.ownerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tenant.city}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{tenant.outlets.length}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Subscription Plan Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Subscription Tier Distribution</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Starter QSR (₹12k/yr)</span>
                  <span className="text-slate-900">{starterCount} tenants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full rounded-full"
                    style={{ width: `${(starterCount / totalTenants) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Professional (₹24k/yr)</span>
                  <span className="text-slate-900">{proCount} tenants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${(proCount / totalTenants) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Enterprise (₹48k/yr)</span>
                  <span className="text-slate-900">{entCount} tenants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${(entCount / totalTenants) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/superadmin/subscriptions')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
            >
              Manage Subscription Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
