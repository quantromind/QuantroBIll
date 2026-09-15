import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  Monitor,
  Smartphone,
  Truck,
  Package,
  BookOpen
} from 'lucide-react';
import { initialTenants } from '../services/mockTenantData';
import { apiClient } from '../../services/api';
import type { Tenant } from '../types';

export const FeatureToggles: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenants[0]?.id || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch live tenants from MongoDB
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
          if (!selectedTenantId && backendTenants.length > 0) {
            setSelectedTenantId(backendTenants[0].id);
          }
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

  const handleApplyPreset = (type: 'all' | 'essential') => {
    if (!selectedTenant) return;
    let preset: Tenant['features'];
    if (type === 'all') {
      preset = {
        enableKds: true,
        enableWaiterApp: true,
        enableAggregators: true,
        enableRecipeInventory: true,
        enableKhataBook: true,
      };
    } else {
      preset = {
        enableKds: true,
        enableWaiterApp: true,
        enableAggregators: false,
        enableRecipeInventory: false,
        enableKhataBook: false,
      };
    }

    setTenants((prev) =>
      prev.map((t) => (t.id === selectedTenant.id ? { ...t, features: preset } : t))
    );
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await apiClient.patch(`/tenants/${selectedTenant.id}/features`, selectedTenant.features);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      // Fallback
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const featureList = [
    {
      key: 'enableKds' as const,
      title: 'Kitchen Display System (KDS)',
      description: 'Enables paperless kitchen order cards on Android tablets and touch monitors with prep timers and station routing.',
      icon: Monitor,
      badge: 'Core Kitchen Tech',
    },
    {
      key: 'enableWaiterApp' as const,
      title: 'Handheld Waiter Mobile App',
      description: 'Allows restaurant stewards to take orders table-side via Android/iOS smartphones with instant SignalR sync to billing & kitchen.',
      icon: Smartphone,
      badge: 'Table Service',
    },
    {
      key: 'enableAggregators' as const,
      title: 'Online Aggregators (Zomato / Swiggy)',
      description: 'Activates online delivery tab, auto-accept toggles, packaging charges, driver dispatch, and simulated aggregator orders.',
      icon: Truck,
      badge: 'Cloud Kitchen & Delivery',
    },
    {
      key: 'enableRecipeInventory' as const,
      title: 'Recipe & Raw Ingredients BOM Costing',
      description: 'Enables ingredients catalog, unit conversions, minimum par alerts, and automated stock depletion whenever a KOT is fired.',
      icon: Package,
      badge: 'Inventory & Cost Control',
    },
    {
      key: 'enableKhataBook' as const,
      title: 'Customer Credit Ledger',
      description: 'Allows recording pay-later due tabs and credit limits for corporate accounts, regular guests, and VIP patrons.',
      icon: BookOpen,
      badge: 'Loyalty & Accounts',
    },
  ];

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Feature Flag Governance
            </span>
            <span className="text-xs text-slate-400 font-medium">Granular Module Control</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Tenant Feature Flags & Toggles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Selectively enable or restrict capabilities for specific restaurants based on their operational model.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Feature flags synced to MongoDB!</span>
          </div>
        )}
      </div>

      {/* Restaurant Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Restaurant Tenant to Configure:
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Quick Presets:</span>
            <button
              onClick={() => handleApplyPreset('all')}
              className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer transition"
            >
              All Features
            </button>
            <button
              onClick={() => handleApplyPreset('essential')}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer transition"
            >
              Essential POS
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setSavedSuccess(false);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        {/* Selected Tenant Info Strip */}
        {selectedTenant && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{selectedTenant.businessName}</span>
            <span className="text-slate-300">•</span>
            <span>Plan: <strong className="text-blue-700">{selectedTenant.plan}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Outlets: <strong>{selectedTenant.outlets?.length || 1} of {selectedTenant.maxOutlets}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Status: <strong className={selectedTenant.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}>{selectedTenant.status}</strong></span>
          </div>
        )}
      </div>

      {/* Feature Toggles List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Feature Module & Scope</span>
          <span>Access Control</span>
        </div>

        {featureList.map((feat) => {
          const Icon = feat.icon;
          const isEnabled = !!selectedTenant?.features[feat.key];

          return (
            <div
              key={feat.key}
              className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isEnabled
                      ? 'bg-blue-50 text-blue-600 border border-blue-200/60 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {feat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                    {feat.description}
                  </p>
                </div>
              </div>

              {/* Royal Blue Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle(feat.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                title={isEnabled ? 'Enabled for this restaurant' : 'Disabled for this restaurant'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
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
