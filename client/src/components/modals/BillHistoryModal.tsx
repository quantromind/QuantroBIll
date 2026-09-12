import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Printer,
  Receipt,
  FileText,
  Smartphone,
  Banknote,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePosSyncStore } from '../../store/posSyncStore';
import type { OwnerSaleTransaction } from '../../owner/types';
import { BillPrintModal } from './BillPrintModal';

interface BillHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillHistoryModal: React.FC<BillHistoryModalProps> = ({ isOpen, onClose }) => {
  const sales = usePosSyncStore((state) => state.sales);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [reprintSale, setReprintSale] = useState<OwnerSaleTransaction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchQuery =
        !searchQuery ||
        s.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tableOrToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerPhone && s.customerPhone.includes(searchQuery));

      const matchMode = filterMode === 'ALL' || s.paymentMode === filterMode;
      const matchType = filterType === 'ALL' || s.orderType === filterType;

      return matchQuery && matchMode && matchType;
    });
  }, [sales, searchQuery, filterMode, filterType]);

  // Aggregate stats
  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), [sales]);
  const upiTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'UPI').reduce((sum, s) => sum + s.totalAmount, 0),
    [sales]
  );
  const cashTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'Cash').reduce((sum, s) => sum + s.totalAmount, 0),
    [sales]
  );
  const cardTotal = useMemo(
    () => sales.filter((s) => s.paymentMode === 'Card').reduce((sum, s) => sum + s.totalAmount, 0),
    [sales]
  );

  const handlePrintKot = (s: OwnerSaleTransaction) => {
    showToast(`✓ KOT #${s.kotNo || s.billNo} sent to Kitchen Printer!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight">Bill History & Settled Invoices</h2>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  {sales.length} Total Bills
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Search, inspect, and reprint customer receipts & kitchen tickets in real time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Quick KPI Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Revenue</span>
            <p className="text-base font-black text-slate-900 mt-0.5">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">UPI / QR</span>
              <p className="text-base font-black text-emerald-600 mt-0.5">₹{upiTotal.toLocaleString('en-IN')}</p>
            </div>
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Cash</span>
              <p className="text-base font-black text-blue-600 mt-0.5">₹{cashTotal.toLocaleString('en-IN')}</p>
            </div>
            <Banknote className="w-4 h-4 text-blue-500" />
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Card / Other</span>
              <p className="text-base font-black text-purple-600 mt-0.5">₹{cardTotal.toLocaleString('en-IN')}</p>
            </div>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bill No (e.g. 892), Table No, Phone or Cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 text-slate-800 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="Dine In">Dine In</option>
              <option value="Take Away">Take Away</option>
              <option value="Parcel">Parcel</option>
              <option value="Delivery">Delivery</option>
            </select>

            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Mode:</span>
            {['ALL', 'Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterMode === mode
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Bills List Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#f8fafc] space-y-2.5">
          {filteredSales.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No settled bills found</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {sales.length === 0
                  ? 'No bills have been settled yet. Settle an order from the POS terminal to see its receipt here.'
                  : 'No bills match your current search or filter criteria.'}
              </p>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const isExpanded = expandedId === sale.id;
              const modeClass =
                sale.paymentMode === 'UPI'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : sale.paymentMode === 'Cash'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : sale.paymentMode === 'Card'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              const typeClass =
                sale.orderType?.toLowerCase().includes('dine')
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : sale.orderType?.toLowerCase().includes('take') || sale.orderType?.toLowerCase().includes('parcel')
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200';

              return (
                <div
                  key={sale.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition overflow-hidden"
                >
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono font-black text-sm text-slate-900">{sale.billNo}</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${typeClass}`}>
                          {sale.orderType}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{sale.tableOrToken}</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${modeClass}`}>
                          {sale.paymentMode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{sale.timestamp}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1.5">
                        <span>
                          Cashier: <strong className="text-slate-700">{sale.cashierName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Items: <strong className="text-slate-700">{sale.itemsCount}</strong>
                        </span>
                        {sale.customerPhone && (
                          <>
                            <span>•</span>
                            <span>
                              Cust: <strong className="text-slate-700">{sale.customerPhone}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                        <span className="text-base font-black text-slate-900">₹{sale.totalAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setReprintSale(sale)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          title="Reprint Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint Bill</span>
                        </button>

                        <button
                          onClick={() => handlePrintKot(sale)}
                          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Reprint Kitchen KOT"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>KOT</span>
                        </button>

                        {sale.items && sale.items.length > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="Toggle Item Details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable itemized detail */}
                  {isExpanded && sale.items && sale.items.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs">
                      <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2">
                        Itemized Order Breakdown:
                      </p>
                      <div className="divide-y divide-slate-200/60 font-mono text-[11px]">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="py-1 flex justify-between">
                            <span className="text-slate-800">
                              {item.quantity}× {item.name}
                            </span>
                            <span className="font-bold text-slate-900">
                              ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex justify-between text-slate-600 text-[11px]">
                        <span>Taxes: ₹{sale.taxAmount.toFixed(2)}</span>
                        {sale.discountAmount > 0 && <span>Discount: -₹{sale.discountAmount.toFixed(2)}</span>}
                        <span className="font-bold text-slate-900">Final: ₹{sale.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Showing {filteredSales.length} of {sales.length} settled records
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Bill Print Modal when user clicks Reprint Bill */}
      {reprintSale && (
        <BillPrintModal
          isOpen={true}
          onClose={() => setReprintSale(null)}
          orderType={
            reprintSale.orderType === 'Delivery'
              ? 'Delivery'
              : reprintSale.orderType === 'Parcel'
              ? 'Parcel'
              : reprintSale.orderType === 'Take Away'
              ? 'TakeAway'
              : 'DineIn'
          }
          items={
            reprintSale.items && reprintSale.items.length > 0
              ? reprintSale.items
              : [
                  {
                    menuItemId: 'reprint',
                    name: 'Settled Order Total',
                    quantity: 1,
                    unitPrice: reprintSale.totalAmount - reprintSale.taxAmount,
                    totalPrice: reprintSale.totalAmount - reprintSale.taxAmount,
                    isVeg: true,
                  },
                ]
          }
          subTotal={reprintSale.totalAmount - reprintSale.taxAmount + reprintSale.discountAmount}
          cgst={reprintSale.taxAmount / 2}
          sgst={reprintSale.taxAmount / 2}
          grandTotal={reprintSale.totalAmount}
          billNumber={reprintSale.billNo}
          kotNumber={reprintSale.kotNo || 'KOT-101'}
          tableNumber={reprintSale.tableOrToken.replace('Table ', '')}
          customerPhone={reprintSale.customerPhone}
          paymentMode={reprintSale.paymentMode === 'UPI' ? 'UPI' : reprintSale.paymentMode === 'Card' ? 'Card' : 'Cash'}
        />
      )}
    </div>
  );
};
