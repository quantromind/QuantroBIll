import React, { useState, useMemo } from 'react';
import { X, GitMerge, AlertCircle, ArrowRight } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useDraftCartStore } from '../../store/draftCartStore';

interface TableMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceTableNumber?: string;
  onMergeSuccess?: (targetTableNumber: string) => void;
}

export const TableMergeModal: React.FC<TableMergeModalProps> = ({
  isOpen,
  onClose,
  initialSourceTableNumber,
  onMergeSuccess,
}) => {
  const { tables, mergeTables } = useTableStore();

  const occupiedTables = useMemo(() => tables.filter((t) => t.isOccupied), [tables]);

  const [sourceTable, setSourceTable] = useState<string>(
    initialSourceTableNumber || (occupiedTables[0]?.tableNumber ?? '')
  );

  const availableTargetTables = useMemo(() => {
    return tables.filter((t) => t.tableNumber.toUpperCase() !== sourceTable.toUpperCase());
  }, [tables, sourceTable]);

  const [targetTable, setTargetTable] = useState<string>(
    availableTargetTables[0]?.tableNumber ?? ''
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSource = useMemo(
    () => tables.find((t) => t.tableNumber.toUpperCase() === sourceTable.toUpperCase()),
    [tables, sourceTable]
  );

  const selectedTarget = useMemo(
    () => tables.find((t) => t.tableNumber.toUpperCase() === targetTable.toUpperCase()),
    [tables, targetTable]
  );

  // Consolidated preview
  const mergedItemsPreview = useMemo(() => {
    const sItems = selectedSource?.items || [];
    const tItems = selectedTarget?.items ? [...selectedTarget.items] : [];

    const result = [...tItems];
    sItems.forEach((si) => {
      const idx = result.findIndex((r) => r.menuItemId === si.menuItemId);
      if (idx !== -1) {
        const item = result[idx];
        const newQty = item.quantity + si.quantity;
        result[idx] = {
          ...item,
          quantity: newQty,
          totalPrice: item.unitPrice * newQty,
        };
      } else {
        result.push({ ...si });
      }
    });

    const grandTotal = result.reduce((acc, i) => acc + i.totalPrice, 0);
    return { items: result, grandTotal };
  }, [selectedSource, selectedTarget]);

  if (!isOpen) return null;

  const handleMerge = () => {
    if (!sourceTable || !targetTable) {
      setErrorMsg('Please select both a source and target table.');
      return;
    }

    if (sourceTable.toUpperCase() === targetTable.toUpperCase()) {
      setErrorMsg('Source and target tables cannot be the same.');
      return;
    }

    const success = mergeTables(sourceTable, targetTable);
    if (success) {
      useDraftCartStore.getState().mergeDrafts(
        `table:${sourceTable.trim().toUpperCase()}`,
        `table:${targetTable.trim().toUpperCase()}`
      );
      if (onMergeSuccess) {
        onMergeSuccess(targetTable);
      }
      onClose();
    } else {
      setErrorMsg('Failed to merge tables. Please ensure the source table has an active order.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Merge Tables (Combine Orders)</h3>
              <p className="text-[11px] text-slate-500">
                Consolidate running KOTs & dishes into a single master bill.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Table Selectors */}
          <div className="grid grid-cols-11 items-center gap-2">
            {/* Source Table */}
            <div className="col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Source Table (To vacate)
              </label>
              <select
                value={sourceTable}
                onChange={(e) => {
                  setSourceTable(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {occupiedTables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    {t.tableNumber} (₹{t.orderTotal || 0}) - {t.section}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Items: <strong>{selectedSource?.items?.length || 0}</strong> | Total:{' '}
                <strong className="text-amber-600">₹{selectedSource?.orderTotal || 0}</strong>
              </p>
            </div>

            {/* Direction Arrow */}
            <div className="col-span-1 flex justify-center text-slate-400">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Target Table */}
            <div className="col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Target Table (Keeps bill)
              </label>
              <select
                value={targetTable}
                onChange={(e) => {
                  setTargetTable(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {availableTargetTables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    {t.tableNumber} {t.isOccupied ? `(₹${t.orderTotal})` : '(Vacant)'} - {t.section}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Current: <strong>{selectedTarget?.items?.length || 0} items</strong> | Total:{' '}
                <strong className="text-indigo-600">₹{selectedTarget?.orderTotal || 0}</strong>
              </p>
            </div>
          </div>

          {/* Consolidated Items Preview */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-700">
                Consolidated Bill Preview ({targetTable})
              </span>
              <span className="text-xs font-black text-emerald-600">
                New Total: ₹{mergedItemsPreview.grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {mergedItemsPreview.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] py-0.5">
                  <span className="text-slate-700">
                    <strong className="text-amber-600">{it.quantity}x</strong> {it.name}
                  </span>
                  <span className="font-mono text-slate-500">₹{it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-tight font-medium">
            ⚠️ <strong>Note:</strong> Table <span className="text-slate-900 font-bold">{sourceTable}</span> will
            be marked <em>Vacant</em> immediately. All active dishes and running KOT tickets will be transferred
            to <span className="text-slate-900 font-bold">{targetTable}</span>.
          </p>
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
            onClick={handleMerge}
            className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs"
          >
            <GitMerge className="w-4 h-4" />
            <span>Confirm Table Merge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
