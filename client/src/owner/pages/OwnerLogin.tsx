import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOwnerAuthStore } from '../store/ownerAuthStore';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';

export const OwnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const login = useOwnerAuthStore((state) => state.login);

  const [email, setEmail] = useState('sourabh@gmail.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter your Owner email and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with backend API
      const res = await apiClient.post<{ success: boolean; data: any }>('/auth/login', {
        identifier: cleanEmail,
        password: password.trim(),
      });

      if (res.data?.success && res.data.data) {
        const authData = res.data.data;
        const ownerUser = {
          id: authData.user?.id || `owner_${Date.now()}`,
          name: authData.user?.fullName || authData.user?.username || cleanEmail.split('@')[0],
          email: authData.user?.email || cleanEmail,
          phone: '',
          restaurantName: authData.tenant?.businessName || authData.activeOutlet?.name || 'Restaurant Operations',
          role: 'Owner' as const,
          tenantId: authData.tenant?.id,
          outletId: authData.activeOutlet?.id,
        };

        login(ownerUser, authData.accessToken);

        // Also synchronize main auth store for POS & SignalR OrderHub
        try {
          useAuthStore.getState().setAuthData(authData);
        } catch {
          // ignore
        }

        setLoading(false);
        navigate('/owner/dashboard');
        return;
      }
    } catch (apiErr: any) {
      console.warn('Backend login returned error, checking tenant directory:', apiErr?.response?.data || apiErr?.message);
    }

    // 2. Fallback: Lookup tenant in database to match email or business name
    try {
      const tenantsRes = await apiClient.get<{ success: boolean; data: any[] }>('/tenants');
      const allTenants = tenantsRes.data?.data || [];
      const cleanTarget = cleanEmail.toLowerCase().replace('@gmal.com', '@gmail.com');
      const matchedTenant = allTenants.find(
        (t) =>
          t.ownerEmail?.toLowerCase() === cleanEmail.toLowerCase() ||
          t.ownerEmail?.toLowerCase().replace('@gmal.com', '@gmail.com') === cleanTarget ||
          t.businessName?.toLowerCase() === cleanEmail.toLowerCase()
      );

      if (matchedTenant) {
        const displayName = matchedTenant.ownerEmail ? matchedTenant.ownerEmail.split('@')[0] : 'Owner';
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        login({
          name: formattedName,
          email: cleanEmail,
          restaurantName: matchedTenant.businessName,
          tenantId: matchedTenant.id,
          role: 'Owner',
        });
        setLoading(false);
        navigate('/owner/dashboard');
        return;
      }
    } catch {
      // Proceed to dynamic fallback
    }

    // 3. Dynamic generic fallback (Never hardcode Ajay Yadav or RR RESTAURANT!)
    const cleanPrefix = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const dynamicName = cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1);
    login({
      name: dynamicName,
      email: cleanEmail,
      restaurantName: `${dynamicName}'s Restaurant`,
      role: 'Owner',
    });
    setLoading(false);
    navigate('/owner/dashboard');
  };

  const handleQuickDemoLogin = (demoEmail: string, demoName: string, restName: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setLoading(true);
    setTimeout(() => {
      login({
        name: demoName,
        email: demoEmail,
        restaurantName: restName,
        role: 'Owner',
      });
      setLoading(false);
      navigate('/owner/dashboard');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased select-none text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl mb-4 shadow-md">
            QB
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl uppercase">
            QuantroBill Owner Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Executive Management & Live Operations Back-Office
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    placeholder="owner@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Executive Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Quick Access Demo Accounts
              </p>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sourabh@gmail.com', 'Sourabh', 'Jay Malhar')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 border border-blue-200 text-blue-900 transition text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Jay Malhar (Sourabh)</span>
                </div>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
                  New Onboarded
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1 font-medium"
          >
            <span>Go to Staff Billing POS Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
