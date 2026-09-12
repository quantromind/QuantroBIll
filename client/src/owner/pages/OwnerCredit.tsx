import React, { useState, useMemo } from 'react';
import {
  Plus,
  X,
  Check,
  CreditCard,
  AlertTriangle,
  ReceiptText,
} from 'lucide-react';
import type { CreditCustomer } from '../types';

export const OwnerCredit: React.FC = () => {
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState<'Cash' | 'UPI'>('UPI');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInitialCredit, setNewInitialCredit] = useState('');

  const totalOutstandingDue = useMemo(
    () => creditCustomers.reduce((acc, c) => acc + c.outstandingCreditDue, 0),
    [creditCustomers]
  );
  const pendingAccountsCount = useMemo(
    () => creditCustomers.filter((c) => c.outstandingCreditDue > 0).length,
    [creditCustomers]
  );

  const filtered = useMemo(() => {
    return creditCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
  }, [creditCustomers, searchQuery]);

  const handleOpenSettle = (c: CreditCustomer) => {
    setSelectedCustomer(c);
    setSettleAmount(c.outstandingCreditDue.toString());
    setSettleMode('UPI');
    setShowSettleModal(true);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amount = Number(settleAmount) || 0;
    setCreditCustomers((prev) =>
      prev.map((c) => {
        if (c.id === selectedCustomer.id) {
          const remaining = Math.max(0, c.outstandingCreditDue - amount);
          return {
            ...c,
            outstandingCreditDue: remaining,
            status: remaining === 0 ? 'Clear' : 'DuePending',
          };
        }
        return c;
      })
    );

    setShowSettleModal(false);
    setSelectedCustomer(null);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const initDue = Number(newInitialCredit) || 0;
    const newAccount: CreditCustomer = {
      id: `cr-${Date.now()}`,
      name: newName,
      phone: newPhone,
      totalVisits: 1,
      totalSpent: initDue,
      outstandingCreditDue: initDue,
      lastOrderDate: 'Today',
      status: initDue > 0 ? 'DuePending' : 'Clear',
    };

    setCreditCustomers((prev) => [newAccount, ...prev]);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewInitialCredit('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Credit Customers Ledger</h1>
          <p className="text-[11px] text-slate-400">
            Monitor outstanding credit balances, corporate credit accounts, and record debt settlements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Credit Account</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-black text-white p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Outstanding Debt</p>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black mt-1">₹{totalOutstandingDue.toLocaleString('en-IN')}.00</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{pendingAccountsCount} Accounts Pending</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Accounts in Good Standing</p>
          <p className="text-xl font-black text-black mt-1">
            {creditCustomers.length - pendingAccountsCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Fully cleared balance</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Corporate & VIP Accounts</p>
          <p className="text-xl font-black text-black mt-1">{creditCustomers.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Authorized credit customers</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search credit account by name or phone..."
          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
        />
      </div>

      {/* Credit Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Customer / Organization</th>
              <th className="py-2.5 px-4">Contact Phone</th>
              <th className="py-2.5 px-4 text-center">Visits</th>
              <th className="py-2.5 px-4 text-right">Total Billing (₹)</th>
              <th className="py-2.5 px-4 text-right">Outstanding Due (₹)</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-bold text-black">{c.name}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{c.phone}</td>
                <td className="py-3 px-4 text-center font-bold text-black">{c.totalVisits}</td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">
                  ₹{c.totalSpent.toLocaleString('en-IN')}.00
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-black">
                  {c.outstandingCreditDue > 0 ? (
                    <span className="text-black bg-slate-100 px-2 py-0.5 rounded font-black border border-slate-300">
                      ₹{c.outstandingCreditDue.toLocaleString('en-IN')}.00
                    </span>
                  ) : (
                    <span className="text-slate-400">₹0.00</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.outstandingCreditDue > 0
                        ? 'bg-black text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.outstandingCreditDue > 0 ? 'Due Pending' : 'All Clear'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {c.outstandingCreditDue > 0 ? (
                    <button
                      onClick={() => handleOpenSettle(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white hover:bg-neutral-800 text-[11px] font-bold rounded cursor-pointer transition shadow-2xs"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Settle Due</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">No Due</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No credit / udhar customers recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Settle Balance Modal */}
      {showSettleModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">Settle Credit Balance</h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-black text-sm">{selectedCustomer.name}</p>
                <p className="text-[11px] text-slate-500">Phone: {selectedCustomer.phone}</p>
                <p className="text-xs font-black text-black mt-2">
                  Total Outstanding: ₹{selectedCustomer.outstandingCreditDue.toLocaleString('en-IN')}.00
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.outstandingCreditDue}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Payment Received Via</label>
                <select
                  value={settleMode}
                  onChange={(e) => setSettleMode(e.target.value as 'Cash' | 'UPI')}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium focus:border-black focus:outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold rounded cursor-pointer"
                >
                  <ReceiptText className="w-3.5 h-3.5" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Credit Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">New Credit Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Verma Enterprises"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Initial Outstanding Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newInitialCredit}
                  onChange={(e) => setNewInitialCredit(e.target.value)}
                  placeholder="0"
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
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
