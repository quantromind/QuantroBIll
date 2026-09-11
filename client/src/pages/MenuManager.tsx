import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Plus,
  ToggleLeft,
  ToggleRight,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  Layers,
  RotateCcw,
  X
} from 'lucide-react';
import { useMenuStore, type MenuItemData, type MenuCategory } from '../store/menuStore';

export const MenuManager: React.FC = () => {
  const navigate = useNavigate();
  const {
    categories,
    items,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    toggleItemAvailability,
    resetToDefaults,
  } = useMenuStore();

  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);

  // Form states - Add Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState(categories[0]?.id || 'cat-shakes');
  const [newItemPrice, setNewItemPrice] = useState(150);
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Form states - Add Category
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addItem({
      name: newItemName.trim(),
      categoryId: newItemCategoryId,
      price: Number(newItemPrice) || 0,
      isVeg: newItemIsVeg,
      isAvailable: true,
      code: newItemCode.trim().toUpperCase() || 'ITEM',
      description: newItemDesc.trim(),
    });

    setNewItemName('');
    setNewItemCode('');
    setNewItemDesc('');
    setShowAddItemModal(false);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    updateItem(editingItem.id, {
      name: editingItem.name.trim(),
      categoryId: editingItem.categoryId,
      price: Number(editingItem.price) || 0,
      isVeg: editingItem.isVeg,
      code: editingItem.code.trim().toUpperCase() || 'ITEM',
      description: editingItem.description,
    });

    setEditingItem(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory(newCatName.trim(), newCatIcon.trim() || '🍽️', newCatDesc.trim());

    setNewCatName('');
    setNewCatDesc('');
    setNewCatIcon('🍽️');
    setShowAddCatModal(false);
  };

  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    updateCategory(
      editingCategory.id,
      editingCategory.name.trim(),
      editingCategory.icon || '🍽️',
      editingCategory.description || ''
    );

    setEditingCategory(null);
  };

  const handleDeleteCategory = (cat: MenuCategory) => {
    const count = items.filter((i) => i.categoryId === cat.id).length;
    if (
      window.confirm(
        `Are you sure you want to delete category "${cat.name}"? This will also remove ${count} items in it.`
      )
    ) {
      deleteCategory(cat.id);
    }
  };

  const handleDeleteItem = (item: MenuItemData) => {
    if (window.confirm(`Are you sure you want to delete item "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  const handleResetCatalog = () => {
    if (
      window.confirm(
        'Reset menu catalog back to standard restaurant/cafe categories and items?'
      )
    ) {
      resetToDefaults();
    }
  };

  const getCategoryName = (catId: string, itemName?: string) => {
    const cat = categories.find((c) => c.id === catId || c.name.toLowerCase() === catId.toLowerCase());
    if (cat) return `${cat.icon ? cat.icon + ' ' : ''}${cat.name}`;

    const searchTarget = `${catId} ${itemName || ''}`.toLowerCase();
    if (searchTarget.includes('shake') || searchTarget.includes('coffee') || searchTarget.includes('float')) {
      const found = categories.find((c) => c.id === 'cat-shakes' || c.name.includes('Shake'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('sandwich') || searchTarget.includes('toast')) {
      const found = categories.find((c) => c.id === 'cat-sandwiches' || c.name.includes('Sandwich'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('wrap') || searchTarget.includes('roll')) {
      const found = categories.find((c) => c.id === 'cat-wraps' || c.name.includes('Wrap'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('burger')) {
      const found = categories.find((c) => c.id === 'cat-burgers' || c.name.includes('Burger'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('fries') || searchTarget.includes('nachos') || searchTarget.includes('nugget') || searchTarget.includes('munch')) {
      const found = categories.find((c) => c.id === 'cat-munchies' || c.name.includes('Fries'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('pizza') || searchTarget.includes('garlic bread')) {
      const found = categories.find((c) => c.id === 'cat-pizzas' || c.name.includes('Pizza'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('combo') || searchTarget.includes('meal')) {
      const found = categories.find((c) => c.id === 'cat-combos' || c.name.includes('Combo'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('cappuccino') || searchTarget.includes('latte') || searchTarget.includes('chai') || searchTarget.includes('tea') || searchTarget.includes('brew')) {
      const found = categories.find((c) => c.id === 'cat-hotbrews' || c.name.includes('Brew'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('noodle') || searchTarget.includes('rice') || searchTarget.includes('manchurian') || searchTarget.includes('chilli')) {
      const found = categories.find((c) => c.id === 'cat-chinese' || c.name.includes('Chinese'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }
    if (searchTarget.includes('brownie') || searchTarget.includes('sundae') || searchTarget.includes('waffle') || searchTarget.includes('jamun') || searchTarget.includes('dessert')) {
      const found = categories.find((c) => c.id === 'cat-desserts' || c.name.includes('Dessert'));
      if (found) return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
    }

    return categories[0] ? `${categories[0].icon ? categories[0].icon + ' ' : ''}${categories[0].name}` : 'Thick Shakes & Cold Coffee';
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryName(i.categoryId, i.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Utensils className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Menu & Stock Catalog Builder
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Dishes, Categories, Pricing, Stock Availability & Instant On/Off Toggles
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'items' ? (
            <button
              onClick={() => {
                setNewItemCategoryId(categories[0]?.id || 'cat-shakes');
                setShowAddItemModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddCatModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}

          <button
            onClick={handleResetCatalog}
            title="Reset to default menu"
            className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-btn transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold touch-btn shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to POS Screen</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex rounded-xl bg-slate-200/80 p-1 w-fit">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'items' ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-blue-600" />
            <span>Menu Items ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'categories' ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, categories or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
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

      {/* Content Area */}
      {activeTab === 'items' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Diet</th>
                  <th className="px-4 py-3 text-center">Status (On/Off)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 font-bold">{item.code}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{getCategoryName(item.categoryId, item.name)}</td>
                    <td className="px-4 py-3 font-black text-slate-900">₹{item.price}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                          item.isVeg ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleItemAvailability(item.id)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold touch-btn transition-colors cursor-pointer border ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-rose-600" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5 text-slate-400">
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    {cat.icon || '🍽️'}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{count} Menu Items</p>
                    {cat.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <button
                    onClick={() => setEditingCategory({ ...cat })}
                    className="p-1.5 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Menu Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belgian Chocolate Shake or Loaded Nachos"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItemCategoryId}
                    onChange={(e) => setNewItemCategoryId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? c.icon + ' ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BCS"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diet Type</label>
                  <select
                    value={newItemIsVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setNewItemIsVeg(e.target.value === 'veg')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="veg">Veg (हिरवा)</option>
                    <option value="non-veg">Non-Veg (लाल)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients or preparation description"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Save Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg touch-btn transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Menu Item</h3>
            <form onSubmit={handleEditItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? c.icon + ' ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diet Type</label>
                  <select
                    value={editingItem.isVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.value === 'veg' })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Update Item
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg touch-btn transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts & Sundaes"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  placeholder="e.g. 🍨 or 🍕"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Freshly churned sweet ice creams"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg touch-btn transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Category</h3>
            <form onSubmit={handleEditCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  value={editingCategory.icon || '🍽️'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg touch-btn shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  Update Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg touch-btn transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
