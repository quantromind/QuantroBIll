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

  // Auto-open create modal if url has ?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setShowCreateModal(true);
    }
  }, [location.search]);

  // Load tenants from MongoDB API
  useEffect(() => {
    apiClient.get<{ success: boolean; data: any[] }>('/tenants').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const backendTenants: Tenant[] = res.data.data.map((bt: any) => ({
          id: bt.id,
          businessName: bt.businessName,
          legalName: bt.businessName,
          restaurantType: bt.businessType === 1 ? 'Cafe' : 'FineDine',
          ownerName: bt.ownerEmail?.split('@')[0] || 'Owner',
          ownerEmail: bt.ownerEmail,
          ownerPhone: bt.ownerPhone || '9876543210',
          city: 'Pune',
          state: 'Maharashtra',
          gstin: '27AABCS0000A1Z5',
          plan: bt.subscriptionPlan === 3 ? 'Enterprise' : 'Professional',
          status: bt.isActive ? 'Active' : 'Suspended',
          maxOutlets: bt.maxOutlets || 5,
          outlets: [],
          joinedAt: new Date(bt.createdAt || Date.now()).toISOString().split('T')[0],
          subscriptionExpiresAt: new Date(bt.subscriptionExpiresAt || Date.now() + 365 * 86400000).toISOString().split('T')[0],
          features: {
            enableKds: true,
            enableWaiterApp: true,
            enableAggregators: true,
            enableRecipeInventory: true,
            enableKhataBook: true,
          },
        }));

        setTenants((prev) => {
          const ids = new Set(backendTenants.map((b) => b.id));
          return [...backendTenants, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
    }).catch(() => {});
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
    maxOutlets: 2,
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
  const handleToggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newStatus: TenantStatus = t.status === 'Active' ? 'Suspended' : 'Active';
          apiClient.patch(`/tenants/${id}/status`, { isActive: newStatus === 'Active' }).catch(() => {});
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.ownerEmail.trim()) return;

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      businessName: formData.businessName.trim(),
      legalName: formData.legalName.trim() || formData.businessName.trim(),
      restaurantType: formData.restaurantType,
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim(),
      ownerPhone: formData.ownerPhone.trim(),
      city: formData.city.trim() || 'Mumbai',
      state: formData.state.trim() || 'Maharashtra',
      gstin: formData.gstin.trim(),
      plan: formData.plan,
      status: 'Active',
      maxOutlets: formData.maxOutlets,
      outlets: [
        {
          id: `o-${Date.now()}`,
          name: `${formData.businessName.trim()} - Main Outlet`,
          code: 'OUT-01',
          city: formData.city.trim() || 'City',
          isActive: true,
          tableCount: 15,
        },
      ],
      joinedAt: new Date().toISOString().split('T')[0],
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      features: {
        enableKds: formData.enableKds,
        enableWaiterApp: formData.enableWaiterApp,
        enableAggregators: formData.enableAggregators,
        enableRecipeInventory: formData.enableRecipeInventory,
        enableKhataBook: formData.enableKhataBook,
      },
    };

    setTenants([newTenant, ...tenants]);
    setShowCreateModal(false);

    // Persist to MongoDB
    apiClient.post('/tenants', {
      businessName: formData.businessName.trim(),
      ownerEmail: formData.ownerEmail.trim(),
      ownerPhone: formData.ownerPhone.trim(),
      businessType: formData.restaurantType === 'Cafe' ? 1 : 2,
      subscriptionPlan: formData.plan === 'Enterprise' ? 3 : 2,
      subscriptionMonths: 12,
      maxOutlets: formData.maxOutlets,
      city: formData.city.trim() || 'Pune',
      gstin: formData.gstin.trim(),
    }).catch((err) => {
      console.debug('Async tenant persist fallback:', err);
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
      maxOutlets: 2,
      enableKds: true,
      enableWaiterApp: true,
      enableAggregators: true,
      enableRecipeInventory: true,
      enableKhataBook: false,
      initialPassword: 'Password@123',
    });

    alert(
      `Restaurant "${newTenant.businessName}" onboarded successfully!\nOwner credentials generated:\nEmail: ${newTenant.ownerEmail}\nPassword: ${formData.initialPassword}`
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Restaurant Tenants Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredTenants.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Onboard new restaurants, manage subscriptions, outlet limits and feature flags.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, owner email, city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Trial">Trial Only</option>
            <option value="Suspended">Suspended Only</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Plans</option>
            <option value="Starter">Starter Plan</option>
            <option value="Professional">Professional Plan</option>
            <option value="Enterprise">Enterprise Plan</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
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
                    No restaurants found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/60 transition">
                    {/* Restaurant Info */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{tenant.businessName}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
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
                        <Mail className="w-3 h-3" />
                        <span>{tenant.ownerEmail}</span>
                      </p>
                    </td>

                    {/* Restaurant Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {tenant.restaurantType}
                      </span>
                    </td>

                    {/* Plan & Expiry */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-indigo-600">{tenant.plan}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Exp: {tenant.subscriptionExpiresAt}</span>
                      </p>
                    </td>

                    {/* Outlets */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono font-medium">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {tenant.outlets.length} / {tenant.maxOutlets}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="View Outlets & Details"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleToggleStatus(tenant.id)}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                            tenant.status === 'Active'
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
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

        {/* Proper Reusable Pagination Component */}
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Onboard New Restaurant Tenant</h3>
                <p className="text-xs text-slate-400">Provision a new restaurant, owner credentials and license</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              {/* Row 1: Business Name & Legal Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Restaurant / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Biryani Blues"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Legal Registered Name</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Blues Hospitality LLP"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Type, City, GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Restaurant Type</label>
                  <select
                    value={formData.restaurantType}
                    onChange={(e) => setFormData({ ...formData, restaurantType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Cafe">Cafe / Bakery</option>
                    <option value="FineDine">Fine Dine Restaurant</option>
                    <option value="QSR">QSR / Fast Food</option>
                    <option value="CloudKitchen">Cloud Kitchen</option>
                    <option value="BarAndRestro">Restro Bar & Pub</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 3: Owner Credentials */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Restaurant Owner Login Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="owner@restaurant.com"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Owner Password *</label>
                    <input
                      type="text"
                      required
                      value={formData.initialPassword}
                      onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Plan & Outlets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SaaS Subscription Tier</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Starter">Starter QSR (₹12,000 / year)</option>
                    <option value="Professional">Professional Dine-In (₹24,000 / year)</option>
                    <option value="Enterprise">Enterprise Multi-Branch (₹48,000 / year)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Outlet Branches</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.maxOutlets}
                    onChange={(e) => setFormData({ ...formData, maxOutlets: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Row 5: Feature Toggles */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Enabled Feature Modules</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableKds}
                      onChange={(e) => setFormData({ ...formData, enableKds: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    <span>Kitchen KDS</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableWaiterApp}
                      onChange={(e) => setFormData({ ...formData, enableWaiterApp: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    <span>Waiter Mobile App</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableAggregators}
                      onChange={(e) => setFormData({ ...formData, enableAggregators: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    <span>Zomato/Swiggy</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableRecipeInventory}
                      onChange={(e) => setFormData({ ...formData, enableRecipeInventory: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    <span>Recipe & Inventory</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableKhataBook}
                      onChange={(e) => setFormData({ ...formData, enableKhataBook: e.target.checked })}
                      className="accent-indigo-600"
                    />
                    <span>Credit Khata Book</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedTenantDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedTenantDetails.businessName} Details
              </h3>
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">OWNER EMAIL</span>
                  <span className="font-semibold text-slate-800">{selectedTenantDetails.ownerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PHONE</span>
                  <span className="font-semibold text-slate-800">{selectedTenantDetails.ownerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SUBSCRIPTION EXPIRY</span>
                  <span className="font-semibold text-slate-800">{selectedTenantDetails.subscriptionExpiresAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MAX OUTLETS</span>
                  <span className="font-semibold text-slate-800">{selectedTenantDetails.maxOutlets}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Registered Outlets</h4>
                <div className="space-y-1.5">
                  {selectedTenantDetails.outlets.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white"
                    >
                      <span className="font-medium text-slate-800">{o.name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{o.code} • {o.tableCount} tables</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
