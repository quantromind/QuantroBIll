import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Download,
  ArrowLeft,
  PieChart
} from 'lucide-react';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'today'>('7days');

  const stats = {
    totalRevenue: 68450,
    totalOrders: 312,
    avgOrderValue: 219.39,
    totalCgst: 1711.25,
    totalSgst: 1711.25,
    netTaxLiability: 3422.50,
  };

  const dailySales = [
    { date: '02 Jun', sales: 8200 },
    { date: '03 Jun', sales: 9400 },
    { date: '04 Jun', sales: 7800 },
    { date: '05 Jun', sales: 11200 },
    { date: '06 Jun', sales: 12500 },
    { date: '07 Jun', sales: 10900 },
    { date: '08 Jun', sales: 8450 },
  ];

  const channelBreakdown = [
    { name: 'Dine In (Restaurant)', percentage: 45, amount: 30800, color: '#dc2626' },
    { name: 'Zomato (Online)', percentage: 30, amount: 20535, color: '#cb202d' },
    { name: 'Swiggy (Online)', percentage: 15, amount: 10265, color: '#fc8019' },
    { name: 'Takeaway / Pick Up', percentage: 10, amount: 6850, color: '#10b981' },
  ];

  const topSellingItems = [
    { name: 'Oreo Thick Shake (Most Loved)', qty: 86, revenue: 16340 },
    { name: 'Choco Belgian Shake', qty: 74, revenue: 14060 },
    { name: 'Alphonso Mango Shake', qty: 65, revenue: 11700 },
    { name: 'Cold Coffee Ice Cream Float', qty: 52, revenue: 8320 },
    { name: 'Magic Combo (Burger + Shake)', qty: 38, revenue: 11362 },
  ];

  const handleExportCsv = () => {
    alert('Generating & Downloading comprehensive Sales & Tax Liability CSV Report...');
  };

  const maxDailySale = Math.max(...dailySales.map((d) => d.sales));

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports & Sales Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Revenue Performance, GST Tax Liability & Channel Breakdown
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg bg-slate-200 p-1 text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === '30days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 touch-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>POS</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">+14% vs previous period</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Orders Fulfilled</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Avg: ₹{stats.avgOrderValue.toFixed(2)} / order</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">CGST + SGST Collected</span>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{stats.netTaxLiability.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">CGST: ₹{stats.totalCgst} | SGST: ₹{stats.totalSgst}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Online Aggregator Cut</span>
          <p className="text-2xl font-black text-amber-600 mt-1">₹{(stats.totalRevenue * 0.08).toFixed(0)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Zomato/Swiggy commission ~18%</p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Daily Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span>Daily Revenue Trend (₹)</span>
            </h3>
            <span className="text-xs text-slate-500">7 Days Performance</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
            {dailySales.map((day) => {
              const heightPercent = Math.round((day.sales / maxDailySale) * 100);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{day.sales}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-red-600 to-rose-400 rounded-t-md transition-all group-hover:from-red-700 group-hover:to-rose-500"
                  />
                  <span className="text-[10px] font-semibold text-slate-500">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
            <PieChart className="w-4 h-4 text-red-600" />
            <span>Sales by Channel</span>
          </h3>

          <div className="space-y-3 pt-2">
            {channelBreakdown.map((ch) => (
              <div key={ch.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{ch.name}</span>
                  <span className="text-slate-900 font-bold">₹{ch.amount} ({ch.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${ch.percentage}%`, backgroundColor: ch.color }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Best Selling Items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800">
          Top Selling Dishes & Beverages
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Dish / Beverage Name</th>
                <th className="px-4 py-3 text-center">Units Sold</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topSellingItems.map((item, idx) => (
                <tr key={item.name} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span>{item.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{item.qty} pcs</td>
                  <td className="px-4 py-3 font-black text-slate-900 text-right">₹{item.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
