import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthStore, getHomeRouteForRole } from '../store/authStore';
import type { AuthResponse } from '../types';
import {
  Lock,
  User,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { MustChangePasswordModal } from '../components/modals/MustChangePasswordModal';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated, user } = useAuthStore();

  const [loginMode, setLoginMode] = useState<'password' | 'pin'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // If already authenticated and not requiring password reset, redirect to role workspace
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.mustChangePassword) {
        setShowPasswordModal(true);
      } else {
        const homeRoute = getHomeRouteForRole(user.role);
        navigate(homeRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const cleanIdentifier = identifier.trim();

    try {
      let response;
      if (loginMode === 'password') {
        response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
          identifier: cleanIdentifier,
          password,
        });
      } else {
        // PIN login for POS terminals
        const savedOutlet = localStorage.getItem('quantrobill_active_outlet');
        let outletId: string | undefined;
        if (savedOutlet) {
          try {
            outletId = JSON.parse(savedOutlet)?.id;
          } catch {
            outletId = undefined;
          }
        }

        response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/pin-login', {
          pin: pin.trim(),
          outletId,
        });
      }

      if (response.data?.success && response.data.data) {
        const authData = response.data.data;
        setAuthData(authData);

        if (authData.mustChangePassword || authData.user?.mustChangePassword) {
          setShowPasswordModal(true);
          return;
        }

        const targetRoute = getHomeRouteForRole(authData.user.role);
        navigate(targetRoute, { replace: true });
        return;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userIdent: string, userPass: string) => {
    setIdentifier(userIdent);
    setPassword(userPass);
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
        identifier: userIdent,
        password: userPass,
      });

      if (response.data?.success && response.data.data) {
        const authData = response.data.data;
        setAuthData(authData);
        const route = getHomeRouteForRole(authData.user.role);
        navigate(route, { replace: true });
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please verify server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-800">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 mb-3 font-black text-2xl">
            Q
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            QuantroBill <span className="text-blue-600">POS</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Universal Workspace & Multi-Tenant Restaurant Portal
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
            <span>Single Sign-On for SuperAdmin, Owners & Staff</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              onClick={() => setLoginMode('password')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                loginMode === 'password'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMode('pin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                loginMode === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quick Staff PIN
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'password' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. admin@quantromind.com"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Enter 4-Digit Staff PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg tracking-widest text-center rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-1 font-medium">
                  Instant login for floor terminal cashiers & stewards (Default: 1234)
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In & Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Role Quick Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              1-Click Instant Role Login & Testing
            </p>

            <div className="flex flex-col gap-2">
              {/* SuperAdmin SaaS Quick Login */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@quantromind.com', 'Quantromind@#9100')}
                className="w-full p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-left transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">SuperAdmin Platform</span>
                    <span className="text-[10px] text-purple-700 block">admin@quantromind.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-purple-600 bg-purple-100/80 px-2 py-0.5 rounded-md">Fill & Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Portal Direct Links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          <Link to="/owner/login" className="hover:text-blue-600 transition flex items-center gap-1">
            <span>👑</span>
            <span>Owner Portal Login</span>
          </Link>
          <span className="text-slate-300">•</span>
          <Link to="/superadmin/login" className="hover:text-blue-600 transition flex items-center gap-1">
            <span>⚡</span>
            <span>SuperAdmin Login</span>
          </Link>
        </div>

        {/* Multi-Tenant Security Footnote */}
        <div className="text-center mt-3 text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Multi-tenant data partitioning enabled via MongoDB Atlas</span>
        </div>
      </div>

      <MustChangePasswordModal
        isOpen={showPasswordModal}
        onSuccess={() => {
          setShowPasswordModal(false);
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.role) {
            navigate(getHomeRouteForRole(currentUser.role), { replace: true });
          }
        }}
      />
    </div>
  );
};
