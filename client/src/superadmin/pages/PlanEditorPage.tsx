import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { plansApi } from '../services/plansApi';
import type { PlanTier } from '../types';

export const PlanEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<PlanTier>>({
    name: '',
    code: '',
    description: '',
    priceMonthly: 1999,
    priceYearly: 19990,
    maxOutlets: 2,
    maxStaffUsers: 8,
    trialDays: 14,
    features: {
      enableKds: true,
      enableWaiterApp: true,
      enableAggregators: true,
      enableRecipeInventory: true,
      enableKhataBook: false,
    },
    isPopular: false,
    isActive: true,
    displayOrder: 1,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      plansApi
        .getPlanById(id)
        .then((res) => {
          if (res.success && res.data) {
            setFormData(res.data);
          } else {
            setError('Plan tier not found.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load plan details.');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditing, id]);

  const handleFeatureToggle = (featureKey: string) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features?.[featureKey],
      } as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Plan name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await plansApi.updatePlan(id, formData);
        setSuccessMessage('Plan tier updated successfully.');
      } else {
        await plansApi.createPlan(formData);
        setSuccessMessage('New plan tier created in catalog.');
      }
      setTimeout(() => {
        navigate('/superadmin/plans-catalog');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving plan configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading plan configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/superadmin/plans-catalog')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans Catalog</span>
        </button>
      </div>

      <PageHeader
        title={isEditing ? `Configure Plan: ${formData.name}` : 'Create New Plan Tier'}
        subtitle="Configure pricing, branch allowances, user quotas, and module feature entitlements."
        icon={Package}
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
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            1. Tier Identification
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Plan Tier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Starter, Growth, Enterprise"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unique Code Key
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. starter, professional (auto-generated if empty)"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marketing Description
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of who this plan is suitable for and key selling points..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Billing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            2. Pricing Model (INR ₹)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.priceMonthly ?? 0}
                onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual Price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.priceYearly ?? 0}
                onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Limits & Quotas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            3. Branch & User Limits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Branches / Outlets
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxOutlets ?? 1}
                onChange={(e) => setFormData({ ...formData, maxOutlets: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Staff User Logins
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxStaffUsers ?? 5}
                onChange={(e) => setFormData({ ...formData, maxStaffUsers: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Trial Duration (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.trialDays ?? 14}
                onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Module Entitlements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            4. Feature Entitlements Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'enableKds', label: 'Kitchen Display System (KDS)', desc: 'Live cook screen with realtime order state sync' },
              { id: 'enableWaiterApp', label: 'Waiter / Captain Mobile App', desc: 'Handheld table-side ordering and KOT creation' },
              { id: 'enableAggregators', label: 'Online Aggregators Integration', desc: 'Direct Swiggy, Zomato, Magicpin order auto-accept' },
              { id: 'enableRecipeInventory', label: 'Recipe & Ingredient Inventory', desc: 'Realtime stock deduction per dish prepared' },
              { id: 'enableKhataBook', label: 'KhataBook / Customer Credit', desc: 'Post-pay ledger and periodic settlements' },
            ].map((feat) => {
              const checked = Boolean(formData.features?.[feat.id]);
              return (
                <label
                  key={feat.id}
                  onClick={() => handleFeatureToggle(feat.id)}
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
                    <span className="text-xs font-bold block">{feat.label}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{feat.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 5: Display & Catalog Visibility */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            5. Catalog Visibility
          </h2>
          <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular ?? false}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Mark as Popular / Recommended</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Active in public catalog</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/plans-catalog')}
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
            <span>{saving ? 'Saving...' : isEditing ? 'Save Plan Changes' : 'Create Plan Tier'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
