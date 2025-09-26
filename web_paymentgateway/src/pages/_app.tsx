import { AppProps } from 'next/app';
import { CartProvider } from '../contexts/CartContext';
import Header from '../components/Header';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50">
        <Header />
        <main className="mx-auto">
          <Component {...pageProps} />
        </main>
        <Toaster />
        <footer className="bg-white/70 backdrop-blur-sm border-t border-pink-100 mt-10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} Gine&apos;s Dessert. All rights reserved.</p>
            <div className="flex space-x-4 mt-3 sm:mt-0">
              <a
                href="https://www.instagram.com/im_reegine/?__d=11"
                className="hover:text-pink-500 transition"
              >
                Instagram
              </a>
              <a href="#" className="hover:text-pink-500 transition">
                Video Mockup
              </a>
              <a
                href="mailto:regineangelina9@gmail.com?subject=Dessert%20Feedback&body=Hii%20Regine%2C%20I'm%20writing%20this%20to..."
                className="hover:text-pink-500 transition"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>      
    </CartProvider>
  );
}