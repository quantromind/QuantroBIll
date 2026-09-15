import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { tenantsApi } from '../services/tenantsApi';

export const TenantCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    legalName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    initialPassword: 'Password@123',
    businessType: 1, // Cafe
    subscriptionPlan: 2, // Standard/Professional
    subscriptionMonths: 12,
    maxOutlets: 3,
    initialOutletName: '',
    address: 'Main Market Road',
    city: 'Pune',
    state: 'Maharashtra',
    gstin: '',
    features: {
      enableKds: true,
      enableWaiterApp: true,
      enableAggregators: true,
      enableRecipeInventory: true,
      enableKhataBook: false,
    },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    if (!formData.ownerEmail.trim()) {
      setError('Owner email address is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await tenantsApi.createTenant({
        ...formData,
        legalName: formData.legalName || formData.businessName,
        initialOutletName: formData.initialOutletName || `${formData.businessName} (Main Branch)`,
      });

      if (res.success) {
        setSuccess(`Restaurant '${formData.businessName}' successfully registered and onboarded!`);
        setTimeout(() => {
          navigate(`/superadmin/tenants/${res.data?.id || ''}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error registering new restaurant tenant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tenants</span>
        </button>
      </div>

      <PageHeader
        title="Onboard New Restaurant Tenant"
        subtitle="Register a new restaurant business, provision initial outlet branch, owner credentials, and SaaS entitlements."
        icon={Building2}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            1. Restaurant Business Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Spice Symphony Fine Dine"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="e.g. Symphony Hospitality LLP"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Type / Format
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value={1}>Cafe / Bakery</option>
                <option value={2}>Fine Dine Restaurant</option>
                <option value={3}>QSR / Fast Food Counter</option>
                <option value={4}>Cloud Kitchen</option>
                <option value={5}>Bar & Pub</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Owner Credentials & Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            2. Owner Credentials & Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Anand Mahindra"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Email (Login Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="e.g. owner@restaurant.com"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Phone Number
              </label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Owner Password
              </label>
              <input
                type="text"
                value={formData.initialPassword}
                onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Initial Branch Location */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            3. Initial Outlet Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={formData.initialOutletName}
                onChange={(e) => setFormData({ ...formData, initialOutletName: e.target.value })}
                placeholder="Main Branch"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Subscription Plan Allocation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            4. SaaS Subscription Tier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Plan
              </label>
              <select
                value={formData.subscriptionPlan}
                onChange={(e) => setFormData({ ...formData, subscriptionPlan: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value={1}>Starter (Basic)</option>
                <option value={2}>Professional (Standard)</option>
                <option value={3}>Enterprise (Premium)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Allowed Outlets
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxOutlets}
                onChange={(e) => setFormData({ ...formData, maxOutlets: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subscription Months
              </label>
              <input
                type="number"
                min="1"
                value={formData.subscriptionMonths}
                onChange={(e) => setFormData({ ...formData, subscriptionMonths: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/tenants')}
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
            <span>{saving ? 'Creating Restaurant...' : 'Complete Onboarding'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
