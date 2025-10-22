// src/pages/admin/orders.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Notification from '../../components/Notification';

interface Order {
  _id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  createdAt: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

// Improved fetchWithRetry with better error handling
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    // Don't retry on 4xx errors (client errors) - these won't succeed with retries
    if (response.status >= 400 && response.status < 500) {
      return response;
    }
    
    // Only retry on 5xx errors (server errors) or network errors
    if (!response.ok && response.status >= 500 && retries > 0) {
      console.log(`Retrying request, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying request after error, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

export default function AdminOrders() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [pagination, setPagination] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isFetching, setIsFetching] = useState(false); // Prevent concurrent requests
  // notification state
  const [notif, setNotif] = useState({ isVisible: false, type: 'info' as any, message: '' });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    // Only fetch if we have a token and not currently fetching
    if (token && !isFetching) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, statusFilter, startDate, endDate, searchProduct, page]);

  const fetchOrders = async () => {
    // Prevent multiple simultaneous requests
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      setLoading(true);
      
      // Check if token exists
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const url = `/api/admin/orders?${params.toString()}`;
      
      console.log('Fetching orders from:', url);
      
      // Use fetchWithRetry here
      const response = await fetchWithRetry(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle different HTTP status codes appropriately
      if (!response.ok) {
        let errorMessage = `Failed to fetch orders: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `${errorMessage} - ${errorText}`;
            }
          } catch (textError) {
            // Ignore if we can't get text either
          }
        }
        
        // Special handling for authentication errors
        if (response.status === 401 || response.status === 403) {
          showNotif('error', 'Session expired. Please log in again.');
          // Optionally redirect to login
          // router.push('/login');
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      let fetched: Order[] = data.data || [];
      
      // Client-side filtering for product search
      if (searchProduct) {
        const q = searchProduct.toLowerCase();
        fetched = fetched.filter(o => 
          o.items.some(it => (it.product_name || '').toLowerCase().includes(q))
        );
      }
      
      setOrders(fetched);
      setPagination(data.pagination || null);
      
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      
      // Don't show error notification for cancelled requests or if component unmounted
      if (error.name !== 'AbortError') {
        const errorMessage = error.message || 'Unknown error occurred';
        showNotif('error', 'Gagal mengambil daftar pesanan: ' + errorMessage);
      }
      
      // Set empty orders on error to prevent UI issues
      setOrders([]);
      setPagination(null);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      // Try to parse error as JSON first
      let errorMessage = `Failed to update order: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If not JSON, get text
        try {
          const errorText = await response.text();
          if (errorText && !errorText.includes('<!DOCTYPE html>')) {
            errorMessage = `${errorMessage} - ${errorText}`;
          }
        } catch {
          // Ignore if we can't get text
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    showNotif('success', data.message || `Status pesanan diubah menjadi ${newStatus}`);
    // Refresh current page
    fetchOrders();
  } catch (error: any) {
    console.error('Error updating order:', error);
    
    // Check if it's a 404 error specifically
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      showNotif('error', 'API endpoint not found. Please check if the server is running correctly.');
    } else {
      showNotif('error', 'Gagal mengubah status: ' + (error.message || error));
    }
  }
};

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const showNotif = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotif({ isVisible: true, type, message });
  };

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <>
      <Head>
        <title>Manage Orders - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-gray-600">Lihat pesanan, detail produk yang di-checkout, dan ubah statusnya.</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200 flex flex-wrap gap-3 items-center">
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} 
              className="border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending (Waiting Payment)</option>
              <option value="paid">Paid (Lunas)</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>

            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }} 
              className="border rounded px-3 py-2" 
              disabled={loading}
            />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }} 
              className="border rounded px-3 py-2" 
              disabled={loading}
            />

            <input 
              type="text" 
              placeholder="Search product name..." 
              value={searchProduct} 
              onChange={(e) => { setSearchProduct(e.target.value); setPage(1); }} 
              className="border rounded px-3 py-2 flex-1 min-w-[200px]" 
              disabled={loading}
            />

            <button 
              onClick={() => { 
                setStartDate(''); 
                setEndDate(''); 
                setStatusFilter('all'); 
                setSearchProduct(''); 
                setPage(1); 
              }} 
              className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50"
              disabled={loading}
            >
              Reset
            </button>
            
            {/* Refresh button */}
            <button 
              onClick={fetchOrders} 
              className="px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
              {(statusFilter !== 'all' || startDate || endDate || searchProduct) && (
                <button 
                  onClick={() => {
                    setStatusFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setSearchProduct('');
                    setPage(1);
                  }}
                  className="mt-2 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="align-top">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_id}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{order.customer_name}</div>
                        <div className="text-gray-400 text-xs">{order.customer_email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button onClick={() => toggleExpand(order._id)} className="text-left underline text-sm">
                          {order.items.length} produk — lihat detail
                        </button>

                        {expanded[order._id] && (
                          <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-100">
                            {order.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div>
                                  <div className="font-medium">{it.product_name}</div>
                                  <div className="text-xs text-gray-500">Qty: {it.quantity} × IDR {it.unit_price.toLocaleString()}</div>
                                </div>
                                <div className="font-semibold">IDR {(it.quantity * it.unit_price).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">IDR {order.total_amount.toLocaleString()}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)} 
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                          disabled={loading}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && (
                <div className="px-6 py-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-600">Total: {pagination.total} pesanan</div>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={page <= 1 || loading} 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-sm">{pagination.page} / {pagination.pages}</span>
                    <button 
                      disabled={page >= pagination.pages || loading} 
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} 
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Notification
        type={notif.type}
        message={notif.message}
        isVisible={notif.isVisible}
        onClose={() => setNotif(prev => ({ ...prev, isVisible: false }))}
        duration={4000}
      />
    </>
  );
}