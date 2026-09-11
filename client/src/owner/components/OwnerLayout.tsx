import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  BarChart2,
  FileText,
  DollarSign,
  Users,
  Package,
  Printer,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Store,
} from 'lucide-react';
import { useOwnerAuthStore } from '../store/ownerAuthStore';

export const OwnerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useOwnerAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  // Exactly matching the sidebar from Screenshot 2
  const navItems = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Menu', path: '/owner/menu', icon: Utensils },
    { label: 'Sales', path: '/owner/sales', icon: BarChart2 },
    { label: 'Reports', path: '/owner/reports', icon: FileText },
    { label: 'Expenses', path: '/owner/expenses', icon: DollarSign },
    { label: 'Employee Login', path: '/owner/employees', icon: Users, badge: 'Staff' },
    { label: 'Inventory', path: '/owner/inventory', icon: Package, badge: 'Stock' },
    { label: 'Bill & Receipt', path: '/owner/receipt', icon: Printer },
    { label: 'Guest-visit customers', path: '/owner/customers', icon: UserCheck },
    { label: 'Credit Customers', path: '/owner/credit', icon: CreditCard },
    { label: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Top Bar (Clean Executive Royal Blue CRM Style) */}
      <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-md text-slate-700 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Restaurant Identity Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center tracking-wider shadow-xs">
              RR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 tracking-tight uppercase">
                  {user?.restaurantName || 'RR RESTAURANT'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Owner Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bar Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="/demo.html"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition"
          >
            <span>🌐</span>
            <span>Interactive Demo & Flow</span>
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </a>

          <a
            href="/billing"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition"
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Launch POS Billing</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user?.name || 'Ajay Yadav'}</p>
              <p className="text-[10px] text-slate-500">{user?.email || 'owner@rrrestaurant.com'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-300 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Clean Executive Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-20 w-60 bg-white border-r border-slate-200 pt-14 md:pt-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Management Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-2xs'
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/80 text-center">
            <p className="text-[11px] font-bold text-slate-800">PetBharke POS SaaS</p>
            <p className="text-[10px] text-blue-600 font-medium">Executive Tier</p>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-10 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
