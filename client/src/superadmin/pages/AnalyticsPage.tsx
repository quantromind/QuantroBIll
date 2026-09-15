import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  CreditCard,
  MapPin,
  UtensilsCrossed,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { analyticsApi } from '../services/analyticsApi';
import type { PlatformAnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOverview();
      if (res?.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = analytics?.summary?.totalCollectedRevenue || 0;
  const activeTenants = analytics?.summary?.activeTenants || 0;
  const mrr = analytics?.summary?.mrr || 0;
  const arr = analytics?.summary?.arr || 0;

  return (
    <div className="space-y-6 w-full font-sans">
      <PageHeader
        title="Platform Analytics & Revenue Insights"
        subtitle="Monitor SaaS tenant growth, MRR/ARR velocity, geographic density, and subscription distributions."
        icon={BarChart3}
        onRefresh={loadData}
        isRefreshing={loading}
      />

      {/* TOP KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Active Tenants"
          value={activeTenants.toString()}
          icon={Building2}
          colorScheme="blue"
          subtext={`Out of ${analytics?.summary?.totalTenants || 0} registered restaurants`}
        />
        <StatCard
          label="Monthly Recurring Revenue (MRR)"
          value={`₹${mrr.toLocaleString('en-IN')}`}
          icon={DollarSign}
          colorScheme="emerald"
          subtext="Estimated active run-rate"
        />
        <StatCard
          label="Annual Recurring Revenue (ARR)"
          value={`₹${arr.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          colorScheme="purple"
          subtext="Projected 12-month ARR"
        />
        <StatCard
          label="Lifetime Collected Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={CreditCard}
          colorScheme="amber"
          subtext="Total verified platform invoices"
        />
      </div>

      {/* DISTRIBUTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Subscription Plans Share</h3>
            <span className="text-[10px] font-semibold text-slate-400">By Tenant Count</span>
          </div>

          <div className="space-y-3">
            {(!analytics?.planDistribution || analytics.planDistribution.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No subscription data yet.</p>
            ) : (
              analytics.planDistribution.map((item) => (
                <div key={item.plan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.plan}</span>
                    <span className="font-bold text-slate-900">{item.count} ({item.share || 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.share || (item.count * 20), 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* City / Geographic Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Geographic Density</h3>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {(!analytics?.cityDistribution || analytics.cityDistribution.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No regional data yet.</p>
            ) : (
              analytics.cityDistribution.map((item) => (
                <div key={item.city} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
                  <span className="font-semibold text-slate-700">{item.city || 'Unknown'}</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                    {item.count} Outlets
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Business Type Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Restaurant Categories</h3>
            <UtensilsCrossed className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {(!analytics?.businessTypeDistribution || analytics.businessTypeDistribution.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No categories recorded yet.</p>
            ) : (
              analytics.businessTypeDistribution.map((item) => (
                <div key={item.type} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
                  <span className="font-semibold text-slate-700">{item.type}</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HEALTH & PERFORMANCE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Multi-Tenant Database Engine</span>
          </div>
          <h3 className="text-lg font-extrabold">MongoDB Atlas High Availability Cluster</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Tenants are scoped by logical tenant isolation with real-time indexing on orders, inventory, and tables.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block font-medium">Uptime Target</span>
            <span className="text-base font-bold text-white">99.9%</span>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block font-medium">DB Collections</span>
            <span className="text-base font-bold text-emerald-400">14 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
