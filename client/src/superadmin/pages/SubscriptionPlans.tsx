import { Check, Shield, Zap, Sparkles } from 'lucide-react';
import { initialTenants } from '../services/mockTenantData';

export const SubscriptionPlans: React.FC = () => {
  const starterTenants = initialTenants.filter((t) => t.plan === 'Starter').length;
  const proTenants = initialTenants.filter((t) => t.plan === 'Professional').length;
  const enterpriseTenants = initialTenants.filter((t) => t.plan === 'Enterprise').length;

  const plans = [
    {
      id: 'starter',
      name: 'Starter QSR',
      price: '₹12,000',
      period: 'per year',
      description: 'Ideal for fast-food counters, cloud kitchens, and cafes with single billing desks.',
      icon: Zap,
      activeCount: starterTenants,
      badge: 'Quick Service',
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
      id: 'professional',
      name: 'Professional Dine-In',
      price: '₹24,000',
      period: 'per year',
      description: 'The standard choice for full-service dine-in restaurants, bars, and multi-station kitchens.',
      icon: Sparkles,
      activeCount: proTenants,
      badge: 'Most Popular',
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
      id: 'enterprise',
      name: 'Enterprise Multi-Branch',
      price: '₹48,000',
      period: 'per year',
      description: 'For restaurant chains, hotel dining, and multi-location franchises needing central control.',
      icon: Shield,
      activeCount: enterpriseTenants,
      badge: 'Full Suite',
      features: [
        'Unlimited Outlet Branches',
        'Everything in Professional Plan',
        'Multi-Station Kitchen Routing (Tandoor, Bar, Chinese)',
        'Central Store to Kitchen Stock Transfers',
        'Credit Customers Ledger (Khata Book)',
        'Manager Remote Void PIN Authorization',
        'Role-Based Staff Access (15 Permissions Matrix)',
        '24/7 Dedicated Account Manager SLA',
      ],
      disabledFeatures: [],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">SaaS Subscription Licensing Tiers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Define tier pricing, feature bundles, and view active restaurant subscriber distribution.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative transition hover:shadow-md ${
                plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {plan.activeCount} Active Restaurants
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{plan.description}</p>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">/ {plan.period}</span>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Features Included:</p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}

                  {plan.disabledFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-400 opacity-60">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-300 font-mono text-xs">
                        ✕
                      </div>
                      <span className="line-through">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  Configure Tier Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
