// src/pages/admin/index.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  statusStats: Array<{ _id: string; count: number; totalAmount: number }>;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (token) {
      fetchDashboardData();
    }
  }, [user, token, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      setStats(data.data.summary);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Gine&apos;s Dessert</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your dessert shop</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-pink-600">
                  IDR {stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Orders</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/orders" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-3xl mb-3">📦</div>
                <h3 className="font-semibold text-gray-900">Manage Orders</h3>
                <p className="text-gray-600 text-sm mt-2">View and manage customer orders</p>
              </div>
            </Link>

            <Link href="/admin/products" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-3xl mb-3">🍰</div>
                <h3 className="font-semibold text-gray-900">Products</h3>
                <p className="text-gray-600 text-sm mt-2">Add and manage products</p>
              </div>
            </Link>

            <Link href="/admin/analytics" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-gray-600 text-sm mt-2">View sales analytics</p>
              </div>
            </Link>

            <Link href="/admin/settings" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-gray-600 text-sm mt-2">Configure shop settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}