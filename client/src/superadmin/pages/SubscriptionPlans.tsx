import React, { useState, useEffect } from 'react';
import {
  Check,
  Shield,
  Zap,
  Sparkles,
  TrendingUp,
  Building2,
  Store,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { initialTenants } from '../services/mockTenantData';
import { apiClient } from '../../services/api';
import type { Tenant, SubscriptionTier } from '../types';

export const SubscriptionPlans: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [targetPlan, setTargetPlan] = useState<SubscriptionTier>('Professional');
  const [extendMonths, setExtendMonths] = useState(12);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch live tenants from MongoDB backend
  const fetchTenants = () => {
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
            outlets: (bt.outlets || []).map((o: any) => ({
              id: o.id,
              name: o.name,
              code: o.code,
              city: o.city || bt.city || 'Pune',
              isActive: o.isActive !== false,
              tableCount: 15,
            })),
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

          setTenants(backendTenants);
        } else {
          setTenants([]);
        }
      })
      .catch((err) => {
        console.debug('Backend tenants load error:', err);
        setTenants([]);
      });
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const starterTenants = tenants.filter((t) => t.plan === 'Starter');
  const proTenants = tenants.filter((t) => t.plan === 'Professional');
  const enterpriseTenants = tenants.filter((t) => t.plan === 'Enterprise');

  // SaaS ARR Calculation (Starter: ₹12k, Pro: ₹24k, Enterprise: ₹48k)
  const totalARR =
    starterTenants.length * 12000 +
    proTenants.length * 24000 +
    enterpriseTenants.length * 48000;

  const totalOutlets = tenants.reduce((acc, t) => acc + (t.outlets?.length || 1), 0);

  const handleOpenUpgrade = (tier: SubscriptionTier) => {
    setTargetPlan(tier);
    if (!selectedTenantId && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
    }
    setActionSuccess(null);
    setActionError(null);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedTenantId) return;
    setActionError(null);

    const planCode = targetPlan === 'Enterprise' ? 3 : targetPlan === 'Professional' ? 2 : 1;
    const maxOutlets = targetPlan === 'Enterprise' ? 99 : targetPlan === 'Professional' ? 3 : 1;

    try {
      await apiClient.patch(`/tenants/${selectedTenantId}/plan`, {
        subscriptionPlan: planCode,
        maxOutlets: maxOutlets,
        extendMonths: extendMonths,
      });

      // Update local state
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenantId
            ? {
                ...t,
                plan: targetPlan,
                maxOutlets: maxOutlets,
              }
            : t
        )
      );

      setActionSuccess(`Plan upgraded successfully to ${targetPlan}!`);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setActionSuccess(null);
      }, 1500);
    } catch {
      // Fallback local update if mock tenant or server unreachable
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenantId
            ? {
                ...t,
                plan: targetPlan,
                maxOutlets: maxOutlets,
              }
            : t
        )
      );
      setActionSuccess(`Plan upgraded to ${targetPlan} (Updated locally)!`);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setActionSuccess(null);
      }, 1500);
    }
  };

  const plans = [
    {
      id: 'starter' as const,
      tier: 'Starter' as SubscriptionTier,
      name: 'Starter QSR',
      price: '₹12,000',
      period: 'per year',
      description: 'Ideal for fast-food counters, cloud kitchens, and cafes with single billing desks.',
      icon: Zap,
      activeTenants: starterTenants,
      badge: 'Quick Service',
      badgeColor: 'bg-slate-100 text-slate-700',
      features: [
        '1 Outlet Branch license',
        'High-Speed Touch Billing POS',
        'Zomato & Swiggy Mock Online Aggregator',
        'Thermal Receipt & KOT Printing (USB/LAN)',
        'Basic Cash Flow & Register Day Closing',
        'Standard Sales Reports',
      ],
      disabledFeatures: [
        'Paperless Kitchen Display System (KDS)',
        'Handheld Waiter Mobile App',
        'Recipe Costing & Ingredients BOM',
        'Multi-Outlet Central Inventory',
      ],
    },
    {
      id: 'professional' as const,
      tier: 'Professional' as SubscriptionTier,
      name: 'Professional Dine-In',
      price: '₹24,000',
      period: 'per year',
      description: 'The standard choice for full-service dine-in restaurants, bars, and multi-station kitchens.',
      icon: Sparkles,
      activeTenants: proTenants,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-600 text-white shadow-xs',
      popular: true,
      features: [
        'Up to 3 Outlet Branches',
        'High-Speed Touch Billing POS',
        'Visual Table Floor Plan & Section Grid',
        'Table Shifting & Merge Party Billing',
        'Handheld Waiter Mobile App (React Native)',
        'Kitchen Display System (KDS Screen)',
        'Raw Ingredients Catalog & Par Stock Alerts',
        'Recipe Bill of Materials (BOM) Auto-Deduction',
      ],
      disabledFeatures: ['Multi-Warehouse Central Kitchen Transfer', 'Custom API Integrations'],
    },
    {
      id: 'enterprise' as const,
      tier: 'Enterprise' as SubscriptionTier,
      name: 'Enterprise Multi-Branch',
      price: '₹48,000',
      period: 'per year',
      description: 'For restaurant chains, hotel dining, and multi-location franchises needing central control.',
      icon: Shield,
      activeTenants: enterpriseTenants,
      badge: 'Full Suite',
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
      features: [
        'Unlimited Outlet Branches',
        'Everything in Professional Plan',
        'Multi-Station Kitchen Routing (Tandoor, Bar, Chinese)',
        'Central Store to Kitchen Stock Transfers',
        'Credit Customers Ledger',
        'Manager Remote Void PIN Authorization',
        'Role-Based Staff Access (15 Permissions Matrix)',
        '24/7 Dedicated Account Manager SLA',
      ],
      disabledFeatures: [],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header & ARR Highlights */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                SaaS Licensing & Tiers
              </span>
              <span className="text-xs text-slate-400 font-medium">Auto-renewals Active</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              Subscription Plans & Revenue Distribution
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage tier packaging, view active restaurant distribution, and upgrade tenant licenses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenUpgrade('Professional')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Assign / Upgrade Tenant Tier</span>
            </button>
          </div>
        </div>

        {/* Quick SaaS Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contracted Annual ARR</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">₹{totalARR.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subscribed Outlets</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalOutlets} Outlets Provisioned</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Platform Tenants</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{tenants.length} Restaurants</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative transition hover:shadow-md ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3.5 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      plan.popular
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {plan.activeTenants.length} Active {plan.activeTenants.length === 1 ? 'Tenant' : 'Tenants'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  {!plan.popular && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1.5 min-h-[36px] leading-relaxed">
                  {plan.description}
                </p>

                <div className="mt-4 mb-6 pb-4 border-b border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">/ {plan.period}</span>
                </div>

                {/* Subscribed Tenants Pill List */}
                <div className="mb-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Enrolled Brands ({plan.activeTenants.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {plan.activeTenants.length > 0 ? (
                      plan.activeTenants.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md border border-slate-200"
                        >
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {t.businessName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No restaurants enrolled in this tier yet.</span>
                    )}
                  </div>
                </div>

                {/* Feature checklist */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Features Included:</p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}

                  {plan.disabledFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-400 opacity-60">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-300 font-mono text-xs">
                        ✕
                      </div>
                      <span className="line-through leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenUpgrade(plan.tier)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <span>Assign Restaurants to {plan.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Upgrade / Tier Assignment Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assign / Upgrade Tenant Tier</h3>
                  <p className="text-xs text-slate-500">Change subscription license and outlet limits</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Restaurant Tenant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.businessName} ({t.city}) — Currently on {t.plan} Plan
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Subscription Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Starter', 'Professional', 'Enterprise'] as SubscriptionTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTargetPlan(tier)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        targetPlan === tier
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-1 ring-blue-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>{tier}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                        {tier === 'Enterprise' ? 'Unlimited' : tier === 'Professional' ? 'Max 3' : 'Max 1'} Outlet
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Extension Duration
                </label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value={6}>6 Months Extension</option>
                  <option value={12}>12 Months (1 Year Standard)</option>
                  <option value={24}>24 Months (2 Year Contract)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-white rounded-xl text-xs font-semibold text-slate-600 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Save & Apply Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
