import React, { useState, useEffect } from 'react';
import { Order, AnalyticsStats } from '../types.ts';
import { fetchOrders, fetchStats, updateOrderStatus } from '../services/api.ts';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    const [fetchedOrders, fetchedStats] = await Promise.all([
      fetchOrders(),
      fetchStats()
    ]);
    setOrders(fetchedOrders);
    setStats(fetchedStats);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.recipient_mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/logo-takealot.svg" alt="takealot.com" className="h-6" />
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Database Admin
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
              Orders & Conversion Management
            </h1>
            <p className="text-sm text-slate-500">
              High-performance SQLite database &bull; Real-time tracking &bull; Instant order capture
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/export-orders"
              download="takealot_orders.csv"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </a>

            <button
              onClick={loadData}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 transition-colors"
              title="Refresh database records"
              type="button"
            >
              &#8635; Refresh
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0b79d0] hover:bg-[#0966b0] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              type="button"
            >
              Return to Store &rarr;
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Visitors
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalViews.toLocaleString()}
              </div>
              <span className="text-xs text-blue-600 font-medium">Page views recorded</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Initiated Checkouts
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalCheckouts.toLocaleString()}
              </div>
              <span className="text-xs text-amber-600 font-medium">Delivery details opened</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Captured Orders
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {stats.totalOrders}
              </div>
              <span className="text-xs text-slate-500">
                Revenue: R {(stats.totalRevenue || 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Conversion Rate
              </span>
              <div className="text-2xl font-extrabold text-[#0b79d0] mt-1">
                {stats.conversionRate}
              </div>
              <span className="text-xs text-slate-500">Visitors to orders</span>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by customer name, phone, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b79d0]"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-500 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0b79d0]"
            >
              <option value="ALL">All Statuses</option>
              <option value="initiated_payment">Initiated Payment</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Orders List ({filteredOrders.length})
            </h2>
            <span className="text-xs text-slate-400">
              Sorted by latest first
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b79d0]"></div>
              <p className="mt-2 text-sm">Loading orders from database...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <p className="text-base font-medium text-slate-600">No orders found</p>
              <p className="text-xs text-slate-400 mt-1">
                When visitors complete the checkout flow, their orders will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Delivery Address</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Marketing / UTM</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {o.order_id}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {o.recipient_name || 'N/A'}
                        </div>
                        <div className="text-xs text-[#0b79d0] font-mono mt-0.5">
                          {o.recipient_mobile || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs font-medium text-slate-700">
                          {[o.complex, o.street_address].filter(Boolean).join(', ')}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {[o.suburb, o.city, o.province, o.postal_code].filter(Boolean).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-600">
                          R {o.product_price}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Next day delivery
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {o.utm_source ? (
                          <div className="text-xs space-y-0.5">
                            <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                              src: {o.utm_source}
                            </span>
                            {o.utm_campaign && (
                              <div className="text-[11px] text-slate-400">
                                cmp: {o.utm_campaign}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">Direct</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${
                            o.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.status === 'shipped'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : o.status === 'delivered'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="initiated_payment">Initiated Payment</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
