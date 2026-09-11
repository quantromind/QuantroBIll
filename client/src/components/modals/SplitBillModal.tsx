import React, { useState, useMemo } from 'react';
import { X, Check, Users, Split } from 'lucide-react';
import type { OrderItem } from '../../types';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  items: OrderItem[];
  onSplitComplete: (splits: { mode: string; amount: number }[]) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  items,
  onSplitComplete,
}) => {
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'BY_ITEM'>('EQUAL');

  // Equal Split State (up to 4 payers)
  const [payerCount, setPayerCount] = useState<number>(2);
  const [payers, setPayers] = useState<Array<{ id: number; name: string; amount: number; mode: string }>>([
    { id: 1, name: 'Guest 1', amount: Math.floor(grandTotal / 2), mode: 'Cash' },
    { id: 2, name: 'Guest 2', amount: grandTotal - Math.floor(grandTotal / 2), mode: 'UPI' },
  ]);

  // Recalculate equal split when payerCount changes
  const handlePayerCountChange = (count: number) => {
    setPayerCount(count);
    const perPerson = Math.floor(grandTotal / count);
    const remainder = grandTotal - perPerson * count;

    const newPayers = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Guest ${i + 1}`,
      amount: i === 0 ? perPerson + remainder : perPerson,
      mode: i % 2 === 0 ? 'Cash' : 'UPI',
    }));
    setPayers(newPayers);
  };

  // Item-Wise Split State: Map of itemId -> 1 or 2 (Bill 1 vs Bill 2)
  const [itemAssignments, setItemAssignments] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    items.forEach((it, idx) => {
      map[it.menuItemId || `it-${idx}`] = idx % 2 === 0 ? 1 : 2;
    });
    return map;
  });

  const [bill1Mode, setBill1Mode] = useState<string>('Cash');
  const [bill2Mode, setBill2Mode] = useState<string>('UPI');

  const bill1Items = useMemo(() => {
    return items.filter((it, idx) => (itemAssignments[it.menuItemId || `it-${idx}`] || 1) === 1);
  }, [items, itemAssignments]);

  const bill2Items = useMemo(() => {
    return items.filter((it, idx) => (itemAssignments[it.menuItemId || `it-${idx}`] || 1) === 2);
  }, [items, itemAssignments]);

  const bill1Total = useMemo(() => bill1Items.reduce((acc, i) => acc + i.totalPrice, 0), [bill1Items]);
  const bill2Total = useMemo(() => bill2Items.reduce((acc, i) => acc + i.totalPrice, 0), [bill2Items]);

  const toggleItemBill = (id: string) => {
    setItemAssignments((prev) => ({
      ...prev,
      [id]: prev[id] === 1 ? 2 : 1,
    }));
  };

  if (!isOpen) return null;

  const handleFinish = () => {
    if (splitMode === 'EQUAL') {
      onSplitComplete(payers.map((p) => ({ mode: p.mode, amount: p.amount })));
    } else {
      onSplitComplete([
        { mode: bill1Mode, amount: bill1Total },
        { mode: bill2Mode, amount: bill2Total },
      ]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Split Bill & Multi-Tender Settlement</h3>
              <p className="text-[11px] text-slate-500">Total payable: ₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setSplitMode('EQUAL')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              splitMode === 'EQUAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Split Equally (N-Ways)</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('BY_ITEM')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              splitMode === 'BY_ITEM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-indigo-600" />
            <span>Split by Items</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
          {/* TAB 1: EQUAL SPLIT */}
          {splitMode === 'EQUAL' && (
            <div className="space-y-3.5">
              {/* Payer Count Selector */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-bold">Number of Guests / Payers:</span>
                <div className="flex gap-1.5">
                  {[2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handlePayerCountChange(cnt)}
                      className={`w-8 h-8 rounded-lg font-black text-xs transition cursor-pointer ${
                        payerCount === cnt
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Payers List */}
              <div className="space-y-2.5">
                {payers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1 font-mono font-black text-sm text-emerald-600">
                        <span>₹</span>
                        <input
                          type="number"
                          value={p.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPayers((prev) =>
                              prev.map((item) => (item.id === p.id ? { ...item, amount: val } : item))
                            );
                          }}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                        />
                      </div>

                      <div className="flex gap-1">
                        {['Cash', 'UPI', 'Card'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setPayers((prev) =>
                                prev.map((item) => (item.id === p.id ? { ...item, mode: m } : item))
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                              p.mode === m
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SPLIT BY ITEM */}
          {splitMode === 'BY_ITEM' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 font-medium">
                Click an item badge to toggle it between <strong>Bill 1</strong> and <strong>Bill 2</strong>:
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {items.map((it, idx) => {
                  const key = it.menuItemId || `it-${idx}`;
                  const assignedBill = itemAssignments[key] || 1;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleItemBill(key)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 text-xs">
                          {it.quantity}x {it.name}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono font-semibold">₹{it.totalPrice.toFixed(2)}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          assignedBill === 1
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                        }`}
                      >
                        {assignedBill === 1 ? 'Assigned to Bill 1' : 'Assigned to Bill 2'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Sub-Bills Totals */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-900 text-xs">Receipt / Bill 1</span>
                    <span className="font-mono font-black text-sm text-slate-900">₹{bill1Total.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-indigo-600 font-medium">{bill1Items.length} items assigned</p>
                  <div className="flex gap-1 pt-1">
                    {['Cash', 'UPI', 'Card'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBill1Mode(m)}
                        className={`flex-1 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          bill1Mode === m
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white text-slate-600 border-indigo-200 hover:bg-indigo-100/50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900 text-xs">Receipt / Bill 2</span>
                    <span className="font-mono font-black text-sm text-slate-900">₹{bill2Total.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium">{bill2Items.length} items assigned</p>
                  <div className="flex gap-1 pt-1">
                    {['Cash', 'UPI', 'Card'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBill2Mode(m)}
                        className={`flex-1 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          bill2Mode === m
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-slate-600 border-emerald-200 hover:bg-emerald-100/50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Complete Split Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
