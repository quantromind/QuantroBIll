import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useSuperAdminAuthStore } from '../store/superAdminAuthStore';
import { clearAllAuthSessions } from '../../utils/authSession';

export const SuperAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSuperAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAllAuthSessions();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Overview Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Restaurants & Tenants', path: '/superadmin/tenants', icon: Building2 },
    { label: 'Subscription Plans', path: '/superadmin/subscriptions', icon: CreditCard },
    { label: 'Feature Flags & Toggles', path: '/superadmin/features', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">QuantroBill</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Central Multi-Tenant Platform Management</p>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="/demo.html"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 shadow-2xs"
          >
            <span>🌐</span>
            <span>Interactive Demo & Flow</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          </a>

          <button
            onClick={() => navigate('/billing')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200 shadow-2xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Launch POS Billing</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <button
            onClick={() => navigate('/owner/dashboard')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer"
          >
            <span>Owner Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'SuperAdmin'}</p>
              <p className="text-[10px] text-slate-400">{user?.email || 'admin@quantrobill.com'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-100"
              title="Sign Out of SuperAdmin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 pt-16 md:pt-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Platform Administration
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center">
            <p className="text-[11px] font-bold text-slate-700">QuantroBill Multi-Tenant SaaS v2.0</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Isolated Security Boundary</p>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/30 z-10 md:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
