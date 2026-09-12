import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ReceiptText,
  SlidersHorizontal,
  BarChart2,
  Radio,
  LogOut,
  Grid3X3,
  Utensils,
  Banknote,
  Monitor,
  Printer
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLangStore } from '../../store/langStore';
import { clearAllAuthSessions } from '../../utils/authSession';

export const NavigationDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeOutlet, drawerOpen, setDrawerOpen } = useAuthStore();
  const { t } = useLangStore();
  const strings = t();

  if (!drawerOpen) return null;

  const handleNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const navItems = [
    { label: strings.newOrder + ' / ' + 'Standard POS Billing', path: '/billing', icon: ReceiptText },
    { label: strings.orders + ' (Zomato / Swiggy)', path: '/online-orders', icon: Monitor },
    { label: 'Tables & Floor Plan Matrix', path: '/tables', icon: Grid3X3 },
    { label: 'Menu Catalog & Availability', path: '/menu-manager', icon: Utensils },
    { label: 'Finance & Shift Cash Flow', path: '/finance', icon: Banknote },
    { label: strings.liveView + ' (Kitchen KDS)', path: '/kds', icon: Radio },
    { label: strings.reports + ' & Analytics', path: '/reports', icon: BarChart2 },
    { label: 'Receipt & Printer Settings', path: '/receipt-settings', icon: Printer },
    { label: strings.operations, path: '/operations', icon: SlidersHorizontal },
  ];

  const isOwnerOrManager =
    role === 'Owner' ||
    role === 'Admin' ||
    role === 'Manager' ||
    user?.role === 'Owner' ||
    user?.role === 'Admin' ||
    user?.role === 'Manager';

  const isSuperAdmin = role === 'SuperAdmin' || user?.role === 'SuperAdmin';

  const filteredNavItems = navItems.filter((item) => {
    if (role === 'Waiter') {
      return item.path === '/billing' || item.path === '/tables' || item.path === '/kds';
    }
    return true;
  });

  const handleLogout = () => {
    setDrawerOpen(false);
    clearAllAuthSessions();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-xs"
      />

      {/* Slide Drawer Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#1e293b] text-slate-200 z-50 shadow-2xl flex flex-col justify-between select-none animate-in slide-in-from-left duration-200">
        <div className="overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 bg-[#0f172a] sticky top-0 z-10">
            <h2 className="text-base font-bold text-white tracking-wide">QuantroBill POS Navigation</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 touch-btn cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Cross-Portal Jump Links for Management */}
          {(isOwnerOrManager || isSuperAdmin) && (
            <div className="p-3 pb-0 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Management Portals
              </div>
              {isOwnerOrManager && (
                <button
                  onClick={() => handleNav('/owner/dashboard')}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:bg-purple-900/40 transition-colors touch-btn cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>👑</span>
                    <span>Restaurant Owner Portal</span>
                  </span>
                  <span className="text-[10px] bg-purple-800 text-purple-100 px-1.5 py-0.5 rounded font-mono">
                    Owner
                  </span>
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => handleNav('/superadmin/dashboard')}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/40 transition-colors touch-btn cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>SuperAdmin Platform</span>
                  </span>
                  <span className="text-[10px] bg-indigo-800 text-indigo-100 px-1.5 py-0.5 rounded font-mono">
                    SaaS
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              POS Workspaces
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors touch-btn cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-700/40">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors touch-btn cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{strings.logout}</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer Meta */}
        <div className="p-4 border-t border-slate-700/60 bg-[#0f172a] text-xs text-slate-400 space-y-1">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span>Ref ID : <strong className="text-slate-200">{activeOutlet?.code || 'A443077R'}</strong></span>
            <span>Version : <strong className="text-slate-200">123.0.1</strong></span>
          </div>
          <div className="pt-1 text-[11px]">
            <span>Biller Name : <strong className="text-white capitalize">{user?.fullName || user?.username || 'biller'}</strong></span>
          </div>
        </div>
      </div>
    </>
  );
};
