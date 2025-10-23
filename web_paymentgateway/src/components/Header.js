import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import ShoppingCart from './ShoppingCart';
import Image from 'next/image';
import Logo from '../../dummy_data/logo5.png';
import Notification from '../components/Notification';
import { useNotification } from '../hook/useNotification';

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const isActive = (path) => router.pathname === path;

  const navigationItems = [
    { path: "/products", label: "Products" },
    { path: "/orders", label: "My Orders" }
  ];

  if (user?.role === 'admin') {
    navigationItems.push({ path: "/admin", label: "Admin" });
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('success', 'Logged out successfully!');
      closeMobileMenu();
      
      // Wait a moment to show the notification before redirecting
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('error', 'Failed to logout. Please try again.');
    }
  };

  const handleCartClick = () => {
    if (!user) {
      // Immediately redirect to login page
      router.push('/auth/login');
      return;
    }
    
    setIsCartOpen(true);
    // Show notification if cart is empty
    if (getTotalItems() === 0) {
      showNotification('info', 'Your cart is empty. Add some products!');
    }
  };

  // Cart button component to reuse in both desktop and mobile views
  const CartButton = ({ className = "" }) => (
    <button
      onClick={handleCartClick}
      className={`relative p-3 rounded-full bg-pink-50 hover:bg-pink-100 transition ${className}`}
    >
      <svg
        className="w-6 h-6 text-pink-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 
          2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 
          2 0 100 4 2 2 0 000-4zm-8 
          2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {user && getTotalItems() > 0 && (
        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
          {getTotalItems()}
        </span>
      )}
    </button>
  );

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
              onClick={closeMobileMenu}
            >
              <Image 
                src={Logo}
                alt="Regine's Dessert Logo"
                width={40}
                height={40}
                className="object-contain rounded-full"
                onError={(e) => { e.target.src = "https://artirasajkt.com/wp-content/uploads/2025/05/image-removebg-preview-17-1.png"; }}
              />
              <span className="text-xl font-semibold text-gray-800 tracking-tight sm:block">
                Gine
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`font-medium transition relative py-2 ${
                    isActive(item.path)
                      ? "text-pink-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-pink-500"
                      : "text-gray-700 hover:text-pink-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <span className="text-sm text-gray-700">Hello, {user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-gray-700 hover:text-pink-600 transition text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition text-sm font-medium"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
              
              <CartButton />
            </div>

            <div className="flex md:hidden items-center space-x-4">
              <CartButton className="p-2" />

              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:text-pink-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-white border-t border-gray-200`}>
          <div className="px-4 py-4 space-y-4">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobileMenu}
                className={`block py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-pink-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-600">
                    Hello, {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-4 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pink-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-pink-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg text-base font-medium bg-pink-600 text-white hover:bg-pink-700 transition-colors mt-2"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`block py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-pink-600'
                }`}
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Only show ShoppingCart if user is logged in */}
      {user && (
        <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}

      {/* Notification Component */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={3000}
      />
    </>
  );
}