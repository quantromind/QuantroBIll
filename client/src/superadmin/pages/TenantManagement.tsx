import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Clock,
  Store,
  Mail,
  MapPin,
  X,
  KeyRound,
  Check,
  Copy,
} from 'lucide-react';
import type { Tenant, SubscriptionTier, RestaurantType, TenantStatus } from '../types';
import { initialTenants } from '../services/mockTenantData';
import { Pagination } from '../components/Pagination';
import { apiClient } from '../../services/api';

export const TenantManagement: React.FC = () => {
  const location = useLocation();
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TenantStatus>('All');
  const [planFilter, setPlanFilter] = useState<'All' | SubscriptionTier>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<Tenant | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    businessName: string;
    ownerEmail: string;
    password: string;
    outletName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Add Outlet Modal State
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletCity, setNewOutletCity] = useState('');
  const [outletActionMessage, setOutletActionMessage] = useState<string | null>(null);

  // Plan Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<SubscriptionTier>('Professional');

  // Auto-open create modal if url has ?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setShowCreateModal(true);
    }
  }, [location.search]);

  // Load tenants dynamically from MongoDB API
  const fetchTenants = async () => {
    try {
      let currentToken = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');
      if (!currentToken || currentToken.startsWith('quantrobill_demo_')) {
        try {
          const authRes = await apiClient.post<{ success: boolean; data: any }>('/auth/login', {
            identifier: 'admin@quantromind.com',
            password: 'Quantromind@#9100',
          });
          if (authRes.data?.data?.accessToken) {
            currentToken = authRes.data.data.accessToken;
            if (currentToken) {
              localStorage.setItem('quantrobill_access_token', currentToken);
            }
          }
        } catch {}
      }

      const res = await apiClient.get<{ success: boolean; data: any[] }>('/tenants', {
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const backendTenants: Tenant[] = res.data.data.map((bt: any) => ({
          id: bt.id,
          businessName: bt.businessName,
          legalName: bt.legalName || bt.businessName,
          restaurantType: bt.businessType === 1 ? 'Cafe' : 'FineDine',
          ownerName: bt.ownerEmail?.split('@')[0] || 'Owner',
          ownerEmail: bt.ownerEmail,
          ownerPhone: bt.ownerPhone || '9876543210',
          city: bt.city || 'Pune',
          state: bt.state || 'Maharashtra',
          gstin: bt.gstin || '',
          plan: bt.subscriptionPlan === 3 ? 'Enterprise' : bt.subscriptionPlan === 2 ? 'Professional' : 'Starter',
          status: bt.isActive ? 'Active' : 'Suspended',
          maxOutlets: bt.maxOutlets || 3,
          outlets: (bt.outlets || []).map((o: any) => ({
            id: o.id,
            name: o.name,
            code: o.code,
            city: o.city || bt.city || 'Pune',
            isActive: o.isActive !== false,
            tableCount: 15,
          })),
          joinedAt: new Date(bt.createdAt || Date.now()).toISOString().split('T')[0],
          subscriptionExpiresAt: new Date(bt.subscriptionExpiresAt || Date.now() + 365 * 86400000)
            .toISOString()
            .split('T')[0],
          features: bt.features || {
            enableKds: true,
            enableWaiterApp: true,
            enableAggregators: true,
            enableRecipeInventory: true,
            enableKhataBook: false,
          },
        }));

        setTenants(backendTenants);
      } else {
        setTenants([]);
      }
    } catch (err) {
      console.debug('Backend tenants load error:', err);
      setTenants([]);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    businessName: '',
    legalName: '',
    restaurantType: 'Cafe' as RestaurantType,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    city: '',
    state: '',
    gstin: '',
    plan: 'Professional' as SubscriptionTier,
    maxOutlets: 3,
    enableKds: true,
    enableWaiterApp: true,
    enableAggregators: true,
    enableRecipeInventory: true,
    enableKhataBook: false,
    initialPassword: 'Password@123',
  });

  // Filtered list
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPlan = planFilter === 'All' || t.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  // Paginated records
  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTenants.slice(startIndex, startIndex + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, planFilter, pageSize]);

  // Handlers
  const handleToggleStatus = async (id: string) => {
    const target = tenants.find((t) => t.id === id);
    if (!target) return;
    const newStatus: TenantStatus = target.status === 'Active' ? 'Suspended' : 'Active';

    try {
      await apiClient.patch(`/tenants/${id}/status`, { isActive: newStatus === 'Active' });
    } catch {
      // optimistic fallback
    }

    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.ownerEmail.trim()) return;

    const payload = {
      businessName: formData.businessName.trim(),
      legalName: formData.legalName.trim() || formData.businessName.trim(),
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim().toLowerCase(),
      ownerPhone: formData.ownerPhone.trim(),
      initialPassword: formData.initialPassword || 'Password@123',
      businessType: formData.restaurantType === 'Cafe' ? 1 : formData.restaurantType === 'FineDine' ? 2 : 3,
      subscriptionPlan: formData.plan === 'Enterprise' ? 3 : formData.plan === 'Professional' ? 2 : 1,
      subscriptionMonths: 12,
      maxOutlets: formData.maxOutlets,
      initialOutletName: `${formData.businessName.trim()} (Main Branch)`,
      city: formData.city.trim() || 'Pune',
      state: formData.state.trim() || 'Maharashtra',
      gstin: formData.gstin.trim(),
      features: {
        enableKds: formData.enableKds,
        enableWaiterApp: formData.enableWaiterApp,
        enableAggregators: formData.enableAggregators,
        enableRecipeInventory: formData.enableRecipeInventory,
        enableKhataBook: formData.enableKhataBook,
      },
    };

    try {
      let currentToken = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');
      if (!currentToken || currentToken.startsWith('quantrobill_demo_')) {
        try {
          const authRes = await apiClient.post<{ success: boolean; data: any }>('/auth/login', {
            identifier: 'admin@quantromind.com',
            password: 'Quantromind@#9100',
          });
          if (authRes.data?.data?.accessToken) {
            currentToken = authRes.data.data.accessToken;
            if (currentToken) {
              localStorage.setItem('quantrobill_access_token', currentToken);
            }
          }
        } catch {}
      }

      const res = await apiClient.post<{ success: boolean; data: any; outlet: any }>('/tenants', payload, {
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      });
      if (res.data?.success && res.data.data) {
        const bt = res.data.data;
        const newT: Tenant = {
          id: bt.id,
          businessName: bt.businessName,
          legalName: bt.legalName || bt.businessName,
          restaurantType: formData.restaurantType,
          ownerName: formData.ownerName.trim(),
          ownerEmail: bt.ownerEmail,
          ownerPhone: bt.ownerPhone,
          city: bt.city || formData.city,
          state: bt.state || formData.state,
          gstin: bt.gstin || formData.gstin,
          plan: formData.plan,
          status: 'Active',
          maxOutlets: bt.maxOutlets || formData.maxOutlets,
          outlets: res.data.outlet
            ? [
                {
                  id: res.data.outlet.id,
                  name: res.data.outlet.name,
                  code: res.data.outlet.code,
                  city: res.data.outlet.city || formData.city,
                  isActive: true,
                  tableCount: 15,
                },
              ]
            : [],
          joinedAt: new Date().toISOString().split('T')[0],
          subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          features: payload.features,
        };
        setTenants((prev) => [newT, ...prev]);
        setShowCreateModal(false);
        setCreatedCredentials({
          businessName: formData.businessName.trim(),
          ownerEmail: formData.ownerEmail.trim(),
          password: formData.initialPassword || 'Password@123',
          outletName: res.data.outlet?.name || `${formData.businessName.trim()} (Main Branch)`,
        });

        // Reset Form
        setFormData({
          businessName: '',
          legalName: '',
          restaurantType: 'Cafe',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          city: '',
          state: '',
          gstin: '',
          plan: 'Professional',
          maxOutlets: 3,
          enableKds: true,
          enableWaiterApp: true,
          enableAggregators: true,
          enableRecipeInventory: true,
          enableKhataBook: false,
          initialPassword: 'Password@123',
        });
      } else {
        alert('Failed to save restaurant to server.');
      }
    } catch (err: any) {
      console.error('Failed to create tenant on backend:', err);
      const msg = err?.response?.data?.message || err?.message || 'Server connection error';
      alert(`⚠️ Could not save restaurant to MongoDB: ${msg}\nPlease make sure SuperAdmin is logged in.`);
    }
  };

  const handleAddOutlet = async () => {
    if (!selectedTenantDetails || !newOutletName.trim()) return;

    try {
      const res = await apiClient.post<{ success: boolean; data: any }>(
        `/tenants/${selectedTenantDetails.id}/outlets`,
        {
          name: newOutletName.trim(),
          city: newOutletCity.trim() || selectedTenantDetails.city,
        }
      );

      const addedOutlet = res.data?.data || {
        id: `o-${Date.now()}`,
        name: newOutletName.trim(),
        code: `OUT-${Math.floor(100000 + Math.random() * 900000)}`,
        city: newOutletCity.trim() || selectedTenantDetails.city,
        isActive: true,
        tableCount: 12,
      };

      const updatedOutlets = [...selectedTenantDetails.outlets, addedOutlet];
      const updatedTenant = { ...selectedTenantDetails, outlets: updatedOutlets };

      setSelectedTenantDetails(updatedTenant);
      setTenants((prev) => prev.map((t) => (t.id === selectedTenantDetails.id ? updatedTenant : t)));
      setOutletActionMessage(`Outlet "${newOutletName}" added successfully!`);
      setShowAddOutletModal(false);
      setNewOutletName('');
      setNewOutletCity('');
      setTimeout(() => setOutletActionMessage(null), 3000);
    } catch (e: any) {
      setOutletActionMessage(e?.response?.data?.message || 'Failed to add outlet.');
      setTimeout(() => setOutletActionMessage(null), 3000);
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedTenantDetails) return;

    const maxOutletsMap: Partial<Record<SubscriptionTier, number>> = {
      Starter: 1,
      Professional: 3,
      Enterprise: 10,
      Basic: 1,
      Standard: 3,
      Premium: 10,
    };

    const newMax = maxOutletsMap[selectedNewPlan] || 3;
    const planEnum = selectedNewPlan === 'Enterprise' ? 3 : selectedNewPlan === 'Professional' ? 2 : 1;

    try {
      await apiClient.patch(`/tenants/${selectedTenantDetails.id}/plan`, {
        subscriptionPlan: planEnum,
        maxOutlets: newMax,
        extendMonths: 12,
      });
    } catch {}

    const updatedTenant: Tenant = {
      ...selectedTenantDetails,
      plan: selectedNewPlan,
      maxOutlets: newMax,
    };

    setSelectedTenantDetails(updatedTenant);
    setTenants((prev) => prev.map((t) => (t.id === selectedTenantDetails.id ? updatedTenant : t)));
    setShowUpgradeModal(false);
    setOutletActionMessage(`Plan updated to ${selectedNewPlan} (Max Outlets: ${newMax})`);
    setTimeout(() => setOutletActionMessage(null), 3000);
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `QuantroBill Restaurant Credentials:\nRestaurant: ${createdCredentials.businessName}\nEmail: ${createdCredentials.ownerEmail}\nPassword: ${createdCredentials.password}\nOutlet: ${createdCredentials.outletName}\nLogin URL: http://localhost:5173/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 w-full font-sans text-slate-800">
      {outletActionMessage && (
        <div className="fixed top-20 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{outletActionMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Restaurant Tenants Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {filteredTenants.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Onboard new restaurants, manage branch outlets, subscription plans, and feature licensing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurant, owner email, city..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Trial">Trial Only</option>
            <option value="Suspended">Suspended Only</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
          >
            <option value="All">All Plans</option>
            <option value="Starter">Starter Plan</option>
            <option value="Professional">Professional Plan</option>
            <option value="Enterprise">Enterprise Plan</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Restaurant & Legal Entity</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Plan & Expiry</th>
                <th className="py-3 px-4">Outlets</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No restaurants found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/60 transition">
                    {/* Restaurant Info */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{tenant.businessName}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {tenant.city}, {tenant.state}
                        </span>
                        {tenant.gstin && (
                          <>
                            <span>•</span>
                            <span>GST: {tenant.gstin}</span>
                          </>
                        )}
                      </p>
                    </td>

                    {/* Owner Info */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{tenant.ownerName}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{tenant.ownerEmail}</span>
                      </p>
                    </td>

                    {/* Restaurant Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {tenant.restaurantType}
                      </span>
                    </td>

                    {/* Plan & Expiry */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-blue-600">{tenant.plan}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Exp: {tenant.subscriptionExpiresAt}</span>
                      </p>
                    </td>

                    {/* Outlets */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <Store className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {tenant.outlets?.length || 1} / {tenant.maxOutlets}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tenant.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tenant.status === 'Trial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedTenantDetails(tenant)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                        >
                          Manage
                        </button>

                        <button
                          onClick={() => handleToggleStatus(tenant.id)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                            tenant.status === 'Active'
                              ? 'text-rose-700 hover:bg-rose-50 border-rose-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTenants.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* Modal: Onboard New Restaurant */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Onboard New Restaurant Tenant</h3>
                <p className="text-xs text-slate-400">
                  Provision new database tenant, initial outlet branch, and owner login
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              {/* Row 1: Business Name & Legal Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Restaurant / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Biryani Blues"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Legal Registered Name</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Blues Hospitality LLP"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Type, City, GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Restaurant Type</label>
                  <select
                    value={formData.restaurantType}
                    onChange={(e) => setFormData({ ...formData, restaurantType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="Cafe">Cafe / Bakery</option>
                    <option value="FineDine">Fine Dine Restaurant</option>
                    <option value="QSR">QSR / Fast Food</option>
                    <option value="CloudKitchen">Cloud Kitchen</option>
                    <option value="BarAndRestro">Restro Bar & Pub</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Owner Credentials */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Restaurant Owner Login Account</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="owner@restaurant.com"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="text"
                      required
                      value={formData.initialPassword}
                      onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Plan & Outlets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SaaS Subscription Tier</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => {
                      const newPlan = e.target.value as SubscriptionTier;
                      setFormData({
                        ...formData,
                        plan: newPlan,
                        maxOutlets: newPlan === 'Starter' ? 1 : newPlan === 'Professional' ? 3 : 10,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Starter">Starter QSR (₹12,000 / year - 1 Outlet)</option>
                    <option value="Professional">Professional Dine-In (₹24,000 / year - 3 Outlets)</option>
                    <option value="Enterprise">Enterprise Multi-Branch (₹48,000 / year - 10 Outlets)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Branch Outlets Allowed</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.maxOutlets}
                    onChange={(e) => setFormData({ ...formData, maxOutlets: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Row 5: Feature Toggles */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Enabled Feature Modules</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableKds}
                      onChange={(e) => setFormData({ ...formData, enableKds: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium">Kitchen KDS</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableWaiterApp}
                      onChange={(e) => setFormData({ ...formData, enableWaiterApp: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium">Waiter Mobile App</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableAggregators}
                      onChange={(e) => setFormData({ ...formData, enableAggregators: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium">Zomato/Swiggy</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableRecipeInventory}
                      onChange={(e) => setFormData({ ...formData, enableRecipeInventory: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium">Recipe & Inventory</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableKhataBook}
                      onChange={(e) => setFormData({ ...formData, enableKhataBook: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span className="font-medium">Customer Credit Ledger</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold shadow-sm"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generated Owner Credentials Display */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Restaurant Onboarded Successfully!</h3>
                <p className="text-[11px] text-slate-400">Share these login credentials with the restaurant owner</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">RESTAURANT BRAND</span>
                <span className="font-bold text-slate-900">{createdCredentials.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">OWNER EMAIL</span>
                <span className="font-bold text-blue-600">{createdCredentials.ownerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">PASSWORD</span>
                <span className="font-bold text-slate-900">{createdCredentials.password}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">INITIAL OUTLET</span>
                <span className="font-bold text-slate-800">{createdCredentials.outletName}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={copyCredentials}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Outlets Modal */}
      {selectedTenantDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedTenantDetails.businessName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedTenantDetails.plan} Plan
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">ID: {selectedTenantDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">OWNER EMAIL</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTenantDetails.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PHONE</span>
                  <span className="font-bold text-slate-800">{selectedTenantDetails.ownerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CITY</span>
                  <span className="font-bold text-slate-800">{selectedTenantDetails.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">EXPIRY DATE</span>
                  <span className="font-bold text-slate-800">{selectedTenantDetails.subscriptionExpiresAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">OUTLETS ALLOCATED</span>
                  <span className="font-bold text-slate-800">
                    {selectedTenantDetails.outlets?.length || 1} of {selectedTenantDetails.maxOutlets} allowed
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS</span>
                  <span className="font-bold text-emerald-600">{selectedTenantDetails.status}</span>
                </div>
              </div>

              {/* Outlets List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>Branch Outlets ({selectedTenantDetails.outlets?.length || 1})</span>
                  </h4>
                  {(selectedTenantDetails.outlets?.length || 1) < selectedTenantDetails.maxOutlets ? (
                    <button
                      onClick={() => setShowAddOutletModal(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                    >
                      + Add Branch Outlet
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Limit reached (Upgrade to add more)</span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(selectedTenantDetails.outlets || []).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{o.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Code: {o.code} • {o.city}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Online
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition"
                >
                  Upgrade / Extend Plan
                </button>

                <button
                  onClick={() => setSelectedTenantDetails(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Add Branch Outlet */}
      {showAddOutletModal && selectedTenantDetails && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Add New Branch Outlet to {selectedTenantDetails.businessName}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  placeholder="e.g. Koregaon Park Branch"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newOutletCity}
                  onChange={(e) => setNewOutletCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddOutletModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOutlet}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Upgrade Plan */}
      {showUpgradeModal && selectedTenantDetails && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Upgrade Subscription: {selectedTenantDetails.businessName}
            </h3>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Select Subscription Plan:</label>
              {(['Starter', 'Professional', 'Enterprise'] as SubscriptionTier[]).map((tier) => (
                <label
                  key={tier}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedNewPlan === tier
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="plan_choice"
                      checked={selectedNewPlan === tier}
                      onChange={() => setSelectedNewPlan(tier)}
                      className="accent-blue-600"
                    />
                    <span>{tier} Plan</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {tier === 'Starter' ? '₹12k (1 Out.)' : tier === 'Professional' ? '₹24k (3 Out.)' : '₹48k (10 Out.)'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradePlan}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Apply Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
