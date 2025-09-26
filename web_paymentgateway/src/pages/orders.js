import { useState, useEffect } from 'react';
import Head from 'next/head';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter, router } from 'next/router';
import Image from 'next/image';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      const savedEmail = localStorage.getItem('customerEmail');
      if (savedEmail) {
        setCustomerEmail(savedEmail);
        loadOrders(savedEmail);
        router.replace('/orders', undefined, { shallow: true });
      }
    }
  }, [router.query]);

  const loadOrders = async (email) => {
    if (!email) {
      setOrders([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        localStorage.setItem('customerEmail', email);
      } else {
        setError(data.error || 'Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    loadOrders(customerEmail.trim());
  };

  const handleClearSearch = () => {
    setCustomerEmail('');
    setOrders([]);
    setError(null);
    localStorage.removeItem('customerEmail');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800',
      'shipped': 'bg-pink-100 text-pink-800',
      'delivered': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'paid': '✅',
      'failed': '❌',
      'expired': '⏰',
      'shipped': '🚚',
      'delivered': '📦'
    };
    return icons[status] || 'ℹ️';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ID').format(price);
  };

  return (
    <>
      <Head>
        <title>My Orders - WEB_PaymentGateway</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-lg text-gray-600">Track and manage your purchase history</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
              <label className="block text-sm font-medium mb-2">
                Enter your email to view orders
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 input-field"
                  required
                />
                <button 
                  type="submit" 
                  className="btn-primary whitespace-nowrap"
                >
                  Search
                </button>
                {customerEmail && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {loading && (
            <div className="text-center py-8">
              <LoadingSpinner message="Loading orders..." />
            </div>
          )}

          {error && !loading && (
            <div className="error-message mb-6">
              <span>{error}</span>
              <button 
                onClick={() => loadOrders(customerEmail)} 
                className="btn-secondary ml-4"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="orders-container">
              {orders.length === 0 ? (
                <div className="empty-state text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {customerEmail ? 'No orders found' : 'Enter an email to search'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {customerEmail 
                      ? `No orders found for ${customerEmail}` 
                      : 'Please enter your email address to view your orders'}
                  </p>
                  {customerEmail ? (
                    <button 
                      onClick={() => window.location.href = '/products'}
                      className="btn-primary"
                    >
                      Start Shopping
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order._id} className="order-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="order-header flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                        <div>
                          <h3 className="order-id text-lg font-semibold text-gray-900 mb-1">
                            Order #{order.order_id}
                          </h3>
                          <span className="order-date text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <span className={`status-badge px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="order-items mb-6">
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              {item.product_image && (
                                <Image
                                  src={item.product_image} 
                                  alt={item.product_name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <span className="item-name font-medium">{item.product_name}</span>
                                <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <span className="item-price font-semibold">
                              {order.currency} {formatPrice(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer flex justify-between items-center">
                        <span className="order-total text-lg font-semibold">
                          Total: {order.currency} {formatPrice(order.total_amount)}
                        </span>
                        <div className="order-actions flex space-x-2">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="btn-secondary btn-small"
                          >
                            View Details
                          </button>
                          {order.status === 'paid' && (
                            <button className="btn-primary btn-small">
                              Track Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedOrder && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="modal-content bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="modal-header flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold">Order Details - #{selectedOrder.order_id}</h3>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium">Order Date:</label>
                        <p>{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <label className="font-medium">Payment Status:</label>
                        <p className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col'>
                            <label className="font-medium">Customer:</label>
                            <p>{selectedOrder.customer_name} ({selectedOrder.customer_email})</p>
                            </div>
                            {selectedOrder.shipping_address && (
                            <div>
                                <h4 className="font-medium mb-2">Shipping Address:</h4>
                                <p className="text-sm">
                                {selectedOrder.shipping_address.street}<br/>
                                {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}<br/>
                                {selectedOrder.shipping_address.country} {selectedOrder.shipping_address.zip_code}
                                </p>
                            </div>
                            )}
                    </div>

                    <br />

                    <div className='border-t pt-3'>
                      <h4 className="font-medium mb-2">Items Ordered:</h4>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span>{selectedOrder.currency} {formatPrice(item.unit_price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                      <h4 className="font-medium mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{selectedOrder.currency} {formatPrice(selectedOrder.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (11%):</span>
                          <span>{selectedOrder.currency} {formatPrice(selectedOrder.tax_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee:</span>
                          <span>{selectedOrder.currency} {formatPrice(selectedOrder.delivery_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Admin Fee:</span>
                          <span>{selectedOrder.currency} {formatPrice(selectedOrder.admin_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                          <span>Total Paid:</span>
                          <span>{selectedOrder.currency} {formatPrice(selectedOrder.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer p-6 border-t border-gray-200 text-right">
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}