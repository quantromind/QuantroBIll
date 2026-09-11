import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  X,
  Check,
  Receipt,
} from 'lucide-react';
import type { OwnerExpense } from '../types';

export const OwnerExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<OwnerExpense[]>([
    {
      id: 'exp-1',
      voucherNo: 'VOU-0192',
      title: 'Dairy & Paneer Morning Delivery',
      category: 'Raw Materials',
      amount: 4200,
      paidTo: 'Krishna Dairy Supplier',
      paymentMode: 'UPI',
      date: 'Today, 08:30 AM',
      notes: '15kg fresh malai paneer',
    },
    {
      id: 'exp-2',
      voucherNo: 'VOU-0191',
      title: 'Commercial LPG Cylinder (2x 19kg)',
      category: 'Kitchen Gas / Fuel',
      amount: 3600,
      paidTo: 'Bharat Gas Agency',
      paymentMode: 'Cash',
      date: 'Today, 10:15 AM',
      notes: 'Kitchen cylinders refill',
    },
    {
      id: 'exp-3',
      voucherNo: 'VOU-0190',
      title: 'Staff Salary Advance',
      category: 'Staff Advance',
      amount: 2000,
      paidTo: 'Raju (Waiter)',
      paymentMode: 'Cash',
      date: 'Today, 11:00 AM',
      notes: 'Deducted from Sept salary',
    },
    {
      id: 'exp-4',
      voucherNo: 'VOU-0189',
      title: 'Dishwasher plumbing pipe replacement',
      category: 'Maintenance',
      amount: 750,
      paidTo: 'Local Plumber',
      paymentMode: 'Cash',
      date: 'Yesterday',
      notes: 'Kitchen sink drain fix',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<OwnerExpense['category']>('Raw Materials');
  const [formAmount, setFormAmount] = useState('');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<OwnerExpense['paymentMode']>('Cash');
  const [formNotes, setFormNotes] = useState('');

  const categories = [
    'ALL',
    'Raw Materials',
    'Kitchen Gas / Fuel',
    'Maintenance',
    'Staff Advance',
    'Utilities',
    'Misc',
  ];

  const totalExpenseToday = useMemo(
    () => expenses.reduce((acc, curr) => acc + curr.amount, 0),
    [expenses]
  );
  const totalCashPaid = useMemo(
    () =>
      expenses
        .filter((e) => e.paymentMode === 'Cash')
        .reduce((acc, curr) => acc + curr.amount, 0),
    [expenses]
  );
  const totalUpiPaid = useMemo(
    () =>
      expenses
        .filter((e) => e.paymentMode === 'UPI')
        .reduce((acc, curr) => acc + curr.amount, 0),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) => selectedCategory === 'ALL' || e.category === selectedCategory
    );
  }, [expenses, selectedCategory]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount) return;

    const newVoucher: OwnerExpense = {
      id: `exp-${Date.now()}`,
      voucherNo: `VOU-0${expenses.length + 193}`,
      title: formTitle,
      category: formCategory,
      amount: Number(formAmount) || 0,
      paidTo: formPaidTo || 'Vendor',
      paymentMode: formPaymentMode,
      date: 'Today, Just now',
      notes: formNotes,
    };

    setExpenses((prev) => [newVoucher, ...prev]);
    setShowAddModal(false);
    setFormTitle('');
    setFormAmount('');
    setFormPaidTo('');
    setFormNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this expense voucher?')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Daily Expenses & Petty Cash</h1>
          <p className="text-[11px] text-slate-400">
            Log vendor purchases, utility payments, maintenance and staff salary advances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense Voucher</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-black text-white p-4 rounded-xl shadow-2xs">
          <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Outflow</p>
          <p className="text-xl font-black mt-1">₹{totalExpenseToday.toLocaleString('en-IN')}.00</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{expenses.length} Vouchers Recorded</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Petty Cash Disbursed</p>
          <p className="text-xl font-black text-black mt-1">₹{totalCashPaid.toLocaleString('en-IN')}.00</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Paid from drawer cash</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Digital / UPI Payments</p>
          <p className="text-xl font-black text-black mt-1">₹{totalUpiPaid.toLocaleString('en-IN')}.00</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Paid directly via bank/UPI</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-black text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expense Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Voucher No</th>
              <th className="py-2.5 px-4">Title / Particulars</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Paid To</th>
              <th className="py-2.5 px-4">Mode</th>
              <th className="py-2.5 px-4">Date / Time</th>
              <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-mono font-bold text-black">{exp.voucherNo}</td>
                <td className="py-3 px-4">
                  <p className="font-bold text-black">{exp.title}</p>
                  {exp.notes && <p className="text-[10px] text-slate-400 italic">{exp.notes}</p>}
                </td>
                <td className="py-3 px-4">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[10px]">
                    {exp.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{exp.paidTo}</td>
                <td className="py-3 px-4 font-bold text-black">{exp.paymentMode}</td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">{exp.date}</td>
                <td className="py-3 px-4 text-right font-mono font-black text-black">
                  ₹{exp.amount.toLocaleString('en-IN')}.00
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 cursor-pointer"
                    title="Delete Voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Receipt className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No expense records found in this category.</p>
          </div>
        )}
      </div>

      {/* Add Voucher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">New Expense Voucher</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Expense Title / Particulars *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Vegetables purchase from mandi"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as OwnerExpense['category'])}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Kitchen Gas / Fuel">Kitchen Gas / Fuel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Staff Advance">Staff Advance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Paid To (Vendor/Person)</label>
                  <input
                    type="text"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as OwnerExpense['paymentMode'])}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  >
                    <option value="Cash">Cash (Drawer)</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Notes / Bill Reference</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional memo or invoice number"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold rounded cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
