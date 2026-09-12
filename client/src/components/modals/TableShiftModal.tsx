import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useDraftCartStore } from '../../store/draftCartStore';

interface TableShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTableNumber: string;
  onShiftSuccess?: (newTableNumber: string) => void;
}

export const TableShiftModal: React.FC<TableShiftModalProps> = ({
  isOpen,
  onClose,
  sourceTableNumber,
  onShiftSuccess,
}) => {
  const { tables, shiftTable } = useTableStore();

  const sourceTable = useMemo(
    () => tables.find((t) => t.tableNumber.toUpperCase() === sourceTableNumber.toUpperCase()),
    [tables, sourceTableNumber]
  );

  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Filter only vacant tables
  const vacantTables = useMemo(() => {
    return tables.filter(
      (t) =>
        !t.isOccupied &&
        t.tableNumber.toUpperCase() !== sourceTableNumber.toUpperCase() &&
        (selectedSection === 'All' || t.section === selectedSection)
    );
  }, [tables, sourceTableNumber, selectedSection]);

  const [targetTable, setTargetTable] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-select first vacant table
  React.useEffect(() => {
    if (vacantTables.length > 0 && !targetTable) {
      setTargetTable(vacantTables[0].tableNumber);
    }
  }, [vacantTables, targetTable]);

  if (!isOpen || !sourceTable) return null;

  const handleShift = () => {
    if (!targetTable) {
      setErrorMsg('Please select a destination table.');
      return;
    }

    const success = shiftTable(sourceTableNumber, targetTable);
    if (success) {
      useDraftCartStore.getState().moveDraft(
        `table:${sourceTableNumber.trim().toUpperCase()}`,
        `table:${targetTable.trim().toUpperCase()}`
      );
      if (onShiftSuccess) {
        onShiftSuccess(targetTable);
      }
      onClose();
    } else {
      setErrorMsg('Failed to transfer table. Please verify destination table is vacant.');
    }
  };

  const sections = ['All', 'Main Hall', 'AC Section', 'Outdoor / Patio', 'First Floor'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Shift / Transfer Table</h3>
              <p className="text-[11px] text-slate-500">
                Transfer all running KOT items from {sourceTable.tableNumber} to a vacant table.
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

          {/* Current Table Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Current Table
              </span>
              <p className="text-base font-black text-amber-600">{sourceTable.tableNumber}</p>
              <p className="text-[11px] text-slate-500">
                {sourceTable.section} • {sourceTable.items?.length || 0} dishes
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500">Running Total</span>
              <p className="text-base font-black text-slate-900">₹{sourceTable.orderTotal || 0}</p>
              <span className="text-[10px] font-mono font-bold text-indigo-600">{sourceTable.orderTime || 'Now'}</span>
            </div>
          </div>

          {/* Destination Section Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700">
              Filter Available Tables by Section:
            </label>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                    selectedSection === sec
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Vacant Tables Grid Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700">
              Select Destination Vacant Table:
            </label>

            {vacantTables.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                No vacant tables available in this section.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {vacantTables.map((t) => {
                  const isSelected = targetTable === t.tableNumber;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetTable(t.tableNumber);
                        setErrorMsg(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-2 ring-indigo-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{t.tableNumber}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{t.capacity} Seats</p>
                      <span className="text-[9px] text-emerald-600 font-bold mt-0.5">Vacant</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            disabled={!targetTable}
            onClick={handleShift}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Shift to {targetTable || 'Table'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
