import React, { useState } from 'react';
import {
  X,
  Check,
  CreditCard,
  Banknote,
  Printer,
  Bike,
  FileSpreadsheet,
  Percent,
  Users,
  Presentation,
  Package,
  Airplay,
  Sliders,
  RotateCcw,
  HelpCircle,
  Phone,
  Search,
  QrCode,
  Lock,
} from 'lucide-react';

// Common Modal Wrapper
export const ModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, icon, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className={`bg-white rounded-2xl ${maxWidth} w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">{icon}</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 touch-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// 1. Due Payment Modal
export const DuePaymentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [customers, setCustomers] = useState([
    { id: '1', name: 'Ramesh Patil', phone: '9822110022', dueAmount: 450, lastOrder: 'Bill #102 (2 days ago)' },
    { id: '2', name: 'Hotel Green Garden Staff', phone: '9876543200', dueAmount: 1200, lastOrder: 'Bill #108 (Yesterday)' },
    { id: '3', name: 'Anand Sharma (Corporate)', phone: '9890012345', dueAmount: 850, lastOrder: 'Bill #114 (Today)' },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSettle = () => {
    if (!selectedCustomer || payAmount <= 0) return;
    setCustomers((prev) =>
      prev
        .map((c) =>
          c.id === selectedCustomer.id ? { ...c, dueAmount: Math.max(0, c.dueAmount - payAmount) } : c
        )
        .filter((c) => c.dueAmount > 0)
    );
    setSuccessMsg(`Payment of ₹${payAmount} received via ${payMode} for ${selectedCustomer.name}`);
    setTimeout(() => {
      setSuccessMsg('');
      setSelectedCustomer(null);
      setPayAmount(0);
    }, 2000);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Customer Due Payment & Credit Balance" icon={<CreditCard className="w-4 h-4" />}>
      {successMsg ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center space-y-2">
          <Check className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      ) : selectedCustomer ? (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h4>
            <p className="text-slate-500">Phone: {selectedCustomer.phone}</p>
            <p className="text-red-600 font-black text-base mt-1">Pending Due: ₹{selectedCustomer.dueAmount}</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Settlement Amount (₹)</label>
            <input
              type="number"
              max={selectedCustomer.dueAmount}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Card'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPayMode(mode)}
                  className={`py-2 rounded-lg font-bold border text-center ${
                    payMode === mode ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleSettle}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg"
            >
              Confirm Settlement
            </button>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="text-slate-500 mb-2">Select a customer account to settle pending balance:</div>
          {customers.length === 0 ? (
            <p className="text-center py-6 text-slate-400 font-bold">No pending due balances recorded! 🎉</p>
          ) : (
            customers.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{c.name}</h4>
                  <p className="text-slate-400 text-[11px]">{c.phone} • {c.lastOrder}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-red-600 text-sm block">₹{c.dueAmount}</span>
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setPayAmount(c.dueAmount);
                    }}
                    className="mt-1 bg-slate-900 hover:bg-red-600 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </ModalWrapper>
  );
};

// 2. Bill / KOT Reprint Modal
export const ReprintModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [recentBills] = useState([
    { billNo: '74', kotNo: 'KOT-174', time: '10:42 PM', total: 370, items: 'Cold Coffee Float, Oreo Shake' },
    { billNo: '73', kotNo: 'KOT-173', time: '10:15 PM', total: 540, items: 'Paneer Sandwich, Peri Peri Fries, Choco Shake' },
    { billNo: '72', kotNo: 'KOT-172', time: '09:50 PM', total: 299, items: 'Magic Meal Combo 1' },
  ]);
  const [printSuccess, setPrintSuccess] = useState<string | null>(null);

  const handlePrint = (billNo: string, type: 'Bill' | 'KOT') => {
    setPrintSuccess(`Sent ${type} #${billNo} to 80mm Thermal Printer...`);
    setTimeout(() => setPrintSuccess(null), 2500);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Bill / KOT Reprint & Thermal History" icon={<Printer className="w-4 h-4" />}>
      {printSuccess && (
        <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold text-center">
          ✅ {printSuccess}
        </div>
      )}
      <div className="space-y-2.5 text-xs">
        {recentBills.map((b) => (
          <div key={b.billNo} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900">Bill #{b.billNo}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">{b.kotNo}</span>
                <span className="text-slate-400 text-[10px]">{b.time}</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 truncate max-w-xs">{b.items}</p>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-slate-900 mr-1">₹{b.total}</span>
              <button
                onClick={() => handlePrint(b.billNo, 'Bill')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[11px] touch-btn"
              >
                Print Bill
              </button>
              <button
                onClick={() => handlePrint(b.kotNo, 'KOT')}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2 py-1 rounded text-[11px] touch-btn"
              >
                Print KOT
              </button>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

// 3. Delivery Boys Modal
export const DeliveryBoysModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [riders] = useState([
    { id: '1', name: 'Ramesh Delivery Rider', phone: '9876543213', status: 'Available', activeOrders: 0 },
    { id: '2', name: 'Santosh Shinde', phone: '9822334411', status: 'On Delivery', activeOrders: 2 },
    { id: '3', name: 'Imran Khan', phone: '9890112233', status: 'Available', activeOrders: 0 },
  ]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Delivery Riders & Fleet Manager" icon={<Bike className="w-4 h-4" />}>
      <div className="space-y-3 text-xs">
        {riders.map((r) => (
          <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{r.name}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{r.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  r.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {r.status} {r.activeOrders > 0 && `(${r.activeOrders} Orders)`}
              </span>
              <a
                href={`tel:${r.phone}`}
                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                title="Call Rider"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

// 4. Expense & Petty Cash Modal
export const ExpenseModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(250);
  const [category, setCategory] = useState('Dairy / Milk');
  const [mode, setMode] = useState('Cash');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSavedMsg(`Recorded expense ₹${amount} for "${title}" under ${category}.`);
    setTimeout(() => {
      setSavedMsg('');
      setTitle('');
      onClose();
    }, 1800);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add Day-to-Day Store Expense" icon={<Banknote className="w-4 h-4" />}>
      {savedMsg ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-xs">
          ✅ {savedMsg}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Expense Title / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. 5L Amul Taaza Milk, Gas Cylinder Refill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
                <option value="Dairy / Milk">Dairy / Milk</option>
                <option value="Vegetables & Groceries">Vegetables & Groceries</option>
                <option value="Packaging & Bags">Packaging & Bags</option>
                <option value="Fuel / Gas Cylinder">Fuel / Gas Cylinder</option>
                <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                <option value="Staff Refreshment">Staff Refreshment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-black text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Paid From</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
              <option value="Cash">Cash Till / Drawer</option>
              <option value="UPI">Store UPI / QR</option>
              <option value="Card">Bank Account</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg touch-btn mt-2">
            Save Expense
          </button>
        </form>
      )}
    </ModalWrapper>
  );
};

// 5. Tax & GST Settings Modal
export const TaxSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [cgst, setCgst] = useState(2.5);
  const [sgst, setSgst] = useState(2.5);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [gstin, setGstin] = useState('27AABCU9603R1ZM');
  const [isInclusive, setIsInclusive] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Tax, GST & Service Charge Settings" icon={<FileSpreadsheet className="w-4 h-4" />}>
      {saved ? (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center font-bold text-xs">
          ✅ Tax configuration updated successfully!
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">GSTIN (15 Digits)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 uppercase font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">CGST (%)</label>
              <input
                type="number"
                step="0.1"
                value={cgst}
                onChange={(e) => setCgst(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SGST (%)</label>
              <input
                type="number"
                step="0.1"
                value={sgst}
                onChange={(e) => setSgst(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Restaurant Service Charge (%)</label>
            <input
              type="number"
              step="0.5"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
            />
          </div>

          <label className="flex items-center space-x-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isInclusive}
              onChange={(e) => setIsInclusive(e.target.checked)}
              className="rounded text-red-600 focus:ring-0"
            />
            <span className="font-semibold text-slate-700">Prices are GST-Inclusive</span>
          </label>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg touch-btn mt-2">
            Save Tax Rates
          </button>
        </form>
      )}
    </ModalWrapper>
  );
};

// 6. Discount & Coupons Modal
export const DiscountModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [coupons, setCoupons] = useState([
    { code: 'FLAT10', desc: 'Flat 10% Off on all orders', discountPct: 10 },
    { code: 'MAGIC20', desc: '20% off above ₹500', discountPct: 20 },
    { code: 'STAFF50', desc: '50% Staff discount', discountPct: 50 },
  ]);
  const [newCode, setNewCode] = useState('');
  const [newPct, setNewPct] = useState(15);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCoupons((prev) => [...prev, { code: newCode.trim().toUpperCase(), desc: `${newPct}% Discount`, discountPct: newPct }]);
    setNewCode('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Discount Rules & Promo Coupons" icon={<Percent className="w-4 h-4" />}>
      <div className="space-y-4 text-xs">
        <form onSubmit={handleAdd} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <h4 className="font-bold text-slate-800">Create New Promo Code</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="e.g. WELCOME15"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white uppercase font-mono font-bold"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={newPct}
              onChange={(e) => setNewPct(Number(e.target.value))}
              placeholder="Discount %"
              className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-bold"
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg">
            Add Coupon
          </button>
        </form>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-700">Active Coupons ({coupons.length})</h4>
          {coupons.map((c) => (
            <div key={c.code} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">{c.code}</span>
                <p className="text-slate-500 text-[11px] mt-0.5">{c.desc}</p>
              </div>
              <span className="font-black text-slate-800 text-sm">{c.discountPct}% OFF</span>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
};

// 7. Customers CRM Modal
export const CustomersModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [customers] = useState([
    { name: 'Neha Date', phone: '9822001122', visits: 8, points: 140, lastSpent: 380 },
    { name: 'Aditya Deshmukh', phone: '9890044556', visits: 14, points: 310, lastSpent: 520 },
    { name: 'Snehal Kulkarni', phone: '9876543210', visits: 5, points: 90, lastSpent: 260 },
  ]);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Customer Loyalty CRM & History" icon={<Users className="w-4 h-4" />}>
      <div className="space-y-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Customer Name or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.phone} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">{c.name}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{c.phone} • {c.visits} Total Visits</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                  ⭐ {c.points} Points
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Last: ₹{c.lastSpent}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
};

// 8. LED Token Display Modal
export const LedDisplayModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Live LED Token Display Screen" icon={<Presentation className="w-4 h-4" />} maxWidth="max-w-2xl">
      <div className="bg-slate-50 text-slate-800 p-6 rounded-2xl space-y-6 select-none text-center border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-bold text-rose-600 tracking-wider">QUANTROBILL KITCHEN CALLOUT</span>
          <span className="text-xs font-mono text-slate-500 font-semibold">THE MAGIC BOTTLE WAKAD</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white border border-emerald-300 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-2">
              🟢 NOW READY FOR PICKUP
            </span>
            <div className="flex flex-wrap gap-2">
              {['101', '104', '106'].map((t) => (
                <span key={t} className="text-3xl font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-amber-300 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-2">
              🟡 PREPARING IN KITCHEN
            </span>
            <div className="flex flex-wrap gap-2">
              {['107', '108', '109'].map((t) => (
                <span key={t} className="text-2xl font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-mono">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// 9. Raw Material & Stock Inventory Modal
export const InventoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [stock, setStock] = useState([
    { item: 'Whole Milk (Litres)', qty: 45, unit: 'L', minThreshold: 15, status: 'Healthy' },
    { item: 'Mozzarella Cheese Blend', qty: 6.5, unit: 'KG', minThreshold: 5, status: 'Low Stock' },
    { item: 'Cold Brew Coffee Beans', qty: 12, unit: 'KG', minThreshold: 4, status: 'Healthy' },
    { item: 'Belgian Dark Chocolate Chunks', qty: 3, unit: 'KG', minThreshold: 2, status: 'Healthy' },
    { item: 'Burger Buns (Packet)', qty: 35, unit: 'Pkt', minThreshold: 10, status: 'Healthy' },
    { item: 'Sandwich Jumbo Bread', qty: 8, unit: 'Loaf', minThreshold: 10, status: 'Low Stock' },
  ]);

  const addStock = (itemIdx: number) => {
    setStock((prev) =>
      prev.map((s, idx) => (idx === itemIdx ? { ...s, qty: s.qty + 5, status: 'Healthy' } : s))
    );
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Stock & Raw Material Inventory" icon={<Package className="w-4 h-4" />}>
      <div className="space-y-2 text-xs">
        {stock.map((s, idx) => (
          <div key={s.item} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">{s.item}</h4>
              <p className="text-slate-400 text-[11px]">Min alert threshold: {s.minThreshold} {s.unit}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`font-black text-xs px-2 py-0.5 rounded-md ${
                  s.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {s.qty} {s.unit}
              </span>
              <button
                onClick={() => addStock(idx)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2 py-1 rounded text-[11px]"
              >
                + Restock
              </button>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

// 10. Dual Customer Display Modal
export const DualScreenModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Dual Customer Screen (Customer Facing View)" icon={<Airplay className="w-4 h-4" />} maxWidth="max-w-xl">
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 space-y-4 select-none">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="font-black text-slate-900">THE MAGIC BOTTLE - CUSTOMER BILL</h4>
          <span className="text-xs font-bold text-emerald-600">Scan & Pay</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2 flex justify-between">
            <span>1x Alphonso Mango Shake</span>
            <span className="font-bold">₹180</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>1x Peri Peri Paneer Wrap</span>
            <span className="font-bold">₹170</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Total Payable Amount</span>
            <h2 className="text-2xl font-black text-slate-900">₹368.00</h2>
          </div>
          <div className="text-center">
            <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
            <span className="text-[10px] font-bold text-slate-600">UPI QR Code</span>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// 11. Hardware & POS Settings Modal
export const StoreSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [printerType, setPrinterType] = useState('Thermal80mm');
  const [headerText, setHeaderText] = useState('The Magic Bottle - Milkshakes & Snacks\nWakad, Pune - 411057');
  const [footerText, setFooterText] = useState('Thank you! Visit again\nFSSAI: 11521034000123');
  const [autoPrintBill, setAutoPrintBill] = useState(true);
  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="POS & Printer Hardware Configuration" icon={<Sliders className="w-4 h-4" />}>
      {saved ? (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center font-bold text-xs">
          ✅ Settings saved and printer synced!
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Printer Hardware Type</label>
            <select value={printerType} onChange={(e) => setPrinterType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold">
              <option value="Thermal80mm">Thermal 80mm (Standard POS Printer)</option>
              <option value="Thermal58mm">Thermal 58mm (2-inch Mobile / Bluetooth)</option>
              <option value="LaserA4">Standard A4 / Inkjet Printer</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Header Text</label>
            <textarea rows={2} value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Footer Text</label>
            <textarea rows={2} value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50" />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoPrintBill} onChange={(e) => setAutoPrintBill(e.target.checked)} className="rounded text-red-600 focus:ring-0" />
              <span className="font-semibold text-slate-700">Auto-print Bill on Save</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={autoPrintKOT} onChange={(e) => setAutoPrintKOT(e.target.checked)} className="rounded text-red-600 focus:ring-0" />
              <span className="font-semibold text-slate-700">Auto-print KOT on Punch</span>
            </label>
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg touch-btn mt-2">
            Save POS Configuration
          </button>
        </form>
      )}
    </ModalWrapper>
  );
};

// 12. 24x7 Help & Support Modal
export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="24x7 Dedicated Partner Support" icon={<HelpCircle className="w-4 h-4" />}>
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center">
          <Phone className="w-8 h-8 text-red-600 mx-auto" />
          <h4 className="font-black text-slate-900 text-base">Toll-Free POS Helpline</h4>
          <span className="text-xl font-mono font-black text-red-600 block">07969 223344</span>
          <p className="text-[11px] text-slate-500">24 Hours / 7 Days Instant Resolution for Billing & Kitchen Issues</p>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h5 className="font-bold text-slate-900">WhatsApp Support Desk</h5>
              <p className="text-slate-500 text-[11px]">+91 9822 00 1122</p>
            </div>
            <a
              href="https://wa.me/919822001122"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 text-white font-bold px-3 py-1 rounded text-xs"
            >
              Chat
            </a>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h5 className="font-bold text-slate-900">Email Support</h5>
              <p className="text-slate-500 text-[11px]">support@quantrobill.com</p>
            </div>
            <span className="text-[11px] font-bold text-slate-600">Avg 10 min reply</span>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// 13. Service Renewal & SaaS Subscription Modal
export const ServiceRenewalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="SaaS License & Subscription Plan" icon={<RotateCcw className="w-4 h-4" />}>
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl space-y-2 shadow-md">
          <div className="flex justify-between items-center">
            <span className="font-bold text-indigo-200 tracking-wider">ENTERPRISE PLAN</span>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">ACTIVE</span>
          </div>
          <h3 className="text-lg font-black">The Magic Bottle Group</h3>
          <p className="text-indigo-100/80 text-[11px]">Includes POS Billing, Cloud KDS, Online Aggregators & Reports</p>
          <div className="pt-2 border-t border-indigo-400/30 flex justify-between text-[11px] font-mono text-indigo-100">
            <span>Valid Until: <strong>08-Sep-2027</strong></span>
            <span>Max Outlets: <strong>10</strong></span>
          </div>
        </div>

        <button
          onClick={() => alert('License is active for 365 days. Auto-renewal enabled.')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg touch-btn shadow-xs"
        >
          Renew / Extend License
        </button>
      </div>
    </ModalWrapper>
  );
};

// 14. Manager Authorization PIN Modal (for Cashier Overrides: Discounts, Void Bill, Cancel)
export const ManagerPinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: () => void;
  actionTitle?: string;
}> = ({ isOpen, onClose, onAuthorize, actionTitle = 'Manager Authorization Required' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);

      if (nextPin.length === 4) {
        if (nextPin === '9999' || nextPin === '1234') {
          setTimeout(() => {
            onAuthorize();
            setPin('');
            onClose();
          }, 150);
        } else {
          setTimeout(() => {
            setError('Invalid Manager PIN. (Default: 9999 or 1234)');
            setPin('');
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={actionTitle} icon={<Lock className="w-4 h-4" />} maxWidth="max-w-xs">
      <div className="space-y-4 text-center">
        <p className="text-xs text-slate-500">
          Please enter 4-Digit Manager / Owner PIN to approve this action.
        </p>

        {/* Dots */}
        <div className="flex justify-center space-x-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  filled ? 'bg-blue-600 scale-110 shadow-xs' : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 border border-slate-200 text-base font-bold text-slate-800 transition"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 border border-slate-200 text-base font-bold text-slate-800 transition"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
          >
            ⌫
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Demo Manager PIN: <span className="font-mono font-bold text-slate-600">9999</span> or <span className="font-mono font-bold text-slate-600">1234</span>
        </p>
      </div>
    </ModalWrapper>
  );
};

