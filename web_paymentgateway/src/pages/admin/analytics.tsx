// src/pages/admin/analytics.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Notification from '../../components/Notification';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function AdminAnalytics() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<'day'|'month'|'week'|'year'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ isVisible: false, type: 'info' as any, message: '' });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    // Only fetch analytics if we have a user and token
    if (user && token) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, period, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      // Check if token exists before making the request
      if (!token) {
        setNotif({ 
          isVisible: true, 
          type: 'error', 
          message: 'Authentication token not found. Please login again.' 
        });
        return;
      }

      setLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error('Failed to fetch analytics');
      }
      
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch analytics data');
      }
      
      const revenue = json.data.revenueData || [];
      // normalize revenue data into simple array for chart
      const normalized = revenue.map((r: any) => {
        const id = r._id;
        let label = '';
        if (period === 'day') label = `${id.year}-${String(id.month).padStart(2,'0')}-${String(id.day).padStart(2,'0')}`;
        else if (period === 'week') label = `W${id.week} ${id.year}`;
        else if (period === 'year') label = `${id.year}`;
        else label = `${id.year}-${String(id.month).padStart(2,'0')}`;
        return { label, totalRevenue: r.totalRevenue, orderCount: r.orderCount };
      });
      setData(normalized);
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      setNotif({ 
        isVisible: true, 
        type: 'error', 
        message: 'Gagal ambil data analytics: ' + (error.message || 'Unknown error') 
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Access Denied</div>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Analytics - Admin</title></Head>

      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Grafik omzet & total pembelian. Filter tanggal untuk rentang kustom.</p>
          </div>

          {/* Filters - Responsive Layout */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4 sm:mb-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-xs sm:text-sm text-gray-700 block mb-1">Periode:</label>
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value as any)} 
                  className="border rounded px-3 py-2 text-sm w-full"
                >
                  <option value="day">Per hari</option>
                  <option value="week">Per minggu</option>
                  <option value="month">Per bulan</option>
                  <option value="year">Per tahun</option>
                </select>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 block mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="border rounded px-3 py-2 text-sm w-full" 
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-gray-700 block mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="border rounded px-3 py-2 text-sm w-full" 
                />
              </div>

              <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
                <button 
                  onClick={fetchAnalytics} 
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:bg-pink-400 text-sm font-medium transition-colors"
                >
                  {loading ? 'Loading...' : 'Apply'}
                </button>
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setPeriod('month'); }} 
                  disabled={loading}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Chart and Table Container */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-pink-400 border-t-transparent rounded-full mb-4"></div>
                <p className="text-sm text-gray-500">Loading analytics...</p>
              </div>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Omzet ({period})</h3>
                {data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                    Tidak ada data untuk rentang ini.
                  </div>
                ) : (
                  <>
                    {/* Chart */}
                    <div className="w-full h-64 sm:h-80 lg:h-96 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ fontSize: '12px' }}
                            formatter={(value: any) => ['IDR ' + Number(value).toLocaleString(), 'Omzet']}
                          />
                          <Bar dataKey="totalRevenue" name="Omzet (IDR)" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table - Responsive */}
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                          {/* Desktop Table */}
                          <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Periode
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Omzet (IDR)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Pesanan
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {data.map((d, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{d.label}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                    IDR {Number(d.totalRevenue).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {d.orderCount}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Mobile Card View */}
                          <div className="sm:hidden space-y-3 px-4">
                            {data.map((d, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="text-sm font-semibold text-gray-900 mb-3">
                                  {d.label}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Omzet</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      IDR {Number(d.totalRevenue).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Total Pesanan</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {d.orderCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Notification
        type={notif.type}
        message={notif.message}
        isVisible={notif.isVisible}
        onClose={() => setNotif(prev => ({ ...prev, isVisible: false }))}
        duration={5000}
      />
    </>
  );
}