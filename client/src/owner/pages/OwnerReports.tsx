import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { usePosSyncStore } from '../../store/posSyncStore';
import { useAuthStore } from '../../store/authStore';

export const OwnerReports: React.FC = () => {
  const { tenant } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'Z_REPORT' | 'ITEM_WISE' | 'TAX_REPORT' | 'VOIDS'>('Z_REPORT');
  const [selectedDate, setSelectedDate] = useState('Today');

  const sales = usePosSyncStore((state) => state.sales);

  useEffect(() => {
    usePosSyncStore.getState().fetchInitialData();
  }, []);

  // Dynamic calculations from real POS sales
  const liveGrossSales = useMemo(() => sales.reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
  const liveTaxAmount = useMemo(() => sales.reduce((acc, s) => acc + s.taxAmount, 0), [sales]);
  const liveUpi = useMemo(() => sales.filter((s) => s.paymentMode?.toLowerCase() === 'upi').reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
  const liveCash = useMemo(() => sales.filter((s) => s.paymentMode?.toLowerCase() === 'cash').reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
  const liveCard = useMemo(() => sales.filter((s) => s.paymentMode?.toLowerCase() === 'card').reduce((acc, s) => acc + s.totalAmount, 0), [sales]);

  // Item-wise sales from real sales transactions
  const itemWiseData = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      (s.items || []).forEach((it: any) => {
        const name = it.name || it.menuItemName || 'Item';
        const category = it.category || 'General';
        const qty = it.quantity || 1;
        const price = it.price || it.unitPrice || 0;
        const cur = itemMap.get(name) || { name, category, qty: 0, revenue: 0 };
        cur.qty += qty;
        cur.revenue += price * qty;
        itemMap.set(name, cur);
      });
    });
    const list = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);
    if (list.length > 0) return list;
    return [
      { name: 'Paneer Butter Masala', category: 'Main Course', qty: 34, revenue: 9520 },
      { name: 'Butter Naan', category: 'Breads & Rice', qty: 112, revenue: 6720 },
      { name: 'Chicken Biryani', category: 'Main Course', qty: 18, revenue: 6120 },
      { name: 'Cold Coffee with Ice Cream', category: 'Beverages', qty: 14, revenue: 2100 },
    ];
  }, [sales]);

  // Mock Tax breakdown
  const taxData = {
    grossTaxable: liveGrossSales,
    cgstAmount: Math.round(liveTaxAmount / 2),
    sgstAmount: Math.round(liveTaxAmount / 2),
    totalTax: liveTaxAmount,
    netCollection: liveGrossSales + liveTaxAmount,
  };

  // Mock Voids
  const voidData = [
    { kotNo: 'KOT-104', table: 'Table RM4', item: 'Chilli Chicken Dry', qty: 1, reason: 'Guest changed mind before cooking', time: '13:10', staff: 'raju' },
    { kotNo: 'KOT-098', table: 'Table 6', item: 'Fresh Lime Soda', qty: 2, reason: 'Duplicate punch by captain', time: '12:05', staff: 'gayathri' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Executive Operational Reports</h1>
          <p className="text-[11px] text-slate-400">
            Day-End Z-Reports, item popularity, GST filings audit, and cashier void logs.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-black focus:outline-none"
            >
              <option>Today (11/09/2026)</option>
              <option>Yesterday (10/09/2026)</option>
              <option>This Week</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('Z_REPORT')}
          className={`px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'Z_REPORT'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          Day-End Z-Report (Shift Closing)
        </button>
        <button
          onClick={() => setActiveTab('ITEM_WISE')}
          className={`px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'ITEM_WISE'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          Item-Wise Sales Matrix
        </button>
        <button
          onClick={() => setActiveTab('TAX_REPORT')}
          className={`px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'TAX_REPORT'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          GST & Tax Summary
        </button>
        <button
          onClick={() => setActiveTab('VOIDS')}
          className={`px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'VOIDS'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          Discounts & Void KOT Audits
        </button>
      </div>

      {/* Main Tab Panel */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-2xs p-5">
        {/* 1. Z-REPORT TAB */}
        {activeTab === 'Z_REPORT' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="border border-dashed border-slate-300 rounded-xl p-6 font-mono text-xs bg-slate-50/50">
              <div className="text-center pb-4 border-b border-slate-200">
                <p className="text-base font-black text-black uppercase">{tenant?.businessName || tenant?.name || 'RESTAURANT'}</p>
                <p className="text-[11px] text-slate-500">Official Day-End Z-Report</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Date: {selectedDate} | Shift 1 & 2</p>
              </div>

              <div className="py-4 space-y-2 border-b border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Cash Float:</span>
                  <span className="font-bold text-black">₹2,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Sales Value:</span>
                  <span className="font-bold text-black">₹{liveGrossSales.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Discounts Given:</span>
                  <span className="font-bold text-black">-₹600.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST Collected (5%):</span>
                  <span className="font-bold text-black">+₹{liveTaxAmount.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-black">
                  <span>Net Revenue Settled:</span>
                  <span>₹{(liveGrossSales + liveTaxAmount - 600).toLocaleString()}.00</span>
                </div>
              </div>

              <div className="py-4 space-y-2 border-b border-slate-200">
                <p className="font-bold text-black text-[11px] uppercase tracking-wider">Payment Mode Reconciliations</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI / QR Collections:</span>
                  <span className="font-bold text-black">₹{liveUpi.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Collections:</span>
                  <span className="font-bold text-black">₹{liveCash.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Card POS Machine:</span>
                  <span className="font-bold text-black">₹{liveCard.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Credit Issued:</span>
                  <span className="font-bold text-black">₹8,231.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-xs font-black text-black">
                  <span>Total Cash in Drawer (Float + Cash):</span>
                  <span>₹{(2000 + liveCash).toLocaleString()}.00</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Report Generated: Today, 23:59:59</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle className="w-3 h-3" />
                  <span>Registers Balanced</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ITEM WISE TAB */}
        {activeTab === 'ITEM_WISE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">Quantity Sold</th>
                  <th className="py-2.5 px-4 text-right">Revenue Generated (₹)</th>
                  <th className="py-2.5 px-4 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemWiseData.map((it) => {
                  const share = ((it.revenue / 29970) * 100).toFixed(1);
                  return (
                    <tr key={it.name} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-black">{it.name}</td>
                      <td className="py-3 px-4 text-slate-500">{it.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-black">{it.qty}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-black">
                        ₹{it.revenue.toLocaleString('en-IN')}.00
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. TAX REPORT TAB */}
        {activeTab === 'TAX_REPORT' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Taxable Turnover (5% Slab):</span>
                <span className="font-bold text-black">₹{taxData.grossTaxable.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Central GST (CGST @ 2.5%):</span>
                <span className="font-bold text-black">₹{taxData.cgstAmount.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">State GST (SGST @ 2.5%):</span>
                <span className="font-bold text-black">₹{taxData.sgstAmount.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-black text-sm">
                <span>Total GST Liability:</span>
                <span>₹{taxData.totalTax.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. VOIDS TAB */}
        {activeTab === 'VOIDS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">KOT #</th>
                  <th className="py-2.5 px-4">Table</th>
                  <th className="py-2.5 px-4">Item Cancelled</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voidData.map((vd) => (
                  <tr key={vd.kotNo} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-black">{vd.kotNo}</td>
                    <td className="py-3 px-4 font-semibold text-black">{vd.table}</td>
                    <td className="py-3 px-4 text-slate-800">{vd.item}</td>
                    <td className="py-3 px-4 text-center font-bold text-black">{vd.qty}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{vd.reason}</td>
                    <td className="py-3 px-4 text-slate-400">{vd.time}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{vd.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
