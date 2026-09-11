import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import type { InventoryIngredient } from '../types';
import { usePosSyncStore } from '../../store/posSyncStore';

export const OwnerInventory: React.FC = () => {
  // Sub-tabs exactly as in Screenshot 4
  const [activeTab, setActiveTab] = useState<
    'INGREDIENTS' | 'LOAD STOCK' | 'STOCK ISSUE' | 'SELF MADE' | 'STOCK AVAILABLE' | 'STOCK INSPECTION' | 'TRANSACTIONS'
  >('INGREDIENTS');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);

  // Live stock ingredients from posSyncStore
  const ingredients = usePosSyncStore((state) => state.inventory);
  const addInventoryIngredient = usePosSyncStore((state) => state.addInventoryIngredient);

  // Form State for New Ingredient
  const [newName, setNewName] = useState('');
  const [newUom, setNewUom] = useState('Piece');
  const [newParStock, setNewParStock] = useState(100);
  const [newPrice, setNewPrice] = useState(50);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) =>
      item.stockItemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ingredients, searchQuery]);

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newIng: InventoryIngredient = {
      id: `${Date.now()}`.slice(-4),
      stockItemName: newName.trim().toUpperCase(),
      recipeUom: newUom,
      parStockQuantity: newParStock,
      parStockUnit: `${newUom}s`,
      currentAvailable: newParStock,
      landingPrice: newPrice,
    };

    addInventoryIngredient(newIng);
    setNewName('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this stock item?')) {
      usePosSyncStore.setState((state) => ({
        inventory: state.inventory.filter((i) => i.id !== id),
      }));
    }
  };

  const tabs = [
    'INGREDIENTS',
    'LOAD STOCK',
    'STOCK ISSUE',
    'SELF MADE',
    'STOCK AVAILABLE',
    'STOCK INSPECTION',
    'TRANSACTIONS',
  ] as const;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900 select-none">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Inventory & Ingredients Management</h1>
          <p className="text-[11px] text-slate-400">
            Monitor raw material stock, recipe consumption (BOM), load stock and par stock alerts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW INGREDIENT</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto text-xs font-bold shadow-2xs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700 font-extrabold bg-blue-50/70'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-2xs overflow-hidden p-4 space-y-4">
        {activeTab === 'INGREDIENTS' ? (
          <>
            {/* Table Controls (Display records & Search) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Displaying</span>
                <select
                  value={recordsPerPage}
                  onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-slate-500">records</span>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 w-full sm:w-64">
                <span className="text-slate-500 font-bold">Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter item name..."
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Ingredients Table (Screenshot 4) */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4 w-16">ID</th>
                    <th className="py-2.5 px-4">Stock Item Name</th>
                    <th className="py-2.5 px-4">Recipe UOM</th>
                    <th className="py-2.5 px-4">Par Stock(Q)</th>
                    <th className="py-2.5 px-4">Current Available</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredIngredients.map((item) => {
                    const isLowStock = item.currentAvailable <= item.parStockQuantity * 0.3;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-500">{item.id}</td>
                        <td className="py-2.5 px-4 font-bold text-black">{item.stockItemName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{item.recipeUom}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold">
                          {item.parStockQuantity} - {item.parStockUnit}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-bold ${
                              isLowStock ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            <span>{item.currentAvailable}</span>
                            {isLowStock && <span className="text-[10px] font-sans font-semibold">(Low)</span>}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => alert(`Inspecting stock history for ${item.stockItemName}`)}
                              className="p-1 rounded text-slate-600 hover:text-black hover:bg-slate-100 transition cursor-pointer"
                              title="Inspect Item"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Placeholder for other sub-modules */
          <div className="py-12 text-center text-slate-400 text-xs">
            <p className="font-bold text-slate-700 mb-1">{activeTab} Module Ready</p>
            <p>GRN Load Stock and Station Issue workflows will link directly to suppliers.</p>
          </div>
        )}
      </div>

      {/* Modal: Add New Ingredient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-black">Add New Stock Ingredient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Item Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. AMUL BUTTER 500G"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold text-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipe UOM</label>
                  <select
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white font-semibold"
                  >
                    <option value="Piece">Piece (Pc)</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="Liter">Liter (L)</option>
                    <option value="Ml">Milliliter (ml)</option>
                    <option value="Can">Can</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Par Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newParStock}
                    onChange={(e) => setNewParStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Landing Purchase Cost (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
