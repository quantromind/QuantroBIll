import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Edit2,
  Archive,
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTableToolbar } from '../components/DataTableToolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { plansApi } from '../services/plansApi';
import type { PlanTier } from '../types';

export const PlansCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Archive Confirmation
  const [archivePlanTarget, setArchivePlanTarget] = useState<PlanTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await plansApi.getAllPlans();
      if (res.success && Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load plans catalog from backend.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleConfirmArchive = async () => {
    if (!archivePlanTarget) return;
    setIsProcessing(true);
    try {
      await plansApi.archivePlan(archivePlanTarget.id);
      setPlans((prev) =>
        prev.map((p) => (p.id === archivePlanTarget.id ? { ...p, isActive: false } : p))
      );
      setArchivePlanTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive plan tier.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? p.isActive
        : !p.isActive;

    return matchSearch && matchStatus;
  });

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.isActive).length;
  const popularPlan = plans.find((p) => p.isPopular)?.name || 'Professional';

  return (
    <div>
      <PageHeader
        title="Subscription Plans Catalog"
        subtitle="Define, price, and package global SaaS subscription tiers and feature entitlements."
        icon={Package}
        onRefresh={loadPlans}
        isRefreshing={loading}
      >
        <button
          onClick={() => navigate('/superadmin/plans-catalog/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Plan Tier</span>
        </button>
      </PageHeader>

      {/* STAT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Plan Tiers"
          value={totalPlans}
          icon={Layers}
          colorScheme="blue"
          subtext="Catalog tiers configured"
        />
        <StatCard
          label="Active Offerings"
          value={activePlans}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtext="Available for onboarding"
        />
        <StatCard
          label="Most Popular Tier"
          value={popularPlan}
          icon={Sparkles}
          colorScheme="amber"
          subtext="High-conversion package"
        />
        <StatCard
          label="Archived Tiers"
          value={totalPlans - activePlans}
          icon={Archive}
          colorScheme="slate"
          subtext="Deprecated from catalog"
        />
      </div>

      {/* TOOLBAR */}
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search plans by name, code, or feature..."
        totalCount={filteredPlans.length}
        filters={[
          {
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active Tiers' },
              { value: 'Archived', label: 'Archived' },
            ],
          },
        ]}
      />

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadPlans} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-200/70 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Plan Tiers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No plans matched your search filters. Try clearing filters or create a new tier.'
              : 'The plans catalog has no registered plans. Click below to add the first plan tier.'}
          </p>
          <button
            onClick={() => navigate('/superadmin/plans-catalog/new')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Plan Tier</span>
          </button>
        </div>
      ) : (
        /* PLAN TIERS GRID */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border transition flex flex-col justify-between shadow-xs hover:shadow-md relative overflow-hidden ${
                plan.isPopular ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              } ${!plan.isActive ? 'opacity-70 bg-slate-50/50' : ''}`}
            >
              {plan.isPopular && (
                <div className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-1">
                  ⭐ Recommended Tier
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">code: {plan.code}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      plan.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 min-h-[36px] line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-5 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    or ₹{plan.priceYearly.toLocaleString('en-IN')} billed annually (save ~17%)
                  </div>
                </div>

                {/* Limits & Specifications */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Max Outlets:</span>
                    <span className="font-bold text-slate-800">{plan.maxOutlets} Branches</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Max Staff Logins:</span>
                    <span className="font-bold text-slate-800">{plan.maxStaffUsers} Users</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Trial Period:</span>
                    <span className="font-bold text-slate-800">{plan.trialDays} Days</span>
                  </div>
                </div>

                {/* Feature Inclusions */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Included Capabilities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features?.enableKds && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                        Kitchen KDS
                      </span>
                    )}
                    {plan.features?.enableWaiterApp && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                        Captain App
                      </span>
                    )}
                    {plan.features?.enableAggregators && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-100">
                        Zomato/Swiggy
                      </span>
                    )}
                    {plan.features?.enableRecipeInventory && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                        Inventory Recipe
                      </span>
                    )}
                    {plan.features?.enableKhataBook && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100">
                        KhataBook Credit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`/superadmin/plans-catalog/${plan.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Configure Tier</span>
                </button>

                {plan.isActive && (
                  <button
                    onClick={() => setArchivePlanTarget(plan)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Archive Plan Tier"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={!!archivePlanTarget}
        title="Archive Subscription Plan?"
        message={`Are you sure you want to archive "${archivePlanTarget?.name}"? New tenants will no longer be able to select this tier, though existing subscribers will keep their current plan.`}
        confirmText="Archive Tier"
        variant="warning"
        isProcessing={isProcessing}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchivePlanTarget(null)}
      />
    </div>
  );
};
