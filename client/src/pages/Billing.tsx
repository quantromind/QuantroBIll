import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  UserCheck,
  FileEdit,
  Utensils,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Ticket,
  Layers,
  GitMerge,
  ArrowRightLeft,
  Split,
  Percent,
  Lock,
  Printer,
  History,
} from 'lucide-react';
import type { OrderItem, OrderType, PaymentMode } from '../types';
import { useLangStore } from '../store/langStore';
import { useMenuStore, type MenuItemData } from '../store/menuStore';
import { useTableStore } from '../store/tableStore';
import { usePosSyncStore } from '../store/posSyncStore';
import { useAuthStore, isWaiterOnly, canSettleBills, canApplyDiscounts, canVoidBills } from '../store/authStore';
import { BillPrintModal } from '../components/modals/BillPrintModal';
import { SplitBillModal } from '../components/modals/SplitBillModal';
import { TableMergeModal } from '../components/modals/TableMergeModal';
import { TableShiftModal } from '../components/modals/TableShiftModal';
import { ManagerPinModal } from '../components/modals/OperationsModals';
import { BillHistoryModal } from '../components/modals/BillHistoryModal';
import { useDraftCartStore } from '../store/draftCartStore';

export const Billing: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const initialTable = searchParams.get('table') || 'T-1';

  const { posMode, t } = useLangStore();
  const strings = t();

  // Menu Store
  const { categories, items, fetchFromBackend } = useMenuStore();

  // Table Store
  const { tables, getTable, vacateTable, updateTableOrder } = useTableStore();

  // Role & Permissions
  const userRole = user?.role || 'Cashier';
  const isWaiter = isWaiterOnly(userRole);
  const canSettle = canSettleBills(userRole);
  const canDiscount = canApplyDiscounts(userRole);
  const canVoid = canVoidBills(userRole);

  const [managerAuthorized, setManagerAuthorized] = useState(false);
  const effectiveCanDiscount = canDiscount || managerAuthorized;
  const effectiveCanVoid = canVoid || managerAuthorized;

  useEffect(() => {
    fetchFromBackend();
  }, [fetchFromBackend]);

  // State
  const [orderType, setOrderType] = useState<OrderType>(posMode === 'cafe' ? 'TakeAway' : 'DineIn');
  const [packagingCharge, setPackagingCharge] = useState<number>(15);
  const [enablePackaging, setEnablePackaging] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>(initialTable);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('NotPaid');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [tokenNumber, setTokenNumber] = useState<number>(101);
  const [showBillHistory, setShowBillHistory] = useState<boolean>(false);

  // Draft Cart Store (Tenant Isolated)
  const drafts = useDraftCartStore((state) => state.drafts);
  const { saveDraft, clearDraft, getDraft } = useDraftCartStore();

  const activeCartKey = orderType === 'DineIn'
    ? `table:${tableNumber.trim().toUpperCase()}`
    : `channel:${orderType}`;

  // Sync draft or active table's ordered items into cart when activeCartKey changes
  useEffect(() => {
    const draft = getDraft(activeCartKey);
    if (draft && draft.items && draft.items.length > 0) {
      setCartItems(draft.items);
      setCustomerPhone(draft.customerPhone || '');
      setOrderNote(draft.orderNote || '');
      setDiscountPercent(draft.discountPercent || 0);
      if (draft.enablePackaging !== undefined) setEnablePackaging(draft.enablePackaging);
      if (draft.packagingCharge !== undefined) setPackagingCharge(draft.packagingCharge);
    } else if (orderType === 'DineIn') {
      const activeT = getTable(tableNumber);
      if (activeT && activeT.isOccupied && activeT.items && activeT.items.length > 0) {
        setCartItems(activeT.items);
        setCustomerPhone(activeT.customerPhone || '');
        setOrderNote('');
        setDiscountPercent(0);
      } else {
        setCartItems([]);
        setCustomerPhone('');
        setOrderNote('');
        setDiscountPercent(0);
      }
    } else {
      setCartItems([]);
      setCustomerPhone('');
      setOrderNote('');
      setDiscountPercent(0);
    }
  }, [activeCartKey, orderType, tableNumber, getTable, getDraft]);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isKotPrint, setIsKotPrint] = useState(false);
  const [latestKotNo, setLatestKotNo] = useState<string>('KOT-101');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);

  // Keyboard Hotkeys: F1 Cash, F2 Card, F3 UPI, F4 Split, Space Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Hotkeys for settlement are only active for Cashier/Manager/Owner
      if (canSettle) {
        if (e.key === 'F1') {
          e.preventDefault();
          setPaymentMode('Cash');
          setIsPaid(true);
          setIsKotPrint(false);
          if (cartItems.length > 0) setShowPrintModal(true);
        } else if (e.key === 'F2') {
          e.preventDefault();
          setPaymentMode('Card');
          setIsPaid(true);
          setIsKotPrint(false);
          if (cartItems.length > 0) setShowPrintModal(true);
        } else if (e.key === 'F3') {
          e.preventDefault();
          setPaymentMode('UPI');
          setIsPaid(true);
          setIsKotPrint(false);
          if (cartItems.length > 0) setShowPrintModal(true);
        } else if (e.key === 'F4') {
          e.preventDefault();
          if (cartItems.length > 0) setShowSplitModal(true);
        }
      }

      if (e.key === ' ') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-menu-search');
        if (searchInput) (searchInput as HTMLInputElement).focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, canSettle]);

  // Cafe Quick Beverage Modifiers
  const cafeModifiers = ['Extra Shot (+₹30)', 'Sugar Free', 'Oat Milk (+₹40)', 'Extra Ice', 'Less Sweet'];

  // Filter items by selected category, diet type, and search query
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }
    if (dietFilter === 'veg') {
      result = result.filter((item) => item.isVeg === true);
    } else if (dietFilter === 'non-veg') {
      result = result.filter((item) => item.isVeg === false);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, selectedCategory, dietFilter, searchQuery]);

  // Active Category Name
  const activeCategoryInfo = useMemo(() => {
    if (selectedCategory === 'all') {
      return { name: 'All Menu Items', icon: '🍽️' };
    }
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat ? { name: cat.name, icon: cat.icon || '🍽️' } : { name: 'Menu Items', icon: '🍽️' };
  }, [selectedCategory, categories]);

  // Cart operations with tenant-scoped draft persistence
  const handleCustomerPhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    saveDraft(activeCartKey, { customerPhone: phone });
  };

  const handleOrderNoteChange = (note: string) => {
    setOrderNote(note);
    saveDraft(activeCartKey, { orderNote: note });
  };

  const handleDiscountChange = (pct: number) => {
    setDiscountPercent(pct);
    saveDraft(activeCartKey, { discountPercent: pct });
  };

  const handlePackagingToggle = (checked: boolean) => {
    setEnablePackaging(checked);
    saveDraft(activeCartKey, { enablePackaging: checked });
  };

  const handlePackagingChargeSelect = (charge: number) => {
    setPackagingCharge(charge);
    saveDraft(activeCartKey, { packagingCharge: charge });
  };

  const addToCart = (item: MenuItemData) => {
    if (!item.isAvailable) {
      showToast(`"${item.name}" is currently Out of Stock.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item.id);
      const nextItems = existing
        ? prev.map((ci) =>
            ci.menuItemId === item.id
              ? { ...ci, quantity: ci.quantity + 1, totalPrice: (ci.quantity + 1) * ci.unitPrice }
              : ci
          )
        : [
            ...prev,
            {
              menuItemId: item.id,
              name: item.name,
              quantity: 1,
              unitPrice: item.price,
              totalPrice: item.price,
              isVeg: item.isVeg,
            },
          ];

      saveDraft(activeCartKey, {
        items: nextItems,
        customerPhone,
        orderNote,
        discountPercent,
      });
      return nextItems;
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) => {
      const nextItems = prev
        .map((item) => {
          if (item.menuItemId === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];

      saveDraft(activeCartKey, {
        items: nextItems,
        customerPhone,
        orderNote,
        discountPercent,
      });
      return nextItems;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => item.menuItemId !== itemId);
      saveDraft(activeCartKey, {
        items: nextItems,
        customerPhone,
        orderNote,
        discountPercent,
      });
      return nextItems;
    });
  };

  const addModifierToItem = (itemId: string, modifier: string) => {
    setCartItems((prev) => {
      const nextItems = prev.map((item) => {
        if (item.menuItemId === itemId) {
          const note = item.itemNote ? `${item.itemNote}, ${modifier}` : modifier;
          return { ...item, itemNote: note };
        }
        return item;
      });
      saveDraft(activeCartKey, {
        items: nextItems,
        customerPhone,
        orderNote,
        discountPercent,
      });
      return nextItems;
    });
    showToast(`Added modifier: ${modifier}`);
  };

  // Calculations with Optional Discount and Parcel Packaging Charge
  const effectivePackaging = orderType === 'Parcel' && enablePackaging ? packagingCharge : 0;
  const subTotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountAmount = Math.round((subTotal * discountPercent) / 100);
  const taxableAmount = Math.max(0, subTotal - discountAmount);
  const cgst = taxableAmount * 0.025;
  const sgst = taxableAmount * 0.025;
  const grandTotal = Math.round(taxableAmount + cgst + sgst + effectivePackaging);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getOrderDestination = () => {
    if (orderType === 'DineIn') return `Table ${tableNumber}`;
    if (orderType === 'TakeAway') return `Take Away Token #TK-${tokenNumber}`;
    if (orderType === 'Parcel') return `Parcel Token #PR-${tokenNumber}`;
    return `Delivery Token #DL-${tokenNumber}`;
  };

  const handleKOT = (print: boolean = false) => {
    if (cartItems.length === 0) {
      showToast('Please add items to cart before generating KOT.');
      return;
    }

    // 1. Determine already-sent quantities for this activeCartKey / table
    const currentDraft = getDraft(activeCartKey);
    const tableData = orderType === 'DineIn' ? getTable(tableNumber) : undefined;
    let alreadySent: Record<string, number> =
      currentDraft?.lastSentQuantities || tableData?.lastSentQuantities || {};

    // If active table is occupied with items but has no sent tracking yet (e.g. loaded from backend or waiter app),
    // initialize alreadySent from existing tableData.items so existing items are not re-sent
    if (
      Object.keys(alreadySent).length === 0 &&
      tableData?.isOccupied &&
      tableData.items &&
      tableData.items.length > 0 &&
      (!currentDraft || !currentDraft.lastSentQuantities)
    ) {
      const initialSent: Record<string, number> = {};
      tableData.items.forEach((it) => {
        initialSent[it.menuItemId] = (initialSent[it.menuItemId] || 0) + it.quantity;
      });
      alreadySent = initialSent;
    }

    // 2. Compute delta items: for each cartItem, delta qty = current qty - already-sent qty
    const deltaItems: OrderItem[] = [];
    cartItems.forEach((ci) => {
      const sentQty = alreadySent[ci.menuItemId] || 0;
      const deltaQty = ci.quantity - sentQty;
      if (deltaQty > 0) {
        deltaItems.push({
          ...ci,
          quantity: deltaQty,
          totalPrice: deltaQty * ci.unitPrice,
        });
      }
    });

    // 3. If delta is empty, show toast and do not create a new KOT
    if (deltaItems.length === 0) {
      showToast('No new items to send to kitchen');
      return;
    }

    const destination = getOrderDestination();

    // 4. Send ONLY deltaItems to KDS and backend OrderHub
    const newKot = usePosSyncStore.getState().addKOT({
      orderType,
      tableOrChannel: destination,
      tableNumber: orderType === 'DineIn' ? tableNumber : undefined,
      items: deltaItems,
    });
    setLatestKotNo(newKot.kotNo);

    // 5. Update sent-quantity tracking so it now matches the full current cartItems quantities
    const updatedSentMap: Record<string, number> = { ...alreadySent };
    cartItems.forEach((ci) => {
      updatedSentMap[ci.menuItemId] = Math.max(alreadySent[ci.menuItemId] || 0, ci.quantity);
    });

    // 6. Save full cart and updated sent quantities in draft and tableStore
    if (orderType === 'DineIn') {
      updateTableOrder(tableNumber, cartItems, grandTotal, updatedSentMap);
      saveDraft(activeCartKey, {
        items: cartItems,
        customerPhone,
        orderNote,
        discountPercent,
        lastSentQuantities: updatedSentMap,
      });
    } else {
      saveDraft(activeCartKey, {
        items: cartItems,
        customerPhone,
        orderNote,
        discountPercent,
        lastSentQuantities: updatedSentMap,
      });
    }

    showToast(`${newKot.kotNo} generated (${deltaItems.length} new item${deltaItems.length > 1 ? 's' : ''}) for ${destination} - Routed to Kitchen KDS! 🔔`);
    if (print) {
      setIsKotPrint(true);
      setShowPrintModal(true);
    }
  };

  const handleSaveBill = (action: string) => {
    if (!canSettle) {
      showToast('Permission Denied: Waiter account cannot settle bills. Please route to Cashier.');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Cart is empty. Please select items.');
      return;
    }

    const destination = getOrderDestination();
    // Record into posSyncStore for live Owner Sales, Z-Reports, and Inventory depletion
    usePosSyncStore.getState().recordSettledBill({
      orderType,
      tableOrToken: destination,
      totalAmount: grandTotal,
      taxAmount: cgst + sgst,
      discountAmount,
      paymentMode,
      cashierName: user?.fullName || user?.username || 'biller',
      items: cartItems,
    });

    if (action.includes('Print') || action.includes('EBill')) {
      setIsKotPrint(false);
      setShowPrintModal(true);
    } else {
      showToast(`Bill ${action} successfully! Total: ₹${grandTotal}`);
      if (orderType === 'DineIn') {
        vacateTable(tableNumber);
      }
      clearDraft(activeCartKey);
      setCartItems([]);
      setCustomerPhone('');
      setOrderNote('');
      setDiscountPercent(0);
      setTokenNumber((t) => t + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden select-none bg-[#f8fafc]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* LEFT & CENTER PANEL (Categories + Item Grid) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-r border-slate-200">
        {/* Left Category Navigation (Clean Blue Accents) */}
        <div className="w-full md:w-56 lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Categories</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {categories.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {/* All Items Option */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-3.5 py-3 text-xs font-semibold transition-all flex items-center justify-between touch-btn ${
                selectedCategory === 'all'
                  ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="text-base">🍽️</span>
                <span className="truncate">All Items</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 shrink-0 ${
                  selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {items.length}
              </span>
            </button>

            {/* Category list from Store */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = items.filter((i) => i.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3.5 py-3 text-xs font-semibold transition-all flex items-center justify-between touch-btn ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-1">
                    {cat.icon && <span className="text-sm shrink-0">{cat.icon}</span>}
                    <span className="line-clamp-2 leading-tight">{cat.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Items Grid */}
        <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden">
          {/* Search bar & Category Header */}
          <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-menu-search"
                type="text"
                placeholder="Search Item or Code (e.g. PBM, CB) [Press Space]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-slate-800"
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

            {/* Veg / Non-Veg Diet Filter */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setDietFilter('all')}
                className={`px-2.5 py-1.5 rounded-md transition text-[11px] font-bold ${
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
                className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1.5 text-[11px] font-bold ${
                  dietFilter === 'veg'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Show Vegetarian items"
              >
                <span className={`w-2 h-2 rounded-full ${dietFilter === 'veg' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Veg</span>
              </button>
              <button
                type="button"
                onClick={() => setDietFilter('non-veg')}
                className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1.5 text-[11px] font-bold ${
                  dietFilter === 'non-veg'
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
                title="Show Non-Vegetarian items"
              >
                <span className={`w-2 h-2 rounded-full ${dietFilter === 'non-veg' ? 'bg-white' : 'bg-rose-500'}`} />
                <span>Non-Veg</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBillHistory(true)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                title="View Settled Bills & Sales History"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>Bill History</span>
              </button>
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <span>{activeCategoryInfo.icon}</span>
                <span className="truncate max-w-[160px] sm:max-w-[200px]">{activeCategoryInfo.name}</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredItems.length} Items
              </span>
            </div>
          </div>

          {/* Quick Cafe Modifiers Bar in Cafe Mode */}
          {posMode === 'cafe' && (
            <div className="px-3 py-1.5 bg-blue-50/60 border-b border-blue-200/50 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="font-bold text-blue-900 shrink-0 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Modifiers:</span>
              </span>
              {cafeModifiers.map((mod) => (
                <button
                  key={mod}
                  onClick={() => {
                    if (cartItems.length > 0) {
                      addModifierToItem(cartItems[cartItems.length - 1].menuItemId, mod);
                    } else {
                      showToast('Select an item first to apply modifier');
                    }
                  }}
                  className="bg-white border border-blue-200 hover:bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap touch-btn shadow-2xs"
                >
                  + {mod}
                </button>
              ))}
            </div>
          )}

          {/* Grid of Items */}
          <div className="flex-1 p-3.5 overflow-y-auto">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
                  <Utensils className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">No menu items added yet</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  This restaurant does not have any dishes in its catalog. Ask your restaurant owner or manager to add items or bulk upload via Excel from the Owner Portal.
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <Utensils className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No matching items found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`bg-white border rounded-xl p-3 text-left shadow-2xs flex flex-col justify-between h-28 transition-all touch-btn group relative overflow-hidden ${
                      item.isAvailable
                        ? 'hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 hover:shadow-xs'
                        : 'opacity-60 bg-slate-100/60 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700">
                          {item.name}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            title={item.isVeg ? 'Veg' : 'Non-Veg'}
                          ></span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {item.code || `ITM-${item.id.slice(0, 3)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                      <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 font-bold px-1.5 py-0.5 rounded group-hover:bg-blue-600 group-hover:text-white transition">
                        + Add
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: CART & BILLING CHECKOUT (Role-Gated & Blue Themed) */}
      <div className="w-full md:w-[320px] lg:w-96 xl:w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xs md:sticky md:top-0 md:h-full md:overflow-y-auto">
        {/* Role Notice Banner */}
        {isWaiter ? (
          <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span>📱</span>
              <span>Waiter Mode (Order Taking & KOT Active)</span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-bold">
              KOT Only
            </span>
          </div>
        ) : userRole === 'Cashier' ? (
          <div className="p-2 bg-blue-50/70 border-b border-blue-100 text-blue-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span>🧾</span>
              <span>Cashier Terminal • Billing & Settlement</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center space-x-1 px-2 py-0.5 bg-white border border-blue-300 hover:bg-blue-100/70 text-blue-700 rounded-md text-[11px] font-bold transition shadow-2xs cursor-pointer"
                title="View Settled Invoices"
              >
                <History className="w-3 h-3 text-blue-600" />
                <span>History</span>
              </button>
              <span className="text-[10px] bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                Manager PIN Protected
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span>👑</span>
              <span>{userRole === 'Owner' ? 'Owner / Admin' : 'Store Manager'} Terminal</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center space-x-1 px-2 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-800 rounded-md text-[11px] font-bold transition shadow-2xs cursor-pointer"
                title="View Settled Invoices"
              >
                <History className="w-3 h-3 text-emerald-600" />
                <span>History</span>
              </button>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Full Access
              </span>
            </div>
          </div>
        )}

        {/* Order Type Tabs (Dine In / Take Away / Parcel / Delivery) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setOrderType('DineIn')}
            className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
              orderType === 'DineIn'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {strings.dineIn}
          </button>
          <button
            onClick={() => setOrderType('TakeAway')}
            className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
              orderType === 'TakeAway'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🛍️ {strings.takeAway}
          </button>
          <button
            onClick={() => setOrderType('Parcel')}
            className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
              orderType === 'Parcel'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            📦 {strings.parcel}
          </button>
          <button
            onClick={() => setOrderType('Delivery')}
            className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
              orderType === 'Delivery'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🛵 {strings.delivery}
          </button>
        </div>

        {/* Customer & Order Metadata Toolbar */}
        <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1">
            <button
              title="Add / Select Customer"
              onClick={() => {
                const phone = prompt('Enter Customer Mobile Number:');
                if (phone !== null) handleCustomerPhoneChange(phone);
              }}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 touch-btn"
            >
              <UserCheck className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Customer Phone / Name"
              value={customerPhone}
              onChange={(e) => handleCustomerPhoneChange(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              title="Order Note"
              onClick={() => {
                const note = prompt('Enter Order Note / Special Prep Instruction:', orderNote);
                if (note !== null) handleOrderNoteChange(note);
              }}
              className={`p-1.5 rounded-md border touch-btn ${
                orderNote ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600'
              }`}
            >
              <FileEdit className="w-4 h-4" />
            </button>

            {orderType === 'DineIn' ? (
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {tables.map((t) => {
                    const tKey = `TABLE:${t.tableNumber.trim().toUpperCase()}`;
                    const draft = drafts[tKey];
                    const draftQty = draft?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                    const draftTotal = draft?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

                    let statusLabel = '(Vacant)';
                    if (t.isOccupied) {
                      statusLabel = `(Occupied - ₹${t.orderTotal || 0})`;
                    } else if (draftQty > 0) {
                      statusLabel = `(Draft: ${draftQty} items - ₹${draftTotal})`;
                    }

                    return (
                      <option key={t.id} value={t.tableNumber}>
                        {t.tableNumber} {statusLabel}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  title="Shift to Another Table"
                  onClick={() => setShowShiftModal(true)}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 rounded text-[11px] font-bold flex items-center space-x-1 touch-btn"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Shift</span>
                </button>

                <button
                  type="button"
                  title="Merge into Another Table"
                  onClick={() => setShowMergeModal(true)}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-bold flex items-center space-x-1 touch-btn"
                >
                  <GitMerge className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Merge</span>
                </button>

                {getTable(tableNumber)?.isOccupied && effectiveCanVoid && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Vacate and clear Table ${tableNumber}?`)) {
                        vacateTable(tableNumber);
                        clearDraft(activeCartKey);
                        setCartItems([]);
                        setCustomerPhone('');
                        setOrderNote('');
                        setDiscountPercent(0);
                        showToast(`Table ${tableNumber} has been vacated and marked Vacant!`);
                      }
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-bold flex items-center space-x-1 touch-btn shadow-2xs"
                    title="Vacate Table"
                  >
                    <Trash2 className="w-3 h-3 text-slate-500" />
                    <span className="hidden sm:inline">Empty</span>
                  </button>
                )}

                {cartItems.length > 0 && !getTable(tableNumber)?.isOccupied && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Clear draft items for Table ${tableNumber}?`)) {
                        clearDraft(activeCartKey);
                        setCartItems([]);
                        setCustomerPhone('');
                        setOrderNote('');
                        setDiscountPercent(0);
                        showToast(`Draft cart cleared for Table ${tableNumber}.`);
                      }
                    }}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold flex items-center space-x-1 touch-btn shadow-2xs"
                    title="Clear Draft Cart"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
            ) : (
              <span className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-md flex items-center space-x-1.5 shadow-2xs ${
                orderType === 'TakeAway'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : orderType === 'Parcel'
                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}>
                <Ticket className="w-3.5 h-3.5" />
                <span>
                  {orderType === 'TakeAway'
                    ? `TK-${tokenNumber}`
                    : orderType === 'Parcel'
                    ? `PR-${tokenNumber}`
                    : `DL-${tokenNumber}`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Items Table Header */}
        <div className="grid grid-cols-12 px-3 py-2 bg-slate-100/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <div className="col-span-6">{strings.items}</div>
          <div className="col-span-3 text-center">{strings.qty}</div>
          <div className="col-span-3 text-right">{strings.price}</div>
        </div>

        {/* Cart Line Items or Empty State */}
        <div className="flex-1 overflow-y-auto p-2.5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                <Utensils className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">No Item Selected</p>
              <p className="text-xs text-slate-400 mt-1 text-center">
                Please Select Item from Left Menu Categories
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.menuItemId} className="py-2.5 px-1 grid grid-cols-12 items-center gap-1">
                  <div className="col-span-6">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">₹{item.unitPrice} each</p>
                    {item.itemNote && (
                      <p className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">
                        • {item.itemNote}
                      </p>
                    )}
                  </div>

                  <div className="col-span-3 flex items-center justify-center space-x-1">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 touch-btn"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 touch-btn"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="col-span-3 flex items-center justify-end space-x-2">
                    <span className="text-xs font-bold text-slate-900">₹{item.totalPrice}</span>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="text-slate-300 hover:text-rose-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Calculation & Summary (Role-gated discounts) */}
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
          {/* Subtotal & Discount Row */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal ({cartItems.length} items):</span>
            <span className="font-bold text-slate-800">₹{subTotal}</span>
          </div>

          {/* Discount Controls (Visible for Manager/Owner, Locked for Cashier, Hidden for Waiter) */}
          {!isWaiter && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-xs font-medium text-slate-600 flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                <span>Discount:</span>
              </span>

              {effectiveCanDiscount ? (
                <div className="flex items-center space-x-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleDiscountChange(pct)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition ${
                        discountPercent === pct
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  {managerAuthorized && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      PIN Unlocked
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowManagerPinModal(true)}
                  className="text-[10px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 transition touch-btn shadow-2xs"
                  title="Click to enter 4-digit Manager PIN"
                >
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>Unlock Discount (PIN)</span>
                </button>
              )}
            </div>
          )}

          {discountPercent > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Discount ({discountPercent}%):</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}

          {/* Packaging Fee Row for Parcel Orders */}
          {orderType === 'Parcel' && (
            <div className="flex items-center justify-between p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs">
              <label className="flex items-center space-x-1.5 font-bold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePackaging}
                  onChange={(e) => handlePackagingToggle(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>📦 Packaging Fee:</span>
              </label>
              {enablePackaging && (
                <div className="flex items-center space-x-1">
                  {[0, 10, 15, 20, 30].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePackagingChargeSelect(amt)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${
                        packagingCharge === amt
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <span className="text-xs font-black text-emerald-900 pl-1">+₹{packagingCharge}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              <span>CGST (2.5%) + SGST (2.5%): ₹{(cgst + sgst).toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">{strings.total}:</span>
              <span className="text-lg font-black text-slate-900">₹{grandTotal}</span>
            </div>
          </div>

          {/* Payment Modes Grid (HIDDEN FOR WAITER TO PREVENT UNAUTHORIZED CASH COLLECTION) */}
          {canSettle ? (
            <>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold pt-1">
                <button
                  onClick={() => {
                    setPaymentMode('Cash');
                    setIsPaid(true);
                  }}
                  className={`py-2 px-1 rounded-lg border text-center text-[11px] touch-btn flex items-center justify-center space-x-1 transition ${
                    paymentMode === 'Cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="flex flex-col items-center">
                    <span>{strings.cash}</span>
                    <span className="text-[9px] font-mono opacity-80">[F1]</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPaymentMode('Card');
                    setIsPaid(true);
                  }}
                  className={`py-2 px-1 rounded-lg border text-center text-[11px] touch-btn flex items-center justify-center space-x-1 transition ${
                    paymentMode === 'Card'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                  <div className="flex flex-col items-center">
                    <span>{strings.card}</span>
                    <span className="text-[9px] font-mono opacity-80">[F2]</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setPaymentMode('UPI');
                    setIsPaid(true);
                  }}
                  className={`py-2 px-1 rounded-lg border text-center text-[11px] touch-btn flex items-center justify-center space-x-1 transition ${
                    paymentMode === 'UPI'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <div className="flex flex-col items-center">
                    <span>UPI / QR</span>
                    <span className="text-[9px] font-mono opacity-80">[F3]</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (cartItems.length === 0) {
                      showToast('Cart is empty.');
                      return;
                    }
                    setShowSplitModal(true);
                  }}
                  className="py-2 px-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-center text-[11px] touch-btn flex items-center justify-center space-x-1 transition shadow-2xs"
                >
                  <Split className="w-3.5 h-3.5 text-amber-600" />
                  <div className="flex flex-col items-center">
                    <span>Split Bill</span>
                    <span className="text-[9px] font-mono text-amber-600">[F4]</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Mark as Paid Immediately</span>
                </label>
              </div>
            </>
          ) : (
            <div className="p-2 bg-slate-100 rounded-lg text-center text-[11px] text-slate-500 font-medium">
              🔒 Bill Settlement & Payment buttons are managed by the Cashier
            </div>
          )}
        </div>

        {/* Action Buttons: Dynamically Adapts to Role */}
        <div className="p-3 border-t border-slate-200 bg-white">
          {isWaiter ? (
            /* WAITER ACTION: Primary focus is sending order to Kitchen KDS */
            <div className="space-y-2">
              <button
                onClick={() => handleKOT(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl text-sm font-black flex items-center justify-center space-x-2 shadow-sm touch-btn transition"
              >
                <Utensils className="w-4 h-4" />
                <span>Send KOT to Kitchen</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleKOT(true)}
                  className="bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 touch-btn transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>KOT & Print</span>
                </button>
                <button
                  onClick={() => showToast('Order parked on Hold')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold touch-btn transition"
                >
                  {strings.hold}
                </button>
              </div>
            </div>
          ) : (
            /* CASHIER / MANAGER / OWNER ACTIONS: Full Billing Settlement */
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleSaveBill('Saved')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-lg text-xs font-bold touch-btn shadow-xs transition"
              >
                {strings.save}
              </button>
              <button
                onClick={() => handleSaveBill('Saved & Printed')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-lg text-xs font-bold touch-btn shadow-xs transition"
              >
                {strings.savePrint}
              </button>
              <button
                onClick={() => handleSaveBill('Saved & EBilled')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-lg text-xs font-bold touch-btn shadow-xs transition"
              >
                {strings.saveEbill}
              </button>

              <button
                onClick={() => handleKOT(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold touch-btn transition"
              >
                {strings.kot}
              </button>
              <button
                onClick={() => handleKOT(true)}
                className="bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold touch-btn transition"
              >
                {strings.kotPrint}
              </button>
              <button
                onClick={() => showToast('Order parked on Hold')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg text-xs font-bold touch-btn transition"
              >
                {strings.hold}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bill & Thermal Receipt Modal */}
      <BillPrintModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          if (!isKotPrint) {
            if (orderType === 'DineIn') {
              vacateTable(tableNumber);
            }
            clearDraft(activeCartKey);
            setCartItems([]);
            setCustomerPhone('');
            setOrderNote('');
            setDiscountPercent(0);
            setTokenNumber((t) => t + 1);
          }
          setIsKotPrint(false);
        }}
        orderType={orderType}
        items={cartItems}
        subTotal={subTotal}
        cgst={cgst}
        sgst={sgst}
        grandTotal={grandTotal}
        packagingCharge={effectivePackaging}
        kotNumber={latestKotNo}
        tableNumber={orderType === 'DineIn' ? tableNumber : undefined}
        customerPhone={customerPhone}
        paymentMode={paymentMode}
      />

      {/* Split Bill Modal */}
      <SplitBillModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        grandTotal={grandTotal}
        items={cartItems}
        onSplitComplete={(splits) => {
          const destination = orderType === 'DineIn' ? `Table ${tableNumber}` : `${orderType} Token #${tokenNumber}`;
          usePosSyncStore.getState().recordSettledBill({
            orderType,
            tableOrToken: destination,
            totalAmount: grandTotal,
            taxAmount: cgst + sgst,
            discountAmount,
            paymentMode: 'Split',
            cashierName: user?.fullName || user?.username || 'biller',
            items: cartItems,
          });

          showToast(`Split Payment Completed! ${splits.map((s) => `${s.mode}: ₹${s.amount}`).join(', ')}`);
          if (orderType === 'DineIn') {
            vacateTable(tableNumber);
          }
          clearDraft(activeCartKey);
          setCartItems([]);
          setCustomerPhone('');
          setOrderNote('');
          setDiscountPercent(0);
          setTokenNumber((t) => t + 1);
        }}
      />

      {/* Table Merge Modal */}
      {showMergeModal && (
        <TableMergeModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          initialSourceTableNumber={tableNumber}
          onMergeSuccess={(targetTable) => {
            setTableNumber(targetTable);
            showToast(`Tables merged into Table ${targetTable}!`);
          }}
        />
      )}

      {/* Table Shift Modal */}
      {showShiftModal && (
        <TableShiftModal
          isOpen={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          sourceTableNumber={tableNumber}
          onShiftSuccess={(newTable) => {
            setTableNumber(newTable);
            showToast(`Order shifted to Table ${newTable}!`);
          }}
        />
      )}

      {/* Manager Authorization PIN Modal */}
      {showManagerPinModal && (
        <ManagerPinModal
          isOpen={showManagerPinModal}
          onClose={() => setShowManagerPinModal(false)}
          onAuthorize={() => {
            setManagerAuthorized(true);
            showToast('Manager Authorization Approved! Discounts unlocked.');
          }}
          actionTitle="Manager Authorization for Discounts"
        />
      )}

      {/* Bill History & Settled Invoices Modal */}
      {showBillHistory && (
        <BillHistoryModal
          isOpen={showBillHistory}
          onClose={() => setShowBillHistory(false)}
        />
      )}
    </div>
  );
};
