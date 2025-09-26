import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import heroBg from '../../dummy_data/hero-bg.png';
import Image from 'next/image';
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=3');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.results) {
        setFeaturedProducts(data.results);
      } else if (data.data) {
        setFeaturedProducts(data.data);
      } else {
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ID').format(price);
  };

  const features = [
    {
      icon: '🍰',
      title: 'Freshly Made',
      description: 'Every dessert is crafted with love and fresh ingredients daily.',
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Sweet treats delivered straight to your door in no time.',
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Xendit-powered checkout with multiple safe payment options.',
    },
  ];

  return (
    <>
      <Head>
        <title>Regine’s Dessert – Favorite Dessert Shop</title>
        <meta
          name="description"
          content="Order your favorite desserts online with fast delivery and secure payments."
        />
      </Head>

      <section
        className="relative flex items-center justify-center bg-cover bg-center bg-no-repeat min-h-[60vh]"
        style={{ backgroundImage: `url(${heroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pb-[1rem] pt-[3rem]">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6 leading-tight">
            Indulge in <span className="text-pink-400">Sweet Moments</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Order delicious desserts online and enjoy fast, reliable delivery straight to your door.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white font-semibold shadow-xl transition transform hover:scale-105"
            >
              Shop Now
            </Link>
            <Link
              href="/products"
              className="px-8 py-4 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 text-pink-600 font-semibold shadow-md hover:bg-pink-50 transition transform hover:scale-105"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </section>

      <section className="pt-24 pb-18 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Our Bestsellers</h2>
            <p className="text-lg text-gray-600">Taste the favorites loved by our customers</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-gray-600">Loading desserts...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-10">
              {featuredProducts.map((product) => (
                <div key={product._id} className="...">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="w-full h-56 object-cover rounded-2xl mb-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Dessert+Image';
                    }}
                  />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-xl font-bold text-pink-600">
                      {product.currency} {formatPrice(product.price)}
                    </span>
                    <Link
                      href="/products"
                      className="px-5 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-14">
            <Link
              href="/products"
              className="px-8 py-3 rounded-full bg-white border border-pink-300 text-pink-600 font-semibold hover:bg-pink-50 shadow-md transition"
            >
              View All Desserts →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Why Gine’s Dessert?</h2>
            <p className="text-lg text-gray-600">We make sweet moments even sweeter.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-3xl bg-pink-50 p-10 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition transform"
              >
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-gradient-to-r from-pink-500 to-rose-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Craving Something Sweet?
          </h2>
          <p className="text-lg md:text-xl mb-10 opacity-90">
            Order now and let us deliver happiness to your doorstep.
          </p>
          <Link
            href="/products"
            className="px-10 py-4 bg-white text-pink-600 hover:bg-gray-100 rounded-full font-semibold shadow-lg transition transform hover:scale-105"
          >
            Order YOUR Desserts
          </Link>
        </div>
      </section>
    </>
  );
}
