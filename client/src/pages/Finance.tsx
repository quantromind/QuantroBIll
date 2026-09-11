import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Wallet,
  Plus,
  ArrowLeft
} from 'lucide-react';

export const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'shift' | 'expenses' | 'cashflow'>('shift');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  const [expenseCategory, setExpenseCategory] = useState('Supplies & Raw Materials');
  const [expenseAmount, setExpenseAmount] = useState<number>(250);
  const [expenseDesc, setExpenseDesc] = useState('');

  const [cashType, setCashType] = useState<'OpeningCash' | 'CashTopUp' | 'Withdrawal'>('CashTopUp');
  const [cashAmount, setCashAmount] = useState<number>(500);
  const [cashNote, setCashNote] = useState('');

  const [shiftData] = useState({
    totalSales: 8450,
    ordersCount: 38,
    cashSales: 3200,
    upiSales: 4100,
    cardSales: 1150,
    totalExpense: 650,
    openingCash: 2000,
    cashTopUp: 500,
    withdrawal: 0,
    expectedDrawerCash: 4050,
  });

  const [expenses, setExpenses] = useState([
    { id: 'e1', category: 'Dairy & Milk Supplies', amount: 350, desc: 'Amul Taaza 10L emergency stock', paidBy: 'Biller', time: '14:20' },
    { id: 'e2', category: 'Packaging & Straws', amount: 300, desc: 'Bio-degradable thick shake cups', paidBy: 'Biller', time: '11:05' },
  ]);

  const [cashFlow, setCashFlow] = useState([
    { id: 'c1', type: 'Opening Cash', amount: 2000, note: 'Morning shift opening drawer', time: '09:00' },
    { id: 'c2', type: 'Cash Top-Up', amount: 500, note: 'Change coins and 10/20 notes added', time: '12:30' },
  ]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenses((prev) => [
      {
        id: `e-${Date.now()}`,
        category: expenseCategory,
        amount: expenseAmount,
        desc: expenseDesc || 'Daily kitchen expense',
        paidBy: 'Staff',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    setShowExpenseModal(false);
  };

  const handleAddCash = (e: React.FormEvent) => {
    e.preventDefault();
    setCashFlow((prev) => [
      {
        id: `c-${Date.now()}`,
        type: cashType === 'CashTopUp' ? 'Cash Top-Up' : cashType === 'OpeningCash' ? 'Opening Cash' : 'Withdrawal',
        amount: cashAmount,
        note: cashNote || 'Counter cash change',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    setShowCashModal(false);
  };

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <Banknote className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Payments & Finance Register
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift Cash Flow, Expense Vouchers & End-of-Day Drawer Reconciliation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setShowCashModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-xs"
          >
            <Wallet className="w-4 h-4" />
            <span>Cash Entry</span>
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 touch-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>POS Screen</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Today Sales</span>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{shiftData.totalSales}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{shiftData.ordersCount} Paid Orders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Cash Collected</span>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{shiftData.cashSales}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">UPI: ₹{shiftData.upiSales} | Card: ₹{shiftData.cardSales}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
          <p className="text-2xl font-black text-rose-600 mt-1">₹{shiftData.totalExpense}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{expenses.length} petty vouchers</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-800">Expected Drawer Cash</span>
          <p className="text-2xl font-black text-emerald-950 mt-1">₹{shiftData.expectedDrawerCash}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Opening: ₹{shiftData.openingCash} + Net Cash</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-200/80 p-1 w-fit mb-4">
        <button
          onClick={() => setActiveTab('shift')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'shift' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Daily Shift Report
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'cashflow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Cash In/Out Log
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'expenses' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Paid By</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900">{exp.category}</td>
                  <td className="px-4 py-3 text-slate-600">{exp.desc}</td>
                  <td className="px-4 py-3 text-slate-700">{exp.paidBy}</td>
                  <td className="px-4 py-3 text-slate-500">{exp.time}</td>
                  <td className="px-4 py-3 font-black text-rose-600 text-right">₹{exp.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'cashflow' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Entry Type</th>
                <th className="px-4 py-3">Note / Purpose</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {cashFlow.map((cf) => (
                <tr key={cf.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900">{cf.type}</td>
                  <td className="px-4 py-3 text-slate-600">{cf.note}</td>
                  <td className="px-4 py-3 text-slate-500">{cf.time}</td>
                  <td className="px-4 py-3 font-black text-slate-900 text-right">₹{cf.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Shift Reconciliation Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-600">Opening Cash in Drawer:</span>
              <span className="font-bold text-slate-900">₹{shiftData.openingCash}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-600">+ Cash Sales Received:</span>
              <span className="font-bold text-emerald-600">+ ₹{shiftData.cashSales}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-600">+ Cash Top-Up:</span>
              <span className="font-bold text-emerald-600">+ ₹{shiftData.cashTopUp}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-600">- Petty Cash Expenses:</span>
              <span className="font-bold text-rose-600">- ₹{shiftData.totalExpense}</span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg text-sm font-black text-emerald-950">
              <span>Expected Closing Cash in Drawer:</span>
              <span>₹{shiftData.expectedDrawerCash}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Expense Voucher</h3>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                >
                  <option value="Dairy & Milk Supplies">Dairy & Milk Supplies</option>
                  <option value="Packaging & Straws">Packaging & Straws</option>
                  <option value="Kitchen Utensils">Kitchen Utensils</option>
                  <option value="Maintenance & Cleaning">Maintenance & Cleaning</option>
                  <option value="Staff Refreshment">Staff Refreshment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased 5kg sugar from local store"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg touch-btn shadow-xs"
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg touch-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash In/Out Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Cash Flow Entry</h3>
            <form onSubmit={handleAddCash} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={cashType}
                  onChange={(e: any) => setCashType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                >
                  <option value="CashTopUp">Cash Top-Up (Add Change)</option>
                  <option value="OpeningCash">Opening Balance</option>
                  <option value="Withdrawal">Withdrawal (Cash Drop)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note</label>
                <input
                  type="text"
                  placeholder="Reason for cash transaction"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg touch-btn shadow-xs"
                >
                  Save Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg touch-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
