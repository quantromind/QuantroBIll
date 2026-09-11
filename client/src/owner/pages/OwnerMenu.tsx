import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { OwnerMenuItem } from '../types';

export const OwnerMenu: React.FC = () => {
  const [items, setItems] = useState<OwnerMenuItem[]>([
    { id: 'm-1', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'PBM' },
    { id: 'm-2', name: 'Butter Naan', category: 'Breads & Rice', price: 60, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'BN' },
    { id: 'm-3', name: 'Chicken Biryani', category: 'Main Course', price: 340, isVeg: false, gstPercent: 5, isAvailable: true, shortCode: 'CB' },
    { id: 'm-4', name: 'Veg Crispy', category: 'Starters', price: 210, isVeg: true, gstPercent: 5, isAvailable: false, shortCode: 'VC' }, // 86
    { id: 'm-5', name: 'Cold Coffee with Ice Cream', category: 'Beverages', price: 150, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'CC' },
    { id: 'm-6', name: 'Gulab Jamun (2 Pcs)', category: 'Desserts', price: 90, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'GJ' },
    { id: 'm-7', name: 'Dal Makhani', category: 'Main Course', price: 240, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'DM' },
    { id: 'm-8', name: 'Tandoori Roti', category: 'Breads & Rice', price: 25, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'TR' },
    { id: 'm-9', name: 'Chilli Chicken Dry', category: 'Starters', price: 310, isVeg: false, gstPercent: 5, isAvailable: true, shortCode: 'CCD' },
    { id: 'm-10', name: 'Fresh Lime Soda', category: 'Beverages', price: 80, isVeg: true, gstPercent: 5, isAvailable: true, shortCode: 'FLS' },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OwnerMenuItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Main Course');
  const [formPrice, setFormPrice] = useState('200');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formGstPercent, setFormGstPercent] = useState('5');
  const [formShortCode, setFormShortCode] = useState('');

  const categories = ['ALL', 'Starters', 'Main Course', 'Breads & Rice', 'Beverages', 'Desserts'];

  // Toggle availability (86 item out of stock)
  const handleToggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete this menu item?')) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Main Course');
    setFormPrice('200');
    setFormIsVeg(true);
    setFormGstPercent('5');
    setFormShortCode('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: OwnerMenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormIsVeg(item.isVeg);
    setFormGstPercent(item.gstPercent.toString());
    setFormShortCode(item.shortCode || '');
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formName,
                category: formCategory,
                price: Number(formPrice) || 0,
                isVeg: formIsVeg,
                gstPercent: Number(formGstPercent) || 5,
                shortCode: formShortCode.toUpperCase(),
              }
            : item
        )
      );
    } else {
      const newItem: OwnerMenuItem = {
        id: `m-${Date.now()}`,
        name: formName,
        category: formCategory,
        price: Number(formPrice) || 0,
        isVeg: formIsVeg,
        gstPercent: Number(formGstPercent) || 5,
        isAvailable: true,
        shortCode: formShortCode.toUpperCase() || formName.substring(0, 3).toUpperCase(),
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setShowAddModal(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortCode && item.shortCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const activeCount = items.filter((i) => i.isAvailable).length;
  const outOfStockCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Top Header & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Restaurant Menu Catalog</h1>
          <p className="text-[11px] text-slate-400">
            Manage food dishes, pricing, tax rates, and instant kitchen 86 (Out of Stock) toggles.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-600">
              Active: <strong className="text-black">{activeCount}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              86 Out-of-Stock: <strong className="text-black">{outOfStockCount}</strong>
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Search Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or code (e.g. PBM)..."
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Dish Name</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Shortcode</th>
              <th className="py-2.5 px-4 text-right">Price (₹)</th>
              <th className="py-2.5 px-4 text-center">GST %</th>
              <th className="py-2.5 px-4 text-center">Status / 86</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4">
                  <span
                    className={`inline-block w-3 h-3 border ${
                      item.isVeg
                        ? 'border-emerald-700 bg-white p-0.5'
                        : 'border-amber-900 bg-white p-0.5'
                    }`}
                    title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  >
                    <span
                      className={`block w-1.5 h-1.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-amber-900'
                      }`}
                    />
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-black">{item.name}</span>
                </td>
                <td className="py-3 px-4 text-slate-600">{item.category}</td>
                <td className="py-3 px-4">
                  <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] font-bold text-slate-800">
                    {item.shortCode || '-'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-black">
                  ₹{item.price.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{item.gstPercent}%</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title={item.isAvailable ? 'Click to mark Out-of-Stock (86)' : 'Click to enable item'}
                  >
                    {item.isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <ToggleRight className="w-5 h-5 text-black" />
                        <span className="text-[10px]">Available</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-bold">
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] text-slate-500 line-through">86 Out</span>
                      </span>
                    )}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded text-slate-600 hover:text-black hover:bg-slate-100 cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No items found matching the selected category or search query.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Item / Dish Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Kadai Paneer"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Breads & Rice">Breads & Rice</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Food Type</label>
                  <select
                    value={formIsVeg ? 'veg' : 'nonveg'}
                    onChange={(e) => setFormIsVeg(e.target.value === 'veg')}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  >
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">GST Slab (%)</label>
                  <select
                    value={formGstPercent}
                    onChange={(e) => setFormGstPercent(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Shortcode</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formShortCode}
                    onChange={(e) => setFormShortCode(e.target.value)}
                    placeholder="KP"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm shadow-blue-500/20 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Dish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
