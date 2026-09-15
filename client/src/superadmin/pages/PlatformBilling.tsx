import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  Check,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTableToolbar } from '../components/DataTableToolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { billingApi } from '../services/billingApi';
import type { PlatformInvoice, BillingStats } from '../types';

export const PlatformBilling: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Mark Paid action confirmation
  const [markPaidTarget, setMarkPaidTarget] = useState<PlatformInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, statRes] = await Promise.all([
        billingApi.getInvoices({
          search: searchQuery || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          page,
          pageSize,
        }),
        billingApi.getBillingStats(),
      ]);

      if (invRes.success && Array.isArray(invRes.data)) {
        setInvoices(invRes.data);
        setTotalCount(invRes.pagination?.totalItems || invRes.data.length);
      } else {
        setInvoices([]);
      }

      if (statRes.success && statRes.data) {
        setStats(statRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch billing invoices.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, page, pageSize]);

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    setIsProcessing(true);
    try {
      await billingApi.updateInvoiceStatus(markPaidTarget.id, {
        status: 'Paid',
        paymentMethod: 'UPI',
        transactionRef: `MANUAL-${Date.now()}`,
      });
      setInvoices((prev) =>
        prev.map((i) => (i.id === markPaidTarget.id ? { ...i, status: 'Paid', paidAt: new Date().toISOString() } : i))
      );
      setMarkPaidTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update invoice status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Due':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div>
      <PageHeader
        title="Platform Billing & Revenue"
        subtitle="Manage tenant subscription invoices, track recurring SaaS revenue (MRR/ARR), and monitor dues."
        icon={Receipt}
        onRefresh={loadData}
        isRefreshing={loading}
      />

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Collected Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          colorScheme="emerald"
          subtext="Lifetime subscription collections"
        />
        <StatCard
          label="Monthly Recurring (MRR)"
          value={`₹${(stats?.mrr || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          colorScheme="blue"
          subtext="Normalized monthly run-rate"
        />
        <StatCard
          label="Annual Run Rate (ARR)"
          value={`₹${(stats?.arr || 0).toLocaleString('en-IN')}`}
          icon={ArrowUpRight}
          colorScheme="purple"
          subtext="Annualized subscription value"
        />
        <StatCard
          label="Overdue Invoices"
          value={stats?.overdueCount ?? 0}
          icon={AlertCircle}
          colorScheme="rose"
          subtext={`${stats?.dueCount ?? 0} pending renewals due soon`}
        />
      </div>

      {/* TOOLBAR */}
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search by invoice #, restaurant name, or plan..."
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
        filters={[
          {
            id: 'status',
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { value: 'All', label: 'All Invoices' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Due', label: 'Due' },
              { value: 'Overdue', label: 'Overdue' },
            ],
          },
        ]}
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading platform invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1">No invoices match your selected search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Restaurant Tenant</th>
                  <th className="py-3.5 px-4">Plan & Cycle</th>
                  <th className="py-3.5 px-4">Due / Paid Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.tenantName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">id: {inv.tenantId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{inv.planName}</span>
                      <span className="text-[10px] text-slate-400 block">{inv.billingCycle}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      <div>
                        {inv.status === 'Paid' && inv.paidAt
                          ? `Paid: ${new Date(inv.paidAt).toLocaleDateString('en-IN')}`
                          : `Due: ${new Date(inv.dueDate).toLocaleDateString('en-IN')}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.paymentMethod} {inv.transactionRef ? `• ${inv.transactionRef}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/superadmin/billing/${inv.id}`)}
                          className="w-7 h-7 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition cursor-pointer"
                          title="View Invoice Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => setMarkPaidTarget(inv)}
                            className="w-7 h-7 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition cursor-pointer"
                            title="Mark as Paid"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!markPaidTarget}
        title="Mark Invoice as Paid?"
        message={`Are you sure you want to record manual payment of ₹${markPaidTarget?.totalAmount.toLocaleString(
          'en-IN'
        )} for ${markPaidTarget?.tenantName}? This will mark invoice ${markPaidTarget?.invoiceNumber} as Paid.`}
        confirmText="Confirm Payment"
        variant="primary"
        isProcessing={isProcessing}
        onConfirm={handleConfirmMarkPaid}
        onCancel={() => setMarkPaidTarget(null)}
      />
    </div>
  );
};
