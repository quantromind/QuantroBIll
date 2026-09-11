import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Printer,
  Flame,
  Coffee,
  IceCream,
  Utensils,
  AlertTriangle,
  Grid3X3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePosSyncStore, playKitchenKdsChime } from '../store/posSyncStore';

export const KDS: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeKOTs,
    completedKOTs,
    startPrepKOT,
    bumpKOT,
    recallLastKOT,
    audioChimeEnabled,
    toggleAudioChime,
  } = usePosSyncStore();

  const [selectedStation, setSelectedStation] = useState<'All' | 'Kitchen' | 'Tandoor' | 'Bar' | 'Dessert'>('All');
  const [printKOTTicket, setPrintKOTTicket] = useState<any | null>(null);
  const [, setNow] = useState(Date.now());

  // Ticking timer every 5 seconds for elapsed times
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter KOTs by station
  const filteredKOTs = useMemo(() => {
    return activeKOTs.filter((ticket) => {
      if (selectedStation === 'All') return true;
      return ticket.items.some((item) => item.station === selectedStation) || ticket.station === selectedStation;
    });
  }, [activeKOTs, selectedStation]);

  // Calculate elapsed time from creation
  const getElapsedDisplay = (createdAt: number) => {
    const elapsedMinutes = Math.floor((Date.now() - createdAt) / 60000);
    const elapsedSeconds = Math.floor(((Date.now() - createdAt) % 60000) / 1000);
    return {
      minutes: elapsedMinutes,
      seconds: elapsedSeconds,
      display: `${elapsedMinutes}m ${elapsedSeconds}s`,
      isUrgent: elapsedMinutes >= 20,
      isWarning: elapsedMinutes >= 10 && elapsedMinutes < 20,
    };
  };

  return (
    <div className="flex-1 bg-slate-100 text-slate-900 p-4 sm:p-6 overflow-y-auto flex flex-col select-none">
      {/* KDS Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-4 mb-4 bg-white p-4 rounded-2xl shadow-xs border">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">Kitchen Display System (KDS)</h1>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Live Paperless Kitchen Command Center • Instant Dual-Tone Chimes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Audio Chime Button */}
          <button
            onClick={() => {
              toggleAudioChime();
              if (!audioChimeEnabled) {
                playKitchenKdsChime();
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition touch-btn cursor-pointer shadow-xs ${
              audioChimeEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {audioChimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioChimeEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {/* Test Chime Sound */}
          <button
            onClick={() => playKitchenKdsChime()}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold touch-btn cursor-pointer shadow-xs"
            title="Test Audio Chime Sound"
          >
            <span>🔔 Sound Test</span>
          </button>

          {/* Recall Last Completed KOT */}
          {completedKOTs.length > 0 && (
            <button
              onClick={() => recallLastKOT()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold touch-btn cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recall ({completedKOTs[0]?.kotNo})</span>
            </button>
          )}

          {/* Table Manager Shortcut */}
          <button
            onClick={() => navigate('/tables')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold touch-btn cursor-pointer shadow-xs"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Tables</span>
          </button>

          {/* POS Screen Shortcut */}
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold touch-btn shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Billing POS</span>
          </button>
        </div>
      </div>

      {/* Station Filter Tabs */}
      <div className="flex items-center space-x-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedStation('All')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition touch-btn cursor-pointer border shadow-xs ${
            selectedStation === 'All'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-extrabold'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>All Stations</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ml-1 font-black ${
            selectedStation === 'All' ? 'bg-amber-700/40 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeKOTs.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedStation('Kitchen')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition touch-btn cursor-pointer border shadow-xs ${
            selectedStation === 'Kitchen'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-extrabold'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Main Kitchen</span>
        </button>

        <button
          onClick={() => setSelectedStation('Tandoor')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition touch-btn cursor-pointer border shadow-xs ${
            selectedStation === 'Tandoor'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-extrabold'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>Tandoor & Starters</span>
        </button>

        <button
          onClick={() => setSelectedStation('Bar')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition touch-btn cursor-pointer border shadow-xs ${
            selectedStation === 'Bar'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-extrabold'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-cyan-600" />
          <span>Beverages & Bar</span>
        </button>

        <button
          onClick={() => setSelectedStation('Dessert')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition touch-btn cursor-pointer border shadow-xs ${
            selectedStation === 'Dessert'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-extrabold'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <IceCream className="w-3.5 h-3.5 text-pink-500" />
          <span>Desserts</span>
        </button>
      </div>

      {/* Tickets Grid */}
      {filteredKOTs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-bounce" />
          <p className="text-lg font-bold text-slate-800">All caught up! No active KOTs.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
            New orders punched from POS Billing or the Waiter Mobile App will instantly appear here with dual-tone audio alert.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredKOTs.map((ticket) => {
            const elapsed = getElapsedDisplay(ticket.createdAt);

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all bg-white ${
                  elapsed.isUrgent
                    ? 'border-rose-400 ring-2 ring-rose-400/20'
                    : elapsed.isWarning
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between border-b ${
                      elapsed.isUrgent
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                        : elapsed.isWarning
                        ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                        : 'bg-slate-50/90 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-black text-sm text-slate-900">{ticket.kotNo}</span>
                        {elapsed.isUrgent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Delay
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500">{ticket.orderType}</p>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className={`flex items-center space-x-1 font-mono text-xs font-bold ${
                        elapsed.isUrgent ? 'text-rose-700' : elapsed.isWarning ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsed.display}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 capitalize bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5">
                        {ticket.status === 'InPrep' ? '🍳 In Prep' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Table & Destination Bar */}
                  <div className="px-3.5 py-2 bg-amber-50/60 text-xs font-bold text-amber-900 border-b border-amber-100 flex items-center justify-between">
                    <span className="truncate pr-2">{ticket.tableOrChannel}</span>
                    <button
                      onClick={() => setPrintKOTTicket(ticket)}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-amber-100/70 transition cursor-pointer"
                      title="Print KOT Ticket"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5 bg-white">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="pr-2">
                          <span className="font-bold text-slate-800 text-[13px]">{item.name}</span>
                          {item.note && (
                            <p className="text-[10px] text-amber-800 font-semibold mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              👉 {item.note}
                            </p>
                          )}
                        </div>
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-2">
                  {ticket.status === 'Pending' ? (
                    <button
                      onClick={() => startPrepKOT(ticket.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 touch-btn shadow-xs cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Start Prep</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-default opacity-90"
                    >
                      <Flame className="w-3.5 h-3.5 animate-pulse" />
                      <span>Cooking</span>
                    </button>
                  )}

                  <button
                    onClick={() => bumpKOT(ticket.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 touch-btn shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Food Ready</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ESC/POS Thermal KOT Preview Modal */}
      {printKOTTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 font-mono w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-black text-base uppercase tracking-wider text-slate-900">KITCHEN ORDER TICKET (KOT)</h3>
              <p className="text-xs font-bold mt-1 text-slate-600">*** {printKOTTicket.orderType} ***</p>
              <div className="flex justify-between text-xs mt-2 font-bold text-slate-800">
                <span>{printKOTTicket.kotNo}</span>
                <span>{printKOTTicket.tableOrChannel}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3 mb-3 text-slate-800">
              {printKOTTicket.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between items-start font-bold">
                  <div className="pr-2">
                    <span>{it.name}</span>
                    {it.note && <div className="text-[10px] text-slate-500 font-normal">[{it.note}]</div>}
                  </div>
                  <span>x {it.qty}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 mb-4">
              <span>Time: {new Date(printKOTTicket.createdAt).toLocaleTimeString()}</span>
              <span>Biller: cashier</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPrintKOTTicket(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border border-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setPrintKOTTicket(null);
                }}
                className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KDS;
