import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import Head from 'next/head';

const TAX_RATE = 0.11;
const DELIVERY_FEE = 15000; 
const ADMIN_FEE = 5000;

export default function Checkout() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Indonesia',
      zip_code: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const orderTotals = useMemo(() => {
    if (items.length === 0) return {
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      adminFee: 0,
      total: 0
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const deliveryFee = DELIVERY_FEE;
    const adminFee = ADMIN_FEE;
    const total = subtotal + tax + deliveryFee + adminFee;

    return {
      subtotal,
      tax,
      deliveryFee,
      adminFee,
      total
    };
  }, [items]);

    useEffect(() => {
        if (!paymentUrl || !order) return;

        const pollInterval = setInterval(async () => {
            try {
            // Check payment status directly
            const response = await fetch(`/api/payments/status?order_id=${order.order_id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch payment status');
            }
            
            const result = await response.json();
            
            if (result.success) {
                const paymentStatus = result.data.status;
                
                if (paymentStatus !== 'pending') {
                clearInterval(pollInterval);
                setPaymentStatus(paymentStatus);
                
                if (paymentStatus === 'paid') {
                    // Show success splash for 3 seconds then redirect
                    clearCart();
                    setTimeout(() => {
                    router.push('/orders?success=true');
                    }, 3000);
                }
                }
            }
            } catch (error) {
            console.error('Polling error:', error);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(pollInterval);
        }, [paymentUrl, order, clearCart, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCustomerInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!customerInfo.phone) {
      setError('Phone number is required for payment processing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: customerInfo.address,
        items: items.map(item => ({
          product_id: item._id,
          quantity: item.quantity
        })),
        subtotal: orderTotals.subtotal,
        tax_amount: orderTotals.tax,
        delivery_fee: orderTotals.deliveryFee,
        admin_fee: orderTotals.adminFee,
        total_amount: orderTotals.total
      };

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      setOrder(orderResult.data);

      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            order_id: orderResult.data.order_id
        }),
    });

      const contentType = paymentResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await paymentResponse.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an error page');
      }

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to create payment');
      }

      setPaymentUrl(paymentResult.data.payment_url);
      setIframeLoaded(false);

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    console.log('Payment iframe loaded successfully');
  };

  const handleIframeError = () => {
    console.error('Failed to load payment iframe');
    setError('Failed to load payment gateway. Please try again.');
  };

  if (items.length === 0 && !paymentUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <button 
            onClick={() => router.push('/products')} 
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - WEB_PaymentGateway</title>
      </Head>

      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item._id} className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center space-x-4">
                      <image 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                        }}
                      />
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(orderTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({Math.round(TAX_RATE * 100)}%):</span>
                  <span>{formatPrice(orderTotals.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatPrice(orderTotals.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin Fee:</span>
                  <span>{formatPrice(orderTotals.adminFee)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatPrice(orderTotals.total)}</span>
                  </div>
                </div>
                <div className='h-[1rem]'></div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                        <li>• Complete your payment in the embedded form</li>
                        <li>• Do not close or refresh this page during payment</li>
                        <li>• Payment status will update automatically</li>
                        <li>• You will be redirected after successful payment</li>
                    </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!paymentUrl ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={customerInfo.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={customerInfo.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Street Address</label>
                          <input
                            type="text"
                            name="address.street"
                            value={customerInfo.address.street}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">City</label>
                            <input
                              type="text"
                              name="address.city"
                              value={customerInfo.address.city}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">State</label>
                            <input
                              type="text"
                              name="address.state"
                              value={customerInfo.address.state}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Country</label>
                            <input
                              type="text"
                              name="address.country"
                              value={customerInfo.address.country}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">ZIP Code</label>
                            <input
                              type="text"
                              name="address.zip_code"
                              value={customerInfo.address.zip_code}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processing...' : `Pay ${formatPrice(orderTotals.total)}`}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-6">Complete Your Payment</h2>
                  
                  {paymentStatus === 'paid' ? (
                    <div className="text-center py-8">
                      <div className="text-green-500 text-6xl mb-4">✅</div>
                      <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
                      <p className="text-gray-600 mb-6">
                        Thank you for your purchase. Your order has been confirmed.
                        Redirecting to orders page...
                      </p>
                      <div className="animate-pulse">
                        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
                      </div>
                    </div>
                  ) : paymentStatus === 'failed' || paymentStatus === 'expired' ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 text-6xl mb-4">❌</div>
                      <h3 className="text-2xl font-bold mb-2">
                        Payment {paymentStatus === 'failed' ? 'Failed' : 'Expired'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {paymentStatus === 'failed' 
                          ? 'Your payment was unsuccessful. Please try again.'
                          : 'The payment session has expired. Please start a new payment.'
                        }
                      </p>
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            setPaymentUrl(null);
                            setPaymentStatus(null);
                          }}
                          className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700"
                        >
                          Try Again
                        </button>
                        <button
                          onClick={() => router.push('/products')}
                          className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300"
                        >
                          Back to Shopping
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-pink-700 font-semibold">Order ID: {order?.order_id}</p>
                            <p className="text-pink-600">Amount: {formatPrice(order?.total_amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-pink-600">Status: <span className="font-semibold">Pending</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Secure Payment</h3>
                          {!iframeLoaded && (
                            <div className="flex items-center text-gray-500">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-600 rounded-full animate-spin mr-2"></div>
                              Loading...
                            </div>
                          )}
                        </div>
                        
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            src={paymentUrl}
                            title="Xendit Payment Gateway"
                            className="w-full h-[30rem]"
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                            sandbox="allow-same-origin allow-forms allow-scripts allow-popups allow-top-navigation"
                            style={{ 
                              border: 'none',
                              minHeight: '400px'
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-600 rounded-full animate-spin mr-3"></div>
                          <span className="text-gray-600">Waiting for payment confirmation...</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}