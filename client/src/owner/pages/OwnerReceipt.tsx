import React, { useState } from 'react';
import {
  Printer,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { OwnerReceiptConfig } from '../types';

import { useOwnerAuthStore } from '../store/ownerAuthStore';

export const OwnerReceipt: React.FC = () => {
  const { user } = useOwnerAuthStore();

  const [config, setConfig] = useState<OwnerReceiptConfig>(() => {
    const saved = localStorage.getItem('quantrobill_owner_receipt_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      restaurantName: user?.restaurantName || 'Restaurant & Cafe',
      tagline: 'Authentic Flavours & Fine Dining',
      address: 'Main Branch',
      phone: user?.phone || '',
      gstin: '',
      fssai: '',
      headerGreeting: 'WELCOME! WE ARE DELIGHTED TO SERVE YOU',
      footerMessage: 'THANK YOU FOR DINING WITH US! PLEASE VISIT AGAIN',
      showGstin: false,
      showFssai: false,
      showWifiPassword: false,
      wifiDetails: '',
      paperWidthMm: 80,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('quantrobill_owner_receipt_config', JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setConfig({
      restaurantName: user?.restaurantName || 'Restaurant & Cafe',
      tagline: 'Authentic Flavours & Fine Dining',
      address: 'Main Branch',
      phone: user?.phone || '',
      gstin: '',
      fssai: '',
      headerGreeting: 'WELCOME! WE ARE DELIGHTED TO SERVE YOU',
      footerMessage: 'THANK YOU FOR DINING WITH US! PLEASE VISIT AGAIN',
      showGstin: false,
      showFssai: false,
      showWifiPassword: false,
      wifiDetails: '',
      paperWidthMm: 80,
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-black tracking-tight">Thermal Bill & Receipt Customizer</h1>
          <p className="text-[11px] text-slate-400">
            Customize header branding, legal compliance (GST/FSSAI), customer Wi-Fi, and live thermal printer preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
              ✓ Saved to Printer Config!
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Test Print Bill</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left Configurator, Right Live Thermal Slip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form (7 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-black uppercase tracking-wider border-b border-slate-100 pb-2">
              Restaurant Branding & Contact
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Receipt Restaurant Title</label>
              <input
                type="text"
                value={config.restaurantName}
                onChange={(e) => setConfig({ ...config, restaurantName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Tagline / Sub-heading</label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Address</label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Phone / Helpline</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-black uppercase tracking-wider border-b border-slate-100 pb-2">
              Compliance & Legal Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-black">GSTIN Number</label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showGstin}
                      onChange={(e) => setConfig({ ...config, showGstin: e.target.checked })}
                      className="accent-black"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.gstin}
                  onChange={(e) => setConfig({ ...config, gstin: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono uppercase focus:border-black focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-black">FSSAI License No</label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showFssai}
                      onChange={(e) => setConfig({ ...config, showFssai: e.target.checked })}
                      className="accent-black"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Show</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.fssai}
                  onChange={(e) => setConfig({ ...config, fssai: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-black">Customer Wi-Fi Credentials on Slip</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showWifiPassword}
                    onChange={(e) => setConfig({ ...config, showWifiPassword: e.target.checked })}
                    className="accent-black"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">Enable</span>
                </label>
              </div>
              <input
                type="text"
                value={config.wifiDetails}
                onChange={(e) => setConfig({ ...config, wifiDetails: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-black uppercase tracking-wider border-b border-slate-100 pb-2">
              Printer Paper & Footer Note
            </h2>

            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-black">Thermal Paper Width:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="paperWidth"
                  checked={config.paperWidthMm === 80}
                  onChange={() => setConfig({ ...config, paperWidthMm: 80 })}
                  className="accent-black"
                />
                <span className="font-semibold text-slate-800">80mm (3-Inch Thermal)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="paperWidth"
                  checked={config.paperWidthMm === 58}
                  onChange={() => setConfig({ ...config, paperWidthMm: 58 })}
                  className="accent-black"
                />
                <span className="font-semibold text-slate-800">58mm (2-Inch Thermal)</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Footer Message</label>
              <input
                type="text"
                value={config.footerMessage}
                onChange={(e) => setConfig({ ...config, footerMessage: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-black focus:outline-none font-semibold"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-black font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Receipt Format</span>
              </button>
            </div>
          </div>
        </form>

        {/* Right Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-white border border-slate-300 rounded-lg p-5 shadow-lg font-mono text-[11px] text-slate-900 select-none">
            {/* Thermal Header */}
            <div className="text-center pb-2 border-b border-black">
              <p className="font-black text-xs uppercase tracking-wider">{config.restaurantName}</p>
              <p className="text-[9px] text-slate-600 italic mt-0.5">{config.tagline}</p>
              <p className="text-[9px] text-slate-600 mt-1 leading-tight">{config.address}</p>
              <p className="text-[9px] text-slate-600">Ph: {config.phone}</p>

              {config.showGstin && (
                <p className="text-[9px] font-bold mt-1">GSTIN: {config.gstin}</p>
              )}
              {config.showFssai && (
                <p className="text-[9px] text-slate-600">FSSAI Lic: {config.fssai}</p>
              )}
            </div>

            {/* Bill Details */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Invoice: #INV-2026-0891</span>
                <span>Date: 11-09-2026</span>
              </div>
              <div className="flex justify-between">
                <span>Table: RM3 (Fine Dine)</span>
                <span>Time: 14:22 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Captain: raju</span>
                <span>Cashier: gayathri</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
                <span>ITEM</span>
                <div className="flex gap-4">
                  <span>QTY</span>
                  <span>AMT</span>
                </div>
              </div>

              <div className="space-y-1 pt-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Paneer Butter Masala</span>
                  <div className="flex gap-6">
                    <span>1</span>
                    <span>280.00</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Butter Naan</span>
                  <div className="flex gap-6">
                    <span>4</span>
                    <span>240.00</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Fresh Lime Soda</span>
                  <div className="flex gap-6">
                    <span>2</span>
                    <span>160.00</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Gulab Jamun (2 Pcs)</span>
                  <div className="flex gap-6">
                    <span>1</span>
                    <span>90.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Item Subtotal:</span>
                <span>770.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (2.5%):</span>
                <span>19.25</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (2.5%):</span>
                <span>19.25</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>₹808.50</span>
              </div>
            </div>

            {/* Settled via */}
            <div className="py-2 border-b border-dashed border-slate-400 text-center text-[10px]">
              <span className="font-bold">PAID VIA UPI: ₹808.50</span>
            </div>

            {/* Wi-Fi & Footer */}
            <div className="pt-2 text-center space-y-1 text-[9px] text-slate-600">
              {config.showWifiPassword && (
                <div className="p-1 bg-slate-100 rounded text-black font-semibold">
                  📶 Guest Wi-Fi: {config.wifiDetails}
                </div>
              )}
              <p className="font-bold text-black mt-2 uppercase">{config.footerMessage}</p>
              <p className="text-[8px] text-slate-400">Powered by QuantroBill SaaS</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            Previewing: {config.paperWidthMm}mm ESC/POS Thermal Paper Roll
          </p>
        </div>
      </div>
    </div>
  );
};
