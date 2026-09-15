import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  Sliders,
  Receipt,
  ShieldCheck,
  Users,
  Megaphone,
  Tag,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Search,
  Bell,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clearAllAuthSessions } from '../../utils/authSession';

export const SuperAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = () => {
    clearAllAuthSessions();
    navigate('/login', { replace: true });
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    // Navigate to tenant search or global search destination
    navigate(`/superadmin/tenants?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  const navItems = [
    { label: 'Overview', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Restaurants', path: '/superadmin/tenants', icon: Building2 },
    { label: 'Plans Catalog', path: '/superadmin/plans-catalog', icon: Package },
    { label: 'Tenant Plans', path: '/superadmin/subscriptions', icon: CreditCard },
    { label: 'Feature Toggles', path: '/superadmin/features', icon: Sliders },
    { label: 'Billing & Invoices', path: '/superadmin/billing', icon: Receipt },
    { label: 'Audit Trail', path: '/superadmin/audit-logs', icon: ShieldCheck },
    { label: 'Admin Team', path: '/superadmin/team', icon: Users },
    { label: 'Announcements', path: '/superadmin/announcements', icon: Megaphone },
    { label: 'Coupons', path: '/superadmin/coupons', icon: Tag },
    { label: 'Analytics', path: '/superadmin/analytics', icon: BarChart3 },
    { label: 'System Health', path: '/superadmin/system-health', icon: Activity },
    { label: 'Settings', path: '/superadmin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. TOP HEADER BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-2 sm:px-4 h-16 flex items-center justify-between gap-4 shadow-2xs">
        {/* Left: Brand + Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => navigate('/superadmin/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">QuantroBill</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-medium">Enterprise Platform Control</p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <form
          onSubmit={handleGlobalSearchSubmit}
          className="hidden md:flex items-center flex-1 max-w-md mx-4"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search tenants, invoices, audit logs..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
        </form>

        {/* Right: Actions, Notification, Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="/demo.html"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 shadow-2xs"
            title="Interactive Demo"
          >
            <span>🌐</span>
            <span>Demo Portal</span>
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </a>

          {/* Notification Bell */}
          <button
            onClick={() => navigate('/superadmin/announcements')}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Platform Announcements & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Quick Help */}
          <button
            onClick={() => navigate('/superadmin/system-health')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="System Diagnostics"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Admin User Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName || user?.username || 'SuperAdmin'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                {user?.email || 'admin@quantromind.com'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg transition cursor-pointer border border-rose-200 shadow-2xs ml-1"
            title="Sign Out of SuperAdmin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. HORIZONTAL SUB-NAV ROW (Matching Reference Screenshot Top Tabs) */}
      <nav className="bg-white border-b border-slate-200 px-2 sm:px-4 sticky top-16 z-30 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-100/80 text-amber-950 border border-amber-300/80 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col justify-between z-50">
            <div>
              <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-base">QuantroBill</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-center">
              <p className="text-xs font-bold text-slate-700">QuantroBill SaaS v2.0</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Isolated Security Boundary</p>
            </div>
          </aside>
        </div>
      )}

      {/* 4. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 w-full px-2 sm:px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
};
