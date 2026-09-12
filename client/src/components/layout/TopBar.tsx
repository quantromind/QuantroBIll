import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Grid3X3,
  Search,
  ChevronDown,
  LogOut,
  Utensils,
  Receipt,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  Radio,
  Download,
  Languages,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/langStore';
import type { UserRole } from '../../types';
import {
  ReprintModal,
  HelpModal,
  ModalWrapper,
} from '../modals/OperationsModals';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, activeOutlet, availableOutlets, setActiveOutlet, toggleDrawer, logout, switchRole } = useAuthStore();
  const { currentLang, setLanguage } = useLangStore();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Top Bar Modals
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  const activeRole: UserRole = user?.role || 'Cashier';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const q = globalSearch.trim();
    if (/^\d+$/.test(q)) {
      navigate(`/online-orders?billNo=${encodeURIComponent(q)}`);
    } else if (/^T-?\d+/i.test(q)) {
      navigate(`/billing?table=${encodeURIComponent(q.toUpperCase())}`);
    } else {
      navigate(`/billing?search=${encodeURIComponent(q)}`);
    }
  };

  const navTabs = [
    { label: 'POS Billing', path: '/billing', icon: Receipt },
    { label: 'Tables Floor', path: '/tables', icon: Grid3X3 },
    { label: 'Kitchen KDS', path: '/kds', icon: Radio },
    { label: 'Orders & History', path: '/online-orders', icon: Clock },
    { label: 'Menu & Stock', path: '/menu-manager', icon: Utensils },
    { label: 'Reports', path: '/owner/analytics', icon: BarChart3 },
    { label: 'Staff & Roles', path: '/owner/employees', icon: Users },
  ];

  const filteredNavTabs = navTabs.filter((tab) => {
    if (activeRole === 'Waiter') {
      return tab.path === '/billing' || tab.path === '/tables' || tab.path === '/kds';
    }
    if (activeRole === 'Cashier') {
      return tab.path === '/billing' || tab.path === '/tables' || tab.path === '/kds' || tab.path === '/online-orders';
    }
    return true;
  });

  const roleLabels: Record<string, { label: string; icon: string; badge: string }> = {
    Owner: { label: 'Owner / Admin', icon: '👑', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    SuperAdmin: { label: 'SuperAdmin', icon: '⚡', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    Manager: { label: 'Store Manager', icon: '👔', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    Cashier: { label: 'Cashier (Biller)', icon: '🧾', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Waiter: { label: 'Waiter (Steward)', icon: '📱', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    KitchenStaff: { label: 'Kitchen Chef', icon: '👨‍🍳', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const currentRoleInfo = roleLabels[activeRole] || roleLabels.Cashier;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs select-none">
      {/* Top Utility Micro-Bar */}
      <div className="bg-[#f8fafc] border-b border-slate-200/80 px-4 py-1 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-semibold text-slate-800">{tenant?.businessName || 'QuantroBill Restaurant POS'}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{activeOutlet?.name || 'Main Wakad Branch'}</span>
          </div>

          {availableOutlets.length > 1 && (
            <div className="relative inline-block">
              <button
                onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                className="bg-white border border-slate-200 hover:border-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 flex items-center space-x-1 transition shadow-2xs"
              >
                <span>Switch Outlet</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showOutletDropdown && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                  {availableOutlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => {
                        setActiveOutlet(outlet);
                        setShowOutletDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                        activeOutlet?.id === outlet.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{outlet.name}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{outlet.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Right: Live Role Switcher + Language + Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Real-Time Role Switcher Badge */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold transition-all shadow-2xs ${currentRoleInfo.badge}`}
              title="Click to switch active role for testing permissions"
            >
              <span>{currentRoleInfo.icon}</span>
              <span>Role: {currentRoleInfo.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Role to Preview UI:
                </div>
                {(['Owner', 'Manager', 'Cashier', 'Waiter'] as UserRole[]).map((r) => {
                  const info = roleLabels[r];
                  const isSelected = activeRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center space-x-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Languages className="w-3 h-3 text-blue-600" />
              <span className="uppercase">{currentLang === 'en' ? 'EN' : currentLang === 'mr' ? 'MR' : 'HI'}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs font-medium">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setShowLangDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('mr');
                    setShowLangDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Marathi
                </button>
                <button
                  onClick={() => {
                    setLanguage('hi');
                    setShowLangDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Hindi
                </button>
              </div>
            )}
          </div>

          {/* Store Status Pill */}
          <button
            onClick={() => setShowStoreModal(true)}
            className={`flex items-center font-bold text-[11px] px-2.5 py-0.5 rounded-full border transition-colors shadow-2xs ${
              isStoreOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>{isStoreOpen ? 'Store Open' : 'Store Closed'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar (Clean horizontal tabs matching reference CRM screenshot) */}
      <div className="px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
        {/* Brand & Horizontal Navigation Tabs */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={toggleDrawer}
            title="Open Menu"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 touch-btn flex items-center justify-center border border-slate-200 mr-1"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Brand Logo (Royal Blue Accent) */}
          <div
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1.5 cursor-pointer select-none bg-blue-600 text-white px-2.5 py-1.5 rounded-lg shadow-xs hover:bg-blue-700 transition mr-2"
          >
            <div className="w-5 h-5 rounded bg-white text-blue-600 flex items-center justify-center text-xs font-black">Q</div>
            <span className="font-bold tracking-tight text-xs sm:text-sm">
              QuantroBill <span className="text-sky-200 font-semibold text-[11px]">POS</span>
            </span>
          </div>

          {/* Horizontal Tabs with Soft Pill Active State (Reference CRM style) */}
          <div className="flex items-center space-x-1">
            {filteredNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap touch-btn ${
                    isActive
                      ? 'bg-sky-50 text-blue-700 border border-sky-200 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tools: Global Search + Backup + Logout */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Universal Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Orders, Tables, Code..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg w-44 lg:w-56 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-slate-50 focus:bg-white text-slate-700"
            />
          </form>

          {/* Backup / Export Quick Action Pill (Reference CRM style) */}
          <button
            onClick={() => setShowRecentModal(true)}
            title="Recent Bills & Backup Export"
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-blue-700 text-xs font-semibold touch-btn shadow-2xs transition"
          >
            <Download className="w-3 h-3 text-blue-600" />
            <span>Recent / Sync</span>
          </button>

          {/* Clean Logout Pill Button (Reference CRM style: subtle red outline) */}
          <button
            onClick={logout}
            title="Logout"
            className="flex items-center space-x-1 px-3 py-1 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold touch-btn shadow-2xs transition"
          >
            <LogOut className="w-3 h-3 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Top Bar Modals */}
      <ReprintModal isOpen={showRecentModal} onClose={() => setShowRecentModal(false)} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Store Status Modal */}
      {showStoreModal && (
        <ModalWrapper
          isOpen={showStoreModal}
          icon={<Store className="w-5 h-5 text-blue-600" />}
          title="Store Timing & Operations Status"
          onClose={() => setShowStoreModal(false)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Toggle live acceptance for Dining Tables, Online Zomato/Swiggy orders, and Direct Pickups.
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800">Master Store Acceptance</span>
                <p className="text-slate-400 text-[11px]">Enables kitchen KOT generation and bill registration.</p>
              </div>
              <button
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition ${
                  isStoreOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isStoreOpen ? 'Store is OPEN' : 'Store is CLOSED'}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </header>
  );
};
