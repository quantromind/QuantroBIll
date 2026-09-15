import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Mail,
  Shield,
  CreditCard,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { settingsApi } from '../services/settingsApi';
import type { PlatformSettingsData } from '../types';

export const SettingsPage: React.FC = () => {
  const [formData, setFormData] = useState<PlatformSettingsData>({
    platformName: 'QuantroBill Restaurant SaaS',
    supportEmail: 'admin@quantromind.com',
    supportPhone: '+91 99999 99999',
    defaultCurrency: 'INR',
    defaultTaxRate: 5.0,
    defaultTrialDays: 14,
    smtpHost: 'smtp.quantromind.com',
    smtpPort: 587,
    smtpUser: 'support@quantromind.com',
    smtpFromEmail: 'noreply@quantromind.com',
    razorpayKeyId: 'rzp_live_quantrobill2026',
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSettings();
      if (res?.data) {
        setFormData({
          ...res.data,
          platformName: res.data.platformName || 'QuantroBill Restaurant SaaS',
          supportEmail: res.data.supportEmail || 'admin@quantromind.com',
          supportPhone: res.data.supportPhone || '+91 99999 99999',
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    try {
      await settingsApi.updateSettings(formData);
      setSuccessMessage('Platform settings updated and saved to MongoDB successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <PageHeader
        title="Platform Global Settings"
        subtitle="Configure platform brand parameters, support contact information, payment gateways, and system maintenance."
        icon={Settings}
        onRefresh={loadSettings}
        isRefreshing={loading}
      />

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 p-4 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. BRAND & SUPPORT INFORMATION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Platform Identification & Support</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Brand Name</label>
              <input
                type="text"
                required
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Support Email</label>
              <input
                type="email"
                required
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Phone Helpline</label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 2. DEFAULT FINANCIAL & SAAS TRIAL POLICIES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Defaults for Onboarded Outlets</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Platform Currency</label>
              <input
                type="text"
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value.toUpperCase() })}
                className="w-full uppercase px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Combined Tax Rate (GST %)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Free Trial Duration (Days)</label>
              <input
                type="number"
                min={0}
                value={formData.defaultTrialDays}
                onChange={(e) => setFormData({ ...formData, defaultTrialDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 3. SMTP & GATEWAY KEYS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Automated Email Gateway (SMTP)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">System From Address</label>
              <input
                type="email"
                value={formData.smtpFromEmail}
                onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 4. PAYMENT GATEWAY & MAINTENANCE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Payment Gateway & Maintenance Mode</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={formData.razorpayKeyId}
                onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <label htmlFor="maintenanceMode" className="cursor-pointer">
                <span className="text-xs font-bold text-slate-900 block">Emergency Maintenance Mode</span>
                <span className="text-[10px] text-slate-500 block">
                  Blocks non-SuperAdmin access for platform system upgrades
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Database...' : 'Save Platform Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
