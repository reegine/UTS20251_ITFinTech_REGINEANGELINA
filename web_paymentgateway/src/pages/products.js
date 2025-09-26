import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useCallback } from 'react';
import heroBg from '../../dummy_data/hero-bg2.png';


export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    inStock: false
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [categories, setCategories] = useState(['all']);

  const { items: cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = ['all', ...new Set(products.map(p => p.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        currency: 'IDR',
        ...(filters.search && { search: filters.search }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.inStock && { inStock: 'true' })
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results) {
        setProducts(data.results);
        setPagination(prev => ({
          ...prev,
          total: data.count || data.pagination?.total || 0,
          pages: data.pagination?.pages || Math.ceil((data.count || 0) / pagination.limit)
        }));
      } else {
        setProducts(data.data || data.products || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || data.count || 0,
          pages: data.pages || Math.ceil((data.total || data.count || 0) / pagination.limit)
        }));
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  }, [addToCart]);

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [updateQuantity, removeFromCart]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProducts = Array.isArray(products) ? products : [];

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <>
      <Head>
        <title>Products - WEB_PaymentGateway</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 py-16 md:py-24"
         style={{ backgroundImage: `url(${heroBg.src})` }} >
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Our Delicious Desserts
            </h1>
            <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
              Discover a variety of taste sensations
            </p>
            
            <div className="mt-6 flex justify-center space-x-2">
              {['🍰', '🍪', '🧁', '🍩', '🎂'].map((emoji, index) => (
                <span 
                  key={index}
                  className="text-2xl opacity-80 animate-bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col gap-4 mb-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bg-pink-600 text-white px-4 py-1.5 rounded-md hover:bg-pink-700 transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Browse Categories</h3>
                  {filters.category !== 'all' && (
                    <button 
                      onClick={() => handleFilterChange('category', 'all')}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      View All
                    </button>
                  )}
                </div>
                
                <div className="hidden md:block">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => {
                      const isActive = filters.category === category;
                      return (
                        <button
                          key={category}
                          onClick={() => handleFilterChange('category', category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-pink-600 text-white shadow-md transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                          }`}
                        >
                          {category === 'all'
                            ? 'All Categories'
                            : category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="md:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(category => {
                      const isActive = filters.category === category;
                      return (
                        <button
                          key={category}
                          onClick={() => handleFilterChange('category', category)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-pink-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category === 'all'
                            ? 'All Categories'
                            : category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {filters.category !== 'all' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing products in: <span className="font-medium text-pink-600">
                        {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">
                <span>{error}</span>
                <button onClick={loadProducts} className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                  Try Again
                </button>
              </div>
            )}

            {!error && (
              <>
                <div className="mb-6 text-center">
                  <span className="text-gray-600">
                    {filters.category !== 'all' && ` in ${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}`}
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or select a different category</p>
                    <button 
                      onClick={() => {
                        setSearchInput('');
                        setFilters({
                          search: '',
                          category: 'all',
                          minPrice: '',
                          maxPrice: '',
                          inStock: false
                        });
                      }}
                      className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Show All Products
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map(product => (
                        <ProductCard
                          key={product._id || product.id}
                          product={product}
                          inCart={cartItems.some(item => item._id === product._id)}
                          quantity={cartItems.find(item => item._id === product._id)?.quantity || 0}
                          onAddToCart={() => handleAddToCart(product)}
                          onQuantityChange={(newQty) => handleQuantityChange(product._id, newQty)}
                        />
                      ))}
                    </div>

                    {pagination.pages > 1 && (
                      <div className="mt-12 flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === pagination.pages || 
                            Math.abs(page - pagination.page) <= 1
                          )
                          .map((page, index, array) => (
                            <span key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 border rounded-lg transition-colors ${
                                  pagination.page === page 
                                    ? 'bg-pink-600 text-white border-pink-600' 
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </span>
                          ))
                        }
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}