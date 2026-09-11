import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Utensils,
  ShoppingBag,
  Truck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { LiveTableChip, LiveRunningOrdersSummary } from '../types';
import { useTableStore } from '../../store/tableStore';
import { usePosSyncStore } from '../../store/posSyncStore';

export const OwnerDashboard: React.FC = () => {
  const { tables } = useTableStore();
  const { activeKOTs } = usePosSyncStore();

  // Cashier & Time Filters (As per Screenshot 1)
  const [selectedCashier, setSelectedCashier] = useState('All Cashiers');
  const [dateRange, setDateRange] = useState('Today (Live)');
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');

  // Active section tab in "Live Tables Breakdown"
  const [activeTableTab, setActiveTableTab] = useState<
    'Dine Fine' | 'Custom Tables' | 'Take Away' | 'Home Delivery'
  >('Dine Fine');

  // Compute live Dine Fine Tables combining tableStore occupied tables
  const occupiedFromStore: LiveTableChip[] = tables
    .filter((t) => t.isOccupied)
    .map((t) => {
      let sec: 'Dine Fine' | 'Custom Tables' | 'Take Away' | 'Home Delivery' = 'Dine Fine';
      if (t.section && t.section.toLowerCase().includes('custom')) sec = 'Custom Tables';
      return {
        id: `store-${t.tableNumber}`,
        tableNumber: t.tableNumber,
        section: sec,
        orderTotal: t.orderTotal || 0,
        isOccupied: true,
        runningDuration: t.orderTime ? `${Math.max(1, Math.floor((Date.now() - new Date(t.orderTime).getTime()) / 60000))}m` : '5m',
      };
    });

  const dineFineTables: LiveTableChip[] = [
    ...occupiedFromStore,
    { id: '1', tableNumber: 'RM3', section: 'Dine Fine', orderTotal: 1890, isOccupied: true, runningDuration: '32m' },
    { id: '2', tableNumber: 'RM6', section: 'Dine Fine', orderTotal: 1404, isOccupied: true, runningDuration: '18m' },
    { id: '3', tableNumber: 'RM4', section: 'Dine Fine', orderTotal: 446, isOccupied: true, runningDuration: '12m' },
    { id: '4', tableNumber: 'RM9', section: 'Dine Fine', orderTotal: 646, isOccupied: true, runningDuration: '45m' },
    { id: '5', tableNumber: 'RM15', section: 'Dine Fine', orderTotal: 975, isOccupied: true, runningDuration: '24m' },
    { id: '6', tableNumber: 'RM11', section: 'Dine Fine', orderTotal: 1477, isOccupied: true, runningDuration: '50m' },
  ];

  const homeDeliveryTables: LiveTableChip[] = [
    { id: 'hd-1', tableNumber: 'RMH-D1', section: 'Home Delivery', orderTotal: 1154, isOccupied: true, runningDuration: '22m' },
  ];

  // Dynamic Live Running Orders KPI Metrics
  const dineTotal = dineFineTables.reduce((acc, t) => acc + (t.orderTotal || 0), 0);
  const deliveryTotal = homeDeliveryTables.reduce((acc, t) => acc + (t.orderTotal || 0), 0);

  const runningOrdersSummary: LiveRunningOrdersSummary = {
    dineInCount: dineFineTables.length,
    dineInTotal: dineTotal,
    parcelCount: activeKOTs.filter((k) => k.orderType.toLowerCase().includes('pick')).length,
    parcelTotal: 0.0,
    deliveryCount: homeDeliveryTables.length,
    deliveryTotal: deliveryTotal,
    overallCount: dineFineTables.length + homeDeliveryTables.length,
    overallTotal: dineTotal + deliveryTotal,
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-slate-900 select-none">
      {/* 1. Welcome Executive Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white p-5 rounded-2xl border border-blue-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Welcome, AjayYadav!
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time restaurant operations dashboard • RR RESTAURANT • Executive Hub
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Syncing</span>
          </span>
        </div>
      </div>

      {/* 2. Top Filter Bar (Clean CRM Style) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Cashier Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Cashier:</span>
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All Cashiers">All Cashiers</option>
              <option value="raju">raju</option>
              <option value="naveenk">naveenk</option>
              <option value="Harini">Harini</option>
              <option value="Nizam">Nizam</option>
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 w-28 focus:outline-none"
            />
          </div>

          {/* Time Filter From/To */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">From:</span>
            <input
              type="text"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="w-12 text-center bg-white border border-slate-200 rounded text-slate-800 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-400 text-[10px] uppercase font-bold">To:</span>
            <input
              type="text"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="w-12 text-center bg-white border border-slate-200 rounded text-slate-800 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => alert(`Filters applied: ${selectedCashier} from ${timeFrom} to ${timeTo}`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Apply Time</span>
        </button>
      </div>

      {/* 3. Live Tables Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-50 text-blue-600">📋</span> Live Tables Breakdown
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Active tables, custom tables, parcels, and deliveries with live order totals
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTableTab('Dine Fine')}
            className={`px-5 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTableTab === 'Dine Fine'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine Fine</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
              {dineFineTables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTableTab('Custom Tables')}
            className={`px-5 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTableTab === 'Custom Tables'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Custom Tables</span>
          </button>

          <button
            onClick={() => setActiveTableTab('Take Away')}
            className={`px-5 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTableTab === 'Take Away'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>

          <button
            onClick={() => setActiveTableTab('Home Delivery')}
            className={`px-5 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTableTab === 'Home Delivery'
                ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Home Delivery</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
              {homeDeliveryTables.length}
            </span>
          </button>
        </div>

        {/* Table Chips Grid */}
        <div className="p-4 sm:p-5">
          {activeTableTab === 'Dine Fine' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {dineFineTables.map((table) => (
                <div
                  key={table.id}
                  className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 hover:border-blue-300 hover:bg-blue-50/60 transition flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-900">{table.tableNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{table.runningDuration}</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-blue-100/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                    <span className="text-xs font-black text-slate-900">₹{table.orderTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTableTab === 'Home Delivery' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {homeDeliveryTables.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:border-indigo-300 transition flex flex-col justify-between shadow-2xs"
                >
                  <span className="font-bold text-xs text-indigo-900">{d.tableNumber}</span>
                  <div className="mt-2.5 pt-2 border-t border-indigo-100/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">DELIVERY DUE</span>
                    <span className="text-xs font-black text-slate-900">₹{d.orderTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTableTab === 'Custom Tables' || activeTableTab === 'Take Away') && (
            <div className="py-10 text-center text-slate-400 text-xs">
              No active orders currently in {activeTableTab}.
            </div>
          )}
        </div>
      </div>

      {/* 4. Live Running Orders KPI Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Live Running Orders</h2>
          <span className="text-[11px] text-slate-400">Current active orders in progress across outlet</span>
        </div>

        {/* 4 KPI Cards: 3 Soft Pastel + 1 Royal Blue Highlight Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Running Dine-In */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  RUNNING DINE-IN
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{runningOrdersSummary.dineInCount}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-blue-600 font-mono">
                ₹{runningOrdersSummary.dineInTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 2: Running Parcel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  RUNNING PARCEL
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{runningOrdersSummary.parcelCount}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-amber-600 font-mono">
                ₹{runningOrdersSummary.parcelTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 3: Running Delivery */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  RUNNING DELIVERY
                </p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{runningOrdersSummary.deliveryCount}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-indigo-600 font-mono">
                ₹{runningOrdersSummary.deliveryTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 4: Running Overall - Premium Royal Blue Highlight Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-wider">
                  RUNNING OVERALL
                </p>
                <p className="text-xl font-black text-white mt-0.5">{runningOrdersSummary.overallCount}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-white font-mono">
                ₹{runningOrdersSummary.overallTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
