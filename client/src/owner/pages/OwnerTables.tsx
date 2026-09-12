import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid3X3,
  Plus,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  AlertCircle,
  X,
  Check,
  Armchair,
  ExternalLink,
} from 'lucide-react';
import { useTableStore, type TableData } from '../../store/tableStore';

export const OwnerTables: React.FC = () => {
  const navigate = useNavigate();
  const {
    tables,
    fetchTablesFromApi,
    createTable,
    updateTable,
    deleteTable,
    bulkGenerateTables,
    getSections,
  } = useTableStore();

  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [deletingTable, setDeletingTable] = useState<TableData | null>(null);

  // Single Table Form
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newSection, setNewSection] = useState<string>('Main Hall');
  const [customSection, setCustomSection] = useState<string>('');
  const [newCapacity, setNewCapacity] = useState<number>(4);

  // Edit Table Form
  const [editTableNumber, setEditTableNumber] = useState<string>('');
  const [editSection, setEditSection] = useState<string>('Main Hall');
  const [editCustomSection, setEditCustomSection] = useState<string>('');
  const [editCapacity, setEditCapacity] = useState<number>(4);

  // Bulk Generator Form
  const [bulkPrefix, setBulkPrefix] = useState<string>('T-');
  const [bulkStart, setBulkStart] = useState<number>(1);
  const [bulkEnd, setBulkEnd] = useState<number>(10);
  const [bulkSection, setBulkSection] = useState<string>('Main Hall');
  const [bulkCustomSection, setBulkCustomSection] = useState<string>('');
  const [bulkCapacity, setBulkCapacity] = useState<number>(4);

  useEffect(() => {
    fetchTablesFromApi();
  }, [fetchTablesFromApi]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  const dynamicSections = useMemo(() => {
    const fromStore = getSections();
    const defaults = ['Main Hall', 'AC Section', 'Outdoor / Patio', 'Rooftop', 'Family Section', 'First Floor'];
    const merged = Array.from(new Set([...defaults, ...fromStore]));
    return merged.filter(Boolean);
  }, [getSections, tables]);

  // Filtered tables list
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchSection = selectedSection === 'All' || t.section === selectedSection;
      const matchSearch =
        !searchQuery.trim() ||
        t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        t.section.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchSection && matchSearch;
    });
  }, [tables, selectedSection, searchQuery]);

  // KPI Metrics
  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const vacantCount = tables.length - occupiedCount;
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

  // Handlers
  const handleCreateSingleTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      showError('Please enter a table number.');
      return;
    }

    const effectiveSection = newSection === '__NEW__' ? customSection.trim() : newSection;
    if (!effectiveSection) {
      showError('Please specify a valid section.');
      return;
    }

    setIsSubmitting(true);
    const res = await createTable({
      tableNumber: newTableNumber.trim().toUpperCase(),
      section: effectiveSection,
      capacity: Number(newCapacity),
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Table ${newTableNumber.trim().toUpperCase()} created successfully!`);
      setNewTableNumber('');
      setCustomSection('');
      setShowAddModal(false);
    } else {
      showError(res.message || 'Failed to create table.');
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    if (!editTableNumber.trim()) {
      showError('Table number cannot be empty.');
      return;
    }

    const effectiveSection = editSection === '__NEW__' ? editCustomSection.trim() : editSection;
    if (!effectiveSection) {
      showError('Please specify a valid section.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateTable(editingTable.id, {
      tableNumber: editTableNumber.trim().toUpperCase(),
      section: effectiveSection,
      capacity: Number(editCapacity),
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Table ${editTableNumber.trim().toUpperCase()} updated successfully!`);
      setEditingTable(null);
    } else {
      showError(res.message || 'Failed to update table.');
    }
  };

  const handleDeleteTable = async () => {
    if (!deletingTable) return;
    setIsSubmitting(true);
    const res = await deleteTable(deletingTable.id);
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Table ${deletingTable.tableNumber} deleted.`);
      setDeletingTable(null);
    } else {
      showError(res.message || 'Could not delete table.');
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkEnd < bulkStart) {
      showError('End number must be greater than or equal to start number.');
      return;
    }

    const effectiveSection = bulkSection === '__NEW__' ? bulkCustomSection.trim() : bulkSection;
    if (!effectiveSection) {
      showError('Please specify a valid section.');
      return;
    }

    setIsSubmitting(true);
    const res = await bulkGenerateTables({
      prefix: bulkPrefix.trim(),
      startNumber: Number(bulkStart),
      endNumber: Number(bulkEnd),
      section: effectiveSection,
      capacity: Number(bulkCapacity),
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast(`Generated ${res.count || (bulkEnd - bulkStart + 1)} tables successfully!`);
      setShowBulkModal(false);
    } else {
      showError(res.message || 'Bulk generation failed.');
    }
  };

  const openEditModal = (t: TableData) => {
    setEditingTable(t);
    setEditTableNumber(t.tableNumber);
    setEditSection(t.section || 'Main Hall');
    setEditCustomSection('');
    setEditCapacity(t.capacity || 4);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-slate-900 select-none pb-12">
      {/* Toast & Error Notifications */}
      {toastMessage && (
        <div className="fixed top-16 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-16 right-6 bg-rose-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-rose-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-300" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Page Title & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Grid3X3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Floor & Table Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure dining sections, add tables, generate bulk tables, and manage seating layout
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <button
            onClick={() => navigate('/tables')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 touch-btn shadow-2xs transition cursor-pointer"
            title="Open Live Table Matrix in POS"
          >
            <Grid3X3 className="w-4 h-4 text-blue-600" />
            <span>Open POS Floor Matrix</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 touch-btn shadow-2xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Bulk Generate Tables</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 touch-btn shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Table</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Tables</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Grid3X3 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{tables.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active dining stations</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Vacant Tables</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{vacantCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Ready for guests</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-2xs bg-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Occupied Tables</span>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Armchair className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{occupiedCount}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Currently dining</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pax Capacity</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalCapacity}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total restaurant seating</p>
        </div>
      </div>

      {/* Control Toolbar: Section Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Section Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSection('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSection === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sections ({tables.length})
          </button>
          {dynamicSections.map((sec) => {
            const count = tables.filter((t) => t.section === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedSection === sec
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
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
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Grid3X3 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">No tables found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {tables.length === 0
              ? 'Get started by creating your first table or generating a bulk range for your restaurant.'
              : 'No tables match the selected section or search criteria.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              + Add First Table
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              ⚡ Bulk Generate 10 Tables
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredTables.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs group relative overflow-hidden ${
                t.isOccupied
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Row: Section & Pax */}
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold text-slate-500 truncate max-w-[90px]" title={t.section}>
                  {t.section}
                </span>
                <span className="flex items-center space-x-1 font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md text-[10px]">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>{t.capacity}</span>
                </span>
              </div>

              {/* Center: Table Number */}
              <div className="my-2 text-center">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.tableNumber}</h3>
                <div className="mt-1.5 flex items-center justify-center">
                  {t.isOccupied ? (
                    <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>Occupied • ₹{t.orderTotal || 0}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Vacant</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-1">
                <button
                  onClick={() => openEditModal(t)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Edit Table Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setDeletingTable(t)}
                  disabled={t.isOccupied}
                  className={`p-1.5 rounded-lg transition ${
                    t.isOccupied
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title={t.isOccupied ? 'Cannot delete occupied table' : 'Delete Table'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD SINGLE TABLE                                */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900">Add New Table</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Table Identifier / Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-15, VIP-1, P-4"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold uppercase"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Floor Section
                </label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                >
                  {dynamicSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add Custom Section...</option>
                </select>
                {newSection === '__NEW__' && (
                  <input
                    type="text"
                    placeholder="Enter custom section name (e.g. Rooftop Bar)"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-xl focus:outline-none focus:border-blue-500 font-semibold mt-2"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seating Capacity (Pax)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: BULK GENERATE TABLES                            */}
      {/* ======================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Bulk Generate Tables</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Generate a sequential range of dining tables instantly. Existing table numbers within the range will be safely skipped.
            </p>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    placeholder="T-"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start #</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkStart}
                    onChange={(e) => setBulkStart(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End #</label>
                  <input
                    type="number"
                    min={bulkStart}
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <select
                  value={bulkSection}
                  onChange={(e) => setBulkSection(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                >
                  {dynamicSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add Custom Section...</option>
                </select>
                {bulkSection === '__NEW__' && (
                  <input
                    type="text"
                    placeholder="Enter custom section name"
                    value={bulkCustomSection}
                    onChange={(e) => setBulkCustomSection(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-xl focus:outline-none focus:border-blue-500 font-semibold mt-2"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seating Capacity per Table
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={bulkCapacity}
                  onChange={(e) => setBulkCapacity(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span>Preview: </span>
                <strong className="text-blue-700">
                  {bulkPrefix}{bulkStart} to {bulkPrefix}{bulkEnd}
                </strong>
                <span> ({Math.max(0, bulkEnd - bulkStart + 1)} tables) in </span>
                <strong>{bulkSection === '__NEW__' ? bulkCustomSection || '...' : bulkSection}</strong>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Tables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDIT TABLE                                      */}
      {/* ======================================================== */}
      {editingTable && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900">Edit Table {editingTable.tableNumber}</h3>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Table Number / Identifier
                </label>
                <input
                  type="text"
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Floor Section</label>
                <select
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                >
                  {dynamicSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add Custom Section...</option>
                </select>
                {editSection === '__NEW__' && (
                  <input
                    type="text"
                    placeholder="Enter custom section name"
                    value={editCustomSection}
                    onChange={(e) => setEditCustomSection(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-xl focus:outline-none focus:border-blue-500 font-semibold mt-2"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seating Capacity (Pax)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION                             */}
      {/* ======================================================== */}
      {deletingTable && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Delete Table</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete table <strong>{deletingTable.tableNumber}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
