import React, { useState, useEffect } from 'react';
import {
  Tag,
  PlusCircle,
  Search,
  Copy,
  Check,
  Percent,
  IndianRupee,
  Trash2,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { couponsApi } from '../services/couponsApi';
import type { CouponItem } from '../types';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 1 as 1 | 2, // 1: Percentage, 2: FixedAmount
    value: 10,
    minPlanDurationMonths: 1,
    maxRedemptions: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  // Delete Confirm Dialog
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponsApi.getAllCoupons();
      if (res?.data) {
        setCoupons(res.data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 1,
      value: 15,
      minPlanDurationMonths: 1,
      maxRedemptions: 50,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: CouponItem) => {
    setEditingCoupon(item);
    setFormData({
      code: item.code,
      description: item.description,
      discountType: item.discountType,
      value: item.value,
      minPlanDurationMonths: item.minPlanDurationMonths || 1,
      maxRedemptions: item.maxRedemptions || 100,
      validFrom: item.validFrom ? new Date(item.validFrom).toISOString().split('T')[0] : '',
      validUntil: item.validUntil ? new Date(item.validUntil).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    try {
      if (editingCoupon) {
        await couponsApi.updateCoupon(editingCoupon.id, formData);
      } else {
        await couponsApi.createCoupon(formData);
      }
      setShowModal(false);
      await loadCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleToggleStatus = async (item: CouponItem) => {
    try {
      await couponsApi.toggleCouponStatus(item.id, !item.isActive);
      setCoupons((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await couponsApi.deleteCoupon(deleteTargetId);
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const filteredCoupons = coupons.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && item.isActive;
    if (statusFilter === 'inactive') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesRedeemed || 0), 0);

  return (
    <div className="space-y-6 w-full font-sans">
      <PageHeader
        title="Promotional Coupons & Discounts"
        subtitle="Create, monitor, and manage promotional coupon codes for SaaS subscription plans."
        icon={Tag}
        onRefresh={loadCoupons}
        isRefreshing={loading}
        actionLabel="Create New Coupon"
        actionIcon={PlusCircle}
        onAction={handleOpenCreate}
      />

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Coupons"
          value={coupons.length.toString()}
          icon={Tag}
          colorScheme="blue"
          subtext="Available promotions"
        />
        <StatCard
          label="Active Coupons"
          value={activeCount.toString()}
          icon={ShieldCheck}
          colorScheme="emerald"
          subtext="Ready for redemption"
        />
        <StatCard
          label="Total Times Redeemed"
          value={totalRedemptions.toString()}
          icon={Percent}
          colorScheme="purple"
          subtext="Total tenant activations"
        />
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({coupons.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'inactive'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inactive ({coupons.length - activeCount})
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No coupons found.</p>
                    <p className="text-[11px] mt-0.5">Click "Create New Coupon" to provision promotional offers.</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800">
                          {item.code}
                        </span>
                        <button
                          onClick={() => handleCopy(item.code)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition"
                          title="Copy Code"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.discountType === 1 ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <Percent className="w-3 h-3" />
                          <span>{item.value}% OFF</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <IndianRupee className="w-3 h-3" />
                          <span>₹{item.value} OFF</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {item.description || 'Promotional coupon'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-bold">{item.timesRedeemed || 0}</span> / {item.maxRedemptions || '∞'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingCoupon ? 'Edit Promotional Coupon' : 'Create New Coupon'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure code, discount percentage or amount, and redemption limits.
            </p>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE25, DIWALI50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full uppercase px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 25% discount on annual SaaS plans"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  >
                    <option value={1}>Percentage (%)</option>
                    <option value={2}>Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Value {formData.discountType === 1 ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxRedemptions}
                    onChange={(e) => setFormData({ ...formData, maxRedemptions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Promotional Coupon"
        message="Are you sure you want to delete this coupon? Existing tenants who applied it will not be affected."
        confirmText="Yes, Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
