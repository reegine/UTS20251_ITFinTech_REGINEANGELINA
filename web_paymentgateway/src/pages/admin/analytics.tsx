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
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, period, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
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
      console.error(error);
      setNotif({ isVisible: true, type: 'error', message: 'Gagal ambil data analytics: ' + (error.message || '') });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return <div>Access Denied</div>;

  return (
    <>
      <Head><title>Analytics - Admin</title></Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600">Grafik omzet & total pembelian. Filter tanggal untuk rentang kustom.</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200 flex items-center gap-3">
            <label className="text-sm">Periode:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="border rounded px-3 py-2">
              <option value="day">Per hari</option>
              <option value="week">Per minggu</option>
              <option value="month">Per bulan</option>
              <option value="year">Per tahun</option>
            </select>

            <label className="text-sm">Start</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-3 py-2" />
            <label className="text-sm">End</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-3 py-2" />

            <button onClick={fetchAnalytics} className="ml-auto px-4 py-2 bg-pink-600 text-white rounded">Apply</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); setPeriod('month'); }} className="px-3 py-2 border rounded">Reset</button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="animate-spin h-10 w-10 border-4 border-pink-400 border-t-transparent rounded-full mx-auto"></div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Omzet ({period})</h3>
                {data.length === 0 ? (
                  <div className="text-gray-500">Tidak ada data untuk rentang ini.</div>
                ) : (
                  <div style={{ width: '100%', height: 360 }}>
                    <ResponsiveContainer>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalRevenue" name="Omzet (IDR)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Simple table for clarity */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Omzet (IDR)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Pesanan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2 text-sm">{d.label}</td>
                          <td className="px-4 py-2 text-sm text-right">IDR {Number(d.totalRevenue).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{d.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
