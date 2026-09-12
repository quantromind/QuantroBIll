import React, { useState } from 'react';
import {
  Save,
  Store,
  Printer,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';

export const OwnerSettings: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECTIONS' | 'TAX' | 'HARDWARE'>('GENERAL');

  // General Settings State
  const [restaurantName, setRestaurantName] = useState(tenant?.businessName || tenant?.name || 'My Restaurant');
  const [branchName, setBranchName] = useState('Main Branch');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || 'owner@restaurant.com');
  const [currencySymbol, setCurrencySymbol] = useState('₹ (INR)');

  // Section Tables
  const [fineDineTables, setFineDineTables] = useState(15);
  const [takeAwayCounters, setTakeAwayCounters] = useState(2);
  const [deliveryZones, setDeliveryZones] = useState(5);

  // Tax & Billing
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [enableServiceCharge, setEnableServiceCharge] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(5);
  const [roundOffBills, setRoundOffBills] = useState(true);

  // Hardware / Printer
  const [printerConnection, setPrinterConnection] = useState<'BROWSER' | 'NETWORK_IP' | 'USB'>('NETWORK_IP');
  const [printerIp, setPrinterIp] = useState('192.168.1.100');
  const [printerPort, setPrinterPort] = useState('9100');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant) {
      tenant.businessName = restaurantName;
      localStorage.setItem('quantrobill_tenant', JSON.stringify(tenant));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Restaurant Configuration & Settings</h1>
          <p className="text-[11px] text-slate-400">
            Configure store profile, floor capacity, GST rates, and thermal hardware devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
              ✓ Settings Saved!
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Outlet Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('SECTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'SECTIONS'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Floor & Tables Capacity</span>
        </button>
        <button
          onClick={() => setActiveTab('TAX')}
          className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'TAX'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>GST & Bill Taxes</span>
        </button>
        <button
          onClick={() => setActiveTab('HARDWARE')}
          className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap border-b-2 transition cursor-pointer ${
            activeTab === 'HARDWARE'
              ? 'border-black text-black font-extrabold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Thermal Printer Hardware</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="bg-white rounded-b-xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
        {activeTab === 'GENERAL' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Restaurant Business Name *</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Outlet Branch Name</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Manager Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Currency Format</label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium focus:border-black focus:outline-none"
              >
                <option value="₹ (INR)">₹ - Indian Rupee (INR)</option>
                <option value="$ (USD)">$ - US Dollar (USD)</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'SECTIONS' && (
          <div className="space-y-4 max-w-xl">
            <p className="text-slate-500 text-[11px]">
              Set the total number of live table chips available across each operations zone.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Fine Dine Live Tables Capacity</label>
              <input
                type="number"
                min="1"
                max="200"
                value={fineDineTables}
                onChange={(e) => setFineDineTables(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Take Away Parcel Counters</label>
              <input
                type="number"
                min="1"
                max="50"
                value={takeAwayCounters}
                onChange={(e) => setTakeAwayCounters(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Home Delivery Rider Zones</label>
              <input
                type="number"
                min="1"
                max="50"
                value={deliveryZones}
                onChange={(e) => setDeliveryZones(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'TAX' && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Central GST (CGST %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cgstRate}
                  onChange={(e) => setCgstRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">State GST (SGST %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sgstRate}
                  onChange={(e) => setSgstRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableServiceCharge}
                  onChange={(e) => setEnableServiceCharge(e.target.checked)}
                  className="accent-black"
                />
                <span className="font-bold text-black">Enable Optional Service Charge</span>
              </label>

              {enableServiceCharge && (
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roundOffBills}
                  onChange={(e) => setRoundOffBills(e.target.checked)}
                  className="accent-black"
                />
                <span className="font-bold text-black">Auto Round-off Final Invoice Amounts to Nearest Rupee</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'HARDWARE' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Thermal Printer Interface</label>
              <select
                value={printerConnection}
                onChange={(e) => setPrinterConnection(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium focus:border-black focus:outline-none"
              >
                <option value="NETWORK_IP">Network / Ethernet ESC-POS (Recommended for kitchen & billing)</option>
                <option value="USB">Direct USB Local Printer</option>
                <option value="BROWSER">Standard Browser Print Dialog</option>
              </select>
            </div>

            {printerConnection === 'NETWORK_IP' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-black mb-1">Printer Static IP</label>
                  <input
                    type="text"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">Raw Port</label>
                  <input
                    type="text"
                    value={printerPort}
                    onChange={(e) => setPrinterPort(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono focus:border-black focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save All Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
