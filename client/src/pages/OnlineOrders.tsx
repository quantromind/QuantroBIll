import React, { useState } from 'react';
import {
  RotateCw,
  ArrowLeft,
  MessageSquare,
  Truck,
  UserCheck,
  Eye,
  FileText,
  PlusCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLangStore } from '../store/langStore';

interface MockOnlineOrder {
  id: string;
  orderId: string;
  aggregator: 'Zomato' | 'Swiggy';
  customerName: string;
  customerPhone?: string;
  placedTime: string;
  billNo: string;
  otp: string;
  instructions?: string;
  total: number;
  paymentMode: 'Online' | 'COD';
  status: 'Pending' | 'FoodReady' | 'Dispatched' | 'Delivered' | 'Cancelled';
  items: string[];
  riderName?: string;
  riderPhone?: string;
}

export const OnlineOrders: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLangStore();
  const strings = t();

  const [selectedAggregator, setSelectedAggregator] = useState<'All' | 'Zomato' | 'Swiggy'>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'amount'>('latest');
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [activeTab, setActiveTab] = useState<'Current' | 'Online'>('Online');

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<MockOnlineOrder | null>(null);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState<MockOnlineOrder | null>(null);
  const [riderInputName, setRiderInputName] = useState('');
  const [riderInputPhone, setRiderInputPhone] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<MockOnlineOrder[]>([
    {
      id: 'o1',
      orderId: '8242905005',
      aggregator: 'Zomato',
      customerName: 'Neha Date',
      customerPhone: '9822001122',
      placedTime: 'Placed at: 18:23 | 18 Jun',
      billNo: '74',
      otp: '6664',
      instructions: 'Less sugar, packed separately',
      total: 129.50,
      paymentMode: 'Online',
      status: 'FoodReady',
      items: ['Vanilla Classic (1x)'],
      riderName: 'Vikram Joshi',
      riderPhone: '9822119900',
    },
    {
      id: 'o2',
      orderId: '8252086938',
      aggregator: 'Zomato',
      customerName: 'Pushpak',
      customerPhone: '9822003344',
      placedTime: 'Placed at: 17:49 | 18 Jun',
      billNo: '73',
      otp: '4841',
      instructions: 'Please provide straw and extra tissues',
      total: 159.00,
      paymentMode: 'Online',
      status: 'FoodReady',
      items: ['Cold Coffee Ice Cream Float (1x)'],
    },
    {
      id: 'o3',
      orderId: '8250763236',
      aggregator: 'Zomato',
      customerName: 'Akshay',
      customerPhone: '9822005566',
      placedTime: 'Placed at: 17:46 | 18 Jun',
      billNo: '72',
      otp: '8649',
      instructions: 'Don\'t ring doorbell, call on mobile',
      total: 129.50,
      paymentMode: 'Online',
      status: 'FoodReady',
      items: ['Strawberry Shake (1x)'],
    },
    {
      id: 'o4',
      orderId: '8252220087',
      aggregator: 'Zomato',
      customerName: 'Ashish Verma',
      customerPhone: '9822007788',
      placedTime: 'Placed at: 13:15 | 18 Jun',
      billNo: '70',
      otp: '3261',
      instructions: 'Extra thick milkshake blend',
      total: 468.00,
      paymentMode: 'Online',
      status: 'FoodReady',
      items: ['Choco Belgian Shake (1x)', 'Kesar Badam Pista Milkshake (1x)'],
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSimulateNewOrder = () => {
    const sampleNames = ['Rohan Shinde', 'Pooja Deshmukh', 'Amitabh Patil', 'Snehal Kadam'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const isSwiggy = Math.random() > 0.5;
    const randomId = Math.floor(8250000000 + Math.random() * 90000000).toString();
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const randomBill = Math.floor(80 + Math.random() * 20).toString();

    const newOrder: MockOnlineOrder = {
      id: `o-${Date.now()}`,
      orderId: randomId,
      aggregator: isSwiggy ? 'Swiggy' : 'Zomato',
      customerName: randomName,
      customerPhone: '9822' + Math.floor(100000 + Math.random() * 900000),
      placedTime: `Placed at: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} | Today`,
      billNo: randomBill,
      otp: randomOtp,
      instructions: 'Handle with care, don\'t spill beverages',
      total: 290.00,
      paymentMode: 'Online',
      status: 'Pending',
      items: ['Oreo Thick Shake (1x)', 'Paneer Tikka Sandwich (1x)'],
    };

    setOrders((prev) => [newOrder, ...prev]);
    showToast(`🔔 New ${newOrder.aggregator} Order #${randomId} received from ${randomName}!`);
  };

  const handleMarkFoodReadyAll = () => {
    setOrders((prev) =>
      prev.map((o) => ({ ...o, status: 'FoodReady' }))
    );
    showToast('All pending orders marked as Food Ready & SignalR alert sent to KDS!');
  };

  const handleUpdateRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRider || !riderInputName.trim()) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderForRider.id
          ? { ...o, riderName: riderInputName.trim(), riderPhone: riderInputPhone.trim(), status: 'Dispatched' }
          : o
      )
    );
    showToast(`Assigned Rider ${riderInputName} for Order #${selectedOrderForRider.orderId}`);
    setSelectedOrderForRider(null);
    setRiderInputName('');
    setRiderInputPhone('');
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedAggregator !== 'All' && order.aggregator !== selectedAggregator) {
      return false;
    }
    if (searchOrderNo.trim() && !order.orderId.includes(searchOrderNo.trim())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto select-none p-3 sm:p-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 mb-3 shadow-xs">
        {/* Current Order / Online Order Tabs */}
        <div className="flex items-center space-x-6 text-sm font-bold">
          <button
            onClick={() => {
              setActiveTab('Current');
              navigate('/billing');
            }}
            className={`pb-1 transition-all ${
              activeTab === 'Current'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Current Order
          </button>
          <button
            onClick={() => setActiveTab('Online')}
            className={`pb-1 transition-all ${
              activeTab === 'Online'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Online Order ({orders.length})
          </button>
        </div>

        {/* Simulate Online Order & Back */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateNewOrder}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-bold text-xs flex items-center space-x-1.5 touch-btn shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{strings.simulateOrder}</span>
          </button>

          <button
            onClick={() => showToast('Refreshed orders list from MongoDB.')}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 touch-btn"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 touch-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Aggregator Channel Buttons (All / Zomato / Swiggy) */}
      <div className="flex items-center space-x-3 mb-3">
        <button
          onClick={() => setSelectedAggregator('All')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            selectedAggregator === 'All'
              ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <span className="bg-red-600 rounded-xs"></span>
            <span className="bg-orange-500 rounded-xs"></span>
            <span className="bg-slate-600 rounded-xs"></span>
            <span className="bg-red-400 rounded-xs"></span>
          </div>
          <span>All ({orders.length})</span>
        </button>

        <button
          onClick={() => setSelectedAggregator('Zomato')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            selectedAggregator === 'Zomato'
              ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[#cb202d] text-white flex items-center justify-center font-black text-[9px]">
            Z
          </div>
          <span>Zomato ({orders.filter((o) => o.aggregator === 'Zomato').length})</span>
        </button>

        <button
          onClick={() => setSelectedAggregator('Swiggy')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            selectedAggregator === 'Swiggy'
              ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[#fc8019] text-white flex items-center justify-center font-black text-[9px]">
            S
          </div>
          <span>Swiggy ({orders.filter((o) => o.aggregator === 'Swiggy').length})</span>
        </button>
      </div>

      {/* Pipeline Legend & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 mb-3 shadow-xs text-xs">
        {/* Colored Status Dots */}
        <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-600">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
            <span>Pending</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
            <span>Cancelled</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]"></span>
            <span>Food Is Ready</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
            <span>Dispatched</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
            <span>Delivered / Finished</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400"></span>
            <span>KOT or BILL Created</span>
          </span>
        </div>

        {/* Right Search, Sort & Food Ready Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-slate-500 font-medium">Sort By</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold bg-slate-50 focus:outline-none"
          >
            <option value="latest">Latest Date</option>
            <option value="oldest">Oldest Date</option>
            <option value="amount">Amount</option>
          </select>

          <input
            type="text"
            placeholder="Enter order no."
            value={searchOrderNo}
            onChange={(e) => setSearchOrderNo(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1 text-xs w-32 focus:outline-none focus:border-red-500 bg-slate-50"
          />

          <button
            onClick={handleMarkFoodReadyAll}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs touch-btn shadow-xs"
          >
            Food Ready
          </button>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4"
          >
            {/* Left Order Metadata */}
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  order.aggregator === 'Zomato' ? 'bg-red-600' : 'bg-orange-500'
                }`}
              >
                {order.aggregator.toLowerCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">{order.orderId}</span>
                  <span className="text-xs text-slate-500">
                    {order.aggregator} | The Magic Bottle - Milkshakes And Snacks
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>{order.placedTime}</span>
                  <span className="font-bold text-slate-800">Customer: {order.customerName}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-bold">
                    Bill No: {order.billNo}
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
                    OTP: {order.otp}
                  </span>
                  {order.instructions && (
                    <span className="text-red-600 flex items-center space-x-1 font-semibold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{order.instructions}</span>
                    </span>
                  )}
                  {order.riderName && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Rider: {order.riderName} ({order.riderPhone})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Total */}
            <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
              <span className="text-[11px] text-slate-400 uppercase">Total (₹)</span>
              <span className="text-lg font-black text-slate-900">₹{order.total.toFixed(2)}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {order.paymentMode}
              </span>
            </div>

            {/* Right Action Buttons */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button
                onClick={() => setSelectedOrderDetails(order)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-bold text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>

              <button
                onClick={() => alert(`Connecting to ${order.aggregator} Rider Chat Support... (Mock Channel Open)`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-bold text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Support</span>
              </button>

              <button
                onClick={() =>
                  alert(
                    `Delivery Status for #${order.orderId}:\nStatus: ${order.status}\nAssigned Rider: ${
                      order.riderName || 'Assigning soon'
                    }\nETA: 6 mins to restaurant`
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-bold text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery Status</span>
              </button>

              <button
                onClick={() => {
                  setSelectedOrderForRider(order);
                  setRiderInputName(order.riderName || '');
                  setRiderInputPhone(order.riderPhone || '');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-bold text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Update Rider Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedOrderDetails.aggregator} Order #{selectedOrderDetails.orderId}
                </h3>
                <p className="text-xs text-slate-500">Bill No: {selectedOrderDetails.billNo} • OTP: {selectedOrderDetails.otp}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800">Customer Details:</p>
                <p className="text-slate-600">{selectedOrderDetails.customerName} ({selectedOrderDetails.customerPhone || 'N/A'})</p>
                {selectedOrderDetails.instructions && (
                  <p className="text-red-600 font-semibold mt-1">Note: {selectedOrderDetails.instructions}</p>
                )}
              </div>

              <div className="border rounded-lg p-3 space-y-1">
                <p className="font-bold text-slate-800 mb-1">Ordered Line Items:</p>
                {selectedOrderDetails.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-0.5 border-b border-dashed border-slate-100">
                    <span>{it}</span>
                    <span className="font-bold">✓ Included</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-sm pt-2 text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs touch-btn"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Update Rider Modal */}
      {selectedOrderForRider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Update Rider & Dispatch</h3>
            <form onSubmit={handleUpdateRider} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Rider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={riderInputName}
                  onChange={(e) => setRiderInputName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rider Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9822114455"
                  value={riderInputPhone}
                  onChange={(e) => setRiderInputPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg touch-btn shadow-xs"
                >
                  Save & Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRider(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg touch-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
