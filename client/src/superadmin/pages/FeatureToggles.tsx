import React, { useState } from 'react';
import { Building2, Save, CheckCircle2, Monitor, Smartphone, Truck, Package, BookOpen } from 'lucide-react';
import { initialTenants } from '../services/mockTenantData';
import type { Tenant } from '../types';

export const FeatureToggles: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const handleToggle = (key: keyof Tenant['features']) => {
    if (!selectedTenant) return;
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === selectedTenant.id) {
          return {
            ...t,
            features: {
              ...t.features,
              [key]: !t.features[key],
            },
          };
        }
        return t;
      })
    );
    setSavedSuccess(false);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const featureList = [
    {
      key: 'enableKds' as const,
      title: 'Kitchen Display System (KDS)',
      description: 'Enables paperless kitchen order cards on Android tablets and touch monitors with prep timers.',
      icon: Monitor,
    },
    {
      key: 'enableWaiterApp' as const,
      title: 'Handheld Waiter Mobile App',
      description: 'Allows waiters to take orders at tables using Android/iOS smartphones with live SignalR sync.',
      icon: Smartphone,
    },
    {
      key: 'enableAggregators' as const,
      title: 'Online Aggregators (Zomato / Swiggy)',
      description: 'Activates online delivery tab, auto-accept toggles, packaging charges, and delivery queues.',
      icon: Truck,
    },
    {
      key: 'enableRecipeInventory' as const,
      title: 'Recipe & Raw Ingredients BOM Costing',
      description: 'Enables ingredients catalog, par stock alerts, and auto-depletion of raw materials upon KOT.',
      icon: Package,
    },
    {
      key: 'enableKhataBook' as const,
      title: 'Customer Credit Ledger (Khata Book)',
      description: 'Allows recording due bills and credit balances for trusted regular and corporate guests.',
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tenant Feature Flags & Toggles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selectively enable or disable platform capabilities for specific restaurants.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Restaurant Selector Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Restaurant Tenant to Configure:
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setSavedSuccess(false);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.businessName} — {t.city} ({t.plan} Plan • {t.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Feature Toggles List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Feature Module</span>
          <span>Permission Status</span>
        </div>

        {featureList.map((feat) => {
          const Icon = feat.icon;
          const isEnabled = selectedTenant?.features[feat.key];

          return (
            <div
              key={feat.key}
              className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{feat.description}</p>
                </div>
              </div>

              {/* Clean Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle(feat.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
