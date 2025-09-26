import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import ShoppingCart from './ShoppingCart';
import Image from 'next/image';
import Logo from '../../dummy_data/logo5.png'


export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
                <Image 
                    src={Logo}
                    alt="Regine's Dessert Logo"
                    width={40}
                    height={40}
                    className="object-contain rounded-full"
                    onError={(e) => { e.target.src = "https://artirasajkt.com/wp-content/uploads/2025/05/image-removebg-preview-17-1.png"; }}
                />
                <span className="text-xl font-semibold text-gray-800 tracking-tight">
                Gine
                </span>
            </Link>
            <div className="flex items-center space-x-8">
                {["/products", "/orders"].map((path, i) => (
                <Link
                    key={i}
                    href={path}
                    className={`font-medium transition relative py-2 ${
                    isActive(path)
                        ? "text-pink-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-pink-500"
                        : "text-gray-700 hover:text-pink-600"
                    }`}
                >
                    {path === "/products" ? "Products" : "My Orders"}
                </Link>
                ))}
                <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 rounded-full bg-pink-50 hover:bg-pink-100 transition"
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
                {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {getTotalItems()}
                    </span>
                )}
                </button>
            </div>
            </div>
        </div>
        </nav>


      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}