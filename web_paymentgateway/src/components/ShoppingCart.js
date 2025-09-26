import React, { useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useRouter } from 'next/router';
import Image from 'next/image';

const TAX_RATE = 0.11;
const DELIVERY_FEE = 15000;
const ADMIN_FEE = 5000;

const ShoppingCart = ({ isOpen, onClose }) => {
  const { items, updateQuantity, clearCart } = useCart();
  const router = useRouter();

  const cartTotals = useMemo(() => {
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

    return { subtotal, tax, deliveryFee, adminFee, total };
  }, [items]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col rounded-l-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-pink-600">Shopping Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍩</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Your cart is empty</h3>
              <p className="text-gray-500">Add some sweet treats to get started!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item._id}
                className="flex items-center space-x-4 p-4 bg-pink-50 rounded-xl"
              >
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.currency} {formatPrice(item.price)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item._id, Math.max(0, item.quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-pink-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-pink-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({Math.round(TAX_RATE * 100)}%):</span>
                <span>{formatPrice(cartTotals.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{formatPrice(cartTotals.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Fee:</span>
                <span>{formatPrice(cartTotals.adminFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-pink-600">{formatPrice(cartTotals.total)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                router.push("/checkout");
                onClose();
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white font-semibold py-3 px-6 rounded-full transition"
            >
              Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-full transition"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ShoppingCart;