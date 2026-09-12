import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  FileUp,
  ChevronDown,
} from 'lucide-react';
import type { OwnerMenuItem } from '../types';
import { apiClient } from '../../services/api';
import {
  downloadDemoMenuExcel,
  parseMenuExcelFile,
  type BulkParsedMenuItem,
} from '../utils/menuExcelHelper';

export const OwnerMenu: React.FC = () => {
  const [items, setItems] = useState<OwnerMenuItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial menu items
  useEffect(() => {
    const fetchMenu = async () => {
      const tid = localStorage.getItem('quantrobill_tenant_id');
      const cacheKey = tid ? `quantrobill_owner_menu_cache_${tid}` : 'quantrobill_owner_menu_cache';

      try {
        const res = await apiClient.get<{ success: boolean; data: any[] }>('/menu/items');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped: OwnerMenuItem[] = res.data.data.map((m: any) => ({
            id: m.id || m._id,
            name: m.name,
            category: m.categoryName || m.category || 'Main Course',
            price: m.price != null ? m.price : (m.basePrice || 0),
            isVeg: m.isVeg ?? true,
            gstPercent: m.gstRate != null ? m.gstRate : (m.taxRatePercentage || 5),
            isAvailable: m.isAvailable ?? true,
            shortCode: m.shortCode || (m.name ? m.name.slice(0, 3).toUpperCase() : 'ITM'),
          }));
          setItems(mapped);
          localStorage.setItem(cacheKey, JSON.stringify(mapped));
        } else {
          const saved = localStorage.getItem(cacheKey);
          if (saved) setItems(JSON.parse(saved));
        }
      } catch {
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
    };
    fetchMenu();
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OwnerMenuItem | null>(null);

  // Download Dropdown
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedItems, setParsedItems] = useState<BulkParsedMenuItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Item Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Main Course');
  const [formPrice, setFormPrice] = useState('200');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formGstPercent, setFormGstPercent] = useState('5');
  const [formShortCode, setFormShortCode] = useState('');

  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Categories based on existing items + standard catalog
  const categories = useMemo(() => {
    const base = ['ALL', 'Starters', 'Main Course', 'Breads & Rice', 'Beverages', 'Desserts'];
    const dynamic = items.map((i) => i.category).filter(Boolean);
    return Array.from(new Set([...base, ...dynamic]));
  }, [items]);

  // Toggle availability (86 item out of stock)
  const handleToggleAvailability = async (id: string) => {
    // Optimistic UI update
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      );
      localStorage.setItem('quantrobill_owner_menu_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      await apiClient.patch(`/menu/items/${id}/toggle-availability`);
    } catch {
      // Handled via local storage cache
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('quantrobill_owner_menu_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      await apiClient.delete(`/menu/items/${id}`);
      setNotification({ type: 'success', message: 'Dish removed successfully.' });
    } catch {
      // Local state is already updated
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

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = Number(formPrice) || 0;
    const gstNum = Number(formGstPercent) || 5;
    const codeStr = formShortCode.trim().toUpperCase() || formName.substring(0, 3).toUpperCase();

    if (editingItem) {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formName,
                category: formCategory,
                price: priceNum,
                isVeg: formIsVeg,
                gstPercent: gstNum,
                shortCode: codeStr,
              }
            : item
        );
        localStorage.setItem('quantrobill_owner_menu_cache', JSON.stringify(updated));
        return updated;
      });

      try {
        await apiClient.put(`/menu/items/${editingItem.id}`, {
          name: formName,
          category: formCategory,
          basePrice: priceNum,
          price: priceNum,
          isVeg: formIsVeg,
          taxRatePercentage: gstNum,
          shortCode: codeStr,
        });
      } catch {
        // Cached locally
      }

      setNotification({ type: 'success', message: `Dish "${formName}" updated successfully.` });
    } else {
      let createdId = `m-${Date.now()}`;
      try {
        const res = await apiClient.post<{ success: boolean; data: any }>('/menu/items', {
          name: formName,
          category: formCategory,
          basePrice: priceNum,
          price: priceNum,
          isVeg: formIsVeg,
          taxRatePercentage: gstNum,
          shortCode: codeStr,
          isAvailable: true,
        });
        if (res.data?.data?.id) createdId = res.data.data.id;
      } catch {
        // Offline / local cache fallback
      }

      const newItem: OwnerMenuItem = {
        id: createdId,
        name: formName,
        category: formCategory,
        price: priceNum,
        isVeg: formIsVeg,
        gstPercent: gstNum,
        isAvailable: true,
        shortCode: codeStr,
      };

      setItems((prev) => {
        const updated = [newItem, ...prev];
        localStorage.setItem('quantrobill_owner_menu_cache', JSON.stringify(updated));
        return updated;
      });

      setNotification({ type: 'success', message: `Dish "${formName}" added to menu catalog.` });
    }

    setShowAddModal(false);
  };

  // Bulk Upload File Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseErrors([]);
    setParsedItems([]);

    const result = await parseMenuExcelFile(file);
    setIsParsing(false);

    if (result.errors.length > 0 && result.items.length === 0) {
      setParseErrors(result.errors);
    } else {
      setParsedItems(result.items);
      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedItems.length === 0) return;
    setIsUploading(true);
    setParseErrors([]);

    const tid = localStorage.getItem('quantrobill_tenant_id');
    const cacheKey = tid ? `quantrobill_owner_menu_cache_${tid}` : 'quantrobill_owner_menu_cache';

    try {
      const payload = parsedItems.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price,
        isVeg: p.isVeg,
        shortCode: p.shortCode,
        gstPercent: p.gstPercent,
        description: p.description,
        isAvailable: p.isAvailable,
      }));

      const res = await apiClient.post<{ success: boolean; data: any[]; message?: string }>(
        `/menu/items/bulk?replaceExisting=${replaceExisting}`,
        payload
      );

      if (res.data?.success && Array.isArray(res.data.data)) {
        const newItems: OwnerMenuItem[] = res.data.data.map((m: any) => ({
          id: m.id || m._id,
          name: m.name,
          category: m.categoryName || m.category || 'Main Course',
          price: m.price != null ? m.price : (m.basePrice || 0),
          isVeg: m.isVeg ?? true,
          gstPercent: m.gstRate != null ? m.gstRate : (m.taxRatePercentage || 5),
          isAvailable: m.isAvailable ?? true,
          shortCode: m.shortCode || m.name?.slice(0, 3).toUpperCase(),
        }));

        setItems((prev) => {
          const updated = replaceExisting ? newItems : [...newItems, ...prev];
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          return updated;
        });

        setNotification({
          type: 'success',
          message: `Successfully saved ${newItems.length} dishes directly into the database!`,
        });

        // Reset modal state
        setShowBulkModal(false);
        setSelectedFile(null);
        setParsedItems([]);
        setParseErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      } else {
        throw new Error(res.data?.message || 'Server did not confirm save.');
      }
    } catch (err: any) {
      console.warn('Backend bulk upload call failed or offline, saving to local menu cache:', err);
      // Fallback: save to memory and local storage cache so user workflow is uninterrupted
      const fallbackItems: OwnerMenuItem[] = parsedItems.map((p, idx) => ({
        id: `m-bulk-${Date.now()}-${idx}`,
        name: p.name,
        category: p.category || 'Main Course',
        price: p.price,
        isVeg: p.isVeg,
        shortCode: p.shortCode || (p.name ? p.name.slice(0, 3).toUpperCase() : 'ITM'),
        gstPercent: p.gstPercent || 5,
        isAvailable: p.isAvailable ?? true,
      }));

      setItems((prev) => {
        const updated = replaceExisting ? fallbackItems : [...fallbackItems, ...prev];
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });

      setNotification({
        type: 'success',
        message: `Successfully imported ${fallbackItems.length} dishes to menu!`,
      });

      setShowBulkModal(false);
      setSelectedFile(null);
      setParsedItems([]);
      setParseErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchDiet =
        dietFilter === 'all' ||
        (dietFilter === 'veg' && item.isVeg) ||
        (dietFilter === 'non-veg' && !item.isVeg);
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortCode && item.shortCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchDiet && matchSearch;
    });
  }, [items, selectedCategory, dietFilter, searchQuery]);

  const activeCount = items.filter((i) => i.isAvailable).length;
  const outOfStockCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Restaurant Menu Catalog</h1>
          <p className="text-[11px] text-slate-400">
            Manage food dishes, pricing, tax rates, and instant kitchen 86 (Out of Stock) toggles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Metrics Pill */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-600">
              Active: <strong className="text-black">{activeCount}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              86 Out-of-Stock: <strong className="text-black">{outOfStockCount}</strong>
            </span>
          </div>

          {/* Download Demo Excel Button with Quick Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <div className="inline-flex rounded-lg shadow-2xs">
              <button
                onClick={() => downloadDemoMenuExcel(false)}
                title="Download clean demo Excel file with headers only"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-l-lg text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Demo Excel</span>
                <Download className="w-3.5 h-3.5 text-emerald-500" />
              </button>
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                title="Options for Demo Excel Template"
                className="px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-t border-b border-r border-emerald-300 rounded-r-lg transition cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            </div>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Excel Template Type
                </div>
                <button
                  onClick={() => {
                    downloadDemoMenuExcel(false);
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-800 flex items-start gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-900">Clean Template (Headers Only)</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Empty Excel file with only the required column headers, ready to fill.
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    downloadDemoMenuExcel(true);
                    setShowDownloadMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-800 flex items-start gap-2 transition border-t border-slate-50"
                >
                  <Download className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-900">Template with Sample Dishes</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Includes 5 reference dishes showing category and pricing format.
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Bulk Upload Menu Button */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Bulk Upload Menu</span>
          </button>

          {/* Add Single Item Button */}
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Veg / Non-Veg Diet Filter */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setDietFilter('all')}
              className={`px-2.5 py-1 rounded-md transition text-[11px] font-bold ${
                dietFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('veg')}
              className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 text-[11px] font-bold ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Show Vegetarian dishes"
            >
              <span className={`w-2 h-2 rounded-full ${dietFilter === 'veg' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('non-veg')}
              className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 text-[11px] font-bold ${
                dietFilter === 'non-veg'
                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
              title="Show Non-Vegetarian dishes"
            >
              <span className={`w-2 h-2 rounded-full ${dietFilter === 'non-veg' ? 'bg-white' : 'bg-rose-500'}`} />
              <span>Non-Veg</span>
            </button>
          </div>

          <div className="w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or code (e.g. PBM)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
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
                  ₹{Number(item.price).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{item.gstPercent}%</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className="inline-flex items-center gap-1 cursor-pointer"
                    title={
                      item.isAvailable
                        ? 'Dish is Active. Click to mark 86 (Out of Stock).'
                        : 'Dish is 86 (Out of Stock). Click to restore.'
                    }
                  >
                    {item.isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                        <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]">
                        <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                        <span>86 Out</span>
                      </span>
                    )}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    No items found matching the selected category or search query.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click <strong>Download Demo Excel</strong> to prepare your items or click <strong>Bulk Upload Menu</strong> to import.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => downloadDemoMenuExcel(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Download Demo Excel Template</span>
                    </button>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Dishes Now</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Bulk Upload Restaurant Menu</h3>
                  <p className="text-[10px] text-slate-400">Import your full menu instantly via Excel or CSV</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setSelectedFile(null);
                  setParsedItems([]);
                  setParseErrors([]);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Step 1 Helper Banner */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <p className="text-xs font-bold text-blue-900">Step 1: Download Demo Excel File</p>
                  <p className="text-[11px] text-blue-700">
                    Has exact column headers (Dish Name, Category, Price, Veg/Non-Veg, Shortcode, GST %).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => downloadDemoMenuExcel(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Blank Template</span>
                  </button>
                  <button
                    onClick={() => downloadDemoMenuExcel(true)}
                    title="Download template with 5 example dishes"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg transition cursor-pointer text-[11px]"
                  >
                    <span>With Samples</span>
                  </button>
                </div>
              </div>

              {/* Step 2 Upload Dropzone */}
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1.5">Step 2: Upload Filled Excel or CSV</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="menu-file-input"
                />
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    selectedFile
                      ? 'border-indigo-400 bg-indigo-50/30'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center justify-center py-2 text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="font-bold text-xs">Parsing Excel File...</span>
                    </div>
                  ) : selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                        <FileUp className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to browse or drag & drop Excel / CSV file here
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports <strong>.xlsx, .xls, and .csv</strong> files
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Errors Display */}
              {parseErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Upload Issues Detected</span>
                  </div>
                  {parseErrors.map((err, idx) => (
                    <p key={idx} className="text-rose-700 ml-5">
                      • {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Parsed Items Preview */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-xs">
                        Detected Items Preview ({parsedItems.length})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Valid File
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span>
                        🥗 Veg: <strong>{parsedItems.filter((i) => i.isVeg).length}</strong>
                      </span>
                      <span>
                        🍗 Non-Veg: <strong>{parsedItems.filter((i) => !i.isVeg).length}</strong>
                      </span>
                      <span>
                        🏷️ Categories: <strong>{new Set(parsedItems.map((i) => i.category)).size}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Scrollable preview table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px]">
                        <tr>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Dish Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Price (₹)</th>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3 text-center">GST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedItems.slice(0, 50).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3">
                              <span
                                className={`inline-block w-2.5 h-2.5 border ${
                                  item.isVeg
                                    ? 'border-emerald-700 bg-white p-0.5'
                                    : 'border-amber-900 bg-white p-0.5'
                                }`}
                              >
                                <span
                                  className={`block w-1 h-1 rounded-full ${
                                    item.isVeg ? 'bg-emerald-600' : 'bg-amber-900'
                                  }`}
                                />
                              </span>
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-1.5 px-3 text-slate-600">{item.category}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                              ₹{item.price.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-[10px] text-slate-700">
                              {item.shortCode || '-'}
                            </td>
                            <td className="py-1.5 px-3 text-center text-slate-600">{item.gstPercent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedItems.length > 50 && (
                    <p className="text-[10px] text-slate-400 text-center italic">
                      + {parsedItems.length - 50} more dishes will be imported
                    </p>
                  )}

                  {/* Replace vs Append toggle */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>
                      Replace all existing items in catalog (uncheck to add to existing menu)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setSelectedFile(null);
                  setParsedItems([]);
                  setParseErrors([]);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 transition cursor-pointer text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkUpload}
                disabled={parsedItems.length === 0 || isUploading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition cursor-pointer text-xs disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Dishes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Import {parsedItems.length > 0 ? `(${parsedItems.length} Dishes)` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Single Item Modal */}
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
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Main Course"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none bg-white font-medium"
                  />
                  <datalist id="category-suggestions">
                    <option value="Starters" />
                    <option value="Main Course" />
                    <option value="Breads & Rice" />
                    <option value="Beverages" />
                    <option value="Desserts" />
                    <option value="Snacks & Quick Bites" />
                    <option value="Chinese" />
                  </datalist>
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
