import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  X,
  Printer,
  Download,
} from 'lucide-react';
import type { OwnerSaleTransaction } from '../types';
import { usePosSyncStore } from '../../store/posSyncStore';
import { useAuthStore } from '../../store/authStore';

export const OwnerSales: React.FC = () => {
  const { tenant } = useAuthStore();
  const sales = usePosSyncStore((state) => state.sales);

  useEffect(() => {
    usePosSyncStore.getState().fetchInitialData();
  }, []);

  const [filterCashier, setFilterCashier] = useState('ALL');
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<OwnerSaleTransaction | null>(null);

  const availableCashiers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.cashierName && s.cashierName.trim()) set.add(s.cashierName.trim());
    });
    return Array.from(set);
  }, [sales]);

  // Computed Totals
  const totalRevenue = useMemo(() => sales.reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
  const upiTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'UPI').reduce((acc, s) => acc + s.totalAmount, 0),
    [sales]
  );
  const cashTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'Cash').reduce((acc, s) => acc + s.totalAmount, 0),
    [sales]
  );
  const cardTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'Card').reduce((acc, s) => acc + s.totalAmount, 0),
    [sales]
  );
  const creditTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'Credit').reduce((acc, s) => acc + s.totalAmount, 0),
    [sales]
  );

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchCashier = filterCashier === 'ALL' || s.cashierName === filterCashier;
      const matchMode = filterMode === 'ALL' || s.paymentMode === filterMode;
      const matchType = filterType === 'ALL' || s.orderType === filterType;
      const matchQuery =
        s.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tableOrToken.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCashier && matchMode && matchType && matchQuery;
    });
  }, [sales, filterCashier, filterMode, filterType, searchQuery]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Page Title */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Sales & Cashier Audit</h1>
          <p className="text-[11px] text-slate-400">
            Real-time settled transactions, payment channel breakdown, and cashier accountability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Royal Blue & Soft Pastel Strip) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-md shadow-blue-500/20 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-blue-100">Total Net Revenue</p>
          <p className="text-xl font-black mt-1">₹{totalRevenue.toLocaleString('en-IN')}.00</p>
          <p className="text-[10px] text-blue-200 mt-0.5">{sales.length} Bills Settled</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">UPI / QR</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">₹{upiTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {((upiTotal / (totalRevenue || 1)) * 100).toFixed(0)}% of total
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cash in Drawer</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">₹{cashTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {((cashTotal / (totalRevenue || 1)) * 100).toFixed(0)}% of total
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Card POS</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">₹{cardTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {((cardTotal / (totalRevenue || 1)) * 100).toFixed(0)}% of total
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs hover:shadow-xs transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Customer Credit</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">₹{creditTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending Settlement</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Cashier:</span>
          <select
            value={filterCashier}
            onChange={(e) => setFilterCashier(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Cashiers</option>
            {availableCashiers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Payment:</span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Modes</option>
            <option value="UPI">UPI / QR</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Credit">Customer Credit</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Order Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="Dine In">Dine In</option>
            <option value="Take Away">Take Away</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bill number or table..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Bill No</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Table / Token</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map((tx) => {
              const typeBadgeClass =
                tx.orderType.toLowerCase().includes('dine')
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : tx.orderType.toLowerCase().includes('take') || tx.orderType.toLowerCase().includes('parcel')
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200';

              const modeBadgeClass =
                tx.paymentMode === 'UPI'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : tx.paymentMode === 'Cash'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : tx.paymentMode === 'Card'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.billNo}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md border font-semibold text-[10px] ${typeBadgeClass}`}>
                      {tx.orderType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{tx.tableOrToken}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-600">{tx.itemsCount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${modeBadgeClass}`}>
                      {tx.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{tx.cashierName}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">{tx.timestamp}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    ₹{tx.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer transition"
                      title="View Receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bill View Drawer / Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">Bill Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-blue-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <p className="font-black text-sm text-slate-900 uppercase">{tenant?.businessName || tenant?.name || 'RESTAURANT RECEIPT'}</p>
                <p className="text-[10px] text-slate-500">Tax Invoice / Receipt</p>
                <p className="text-[11px] font-bold text-blue-600 mt-1">{selectedTx.billNo}</p>
                <p className="text-[10px] text-slate-500">{selectedTx.timestamp}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Channel:</span>
                  <span className="font-bold text-slate-900">{selectedTx.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900">{selectedTx.tableOrToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billed by Cashier:</span>
                  <span className="font-bold text-slate-900">{selectedTx.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settled via:</span>
                  <span className="font-bold text-slate-900">{selectedTx.paymentMode}</span>
                </div>
              </div>

              {selectedTx.items && selectedTx.items.length > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Billed Items:</p>
                  {selectedTx.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        {it.quantity}x {it.name || it.menuItemName}
                      </span>
                      <span>₹{((it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(selectedTx.totalAmount - selectedTx.taxAmount + selectedTx.discountAmount).toFixed(2)}</span>
                </div>
                {selectedTx.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span>-₹{selectedTx.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Taxes (CGST+SGST 5%):</span>
                  <span>₹{selectedTx.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Paid:</span>
                  <span>₹{selectedTx.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
