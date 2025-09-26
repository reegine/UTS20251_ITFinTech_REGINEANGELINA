import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useCallback } from 'react';


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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [categories, setCategories] = useState(['all']);

  const { addToCart } = useCart();

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
      
      console.log('API Response:', data);
      
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

  const handleAddToCart = useCallback((product) => {
      addToCart(product);
      toast.success(`${product.name} added to cart!`);
    }, [addToCart]);

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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Products</h1>
            <p className="text-lg text-gray-600">Discover our amazing collection</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            <svg className="w-8 h-8 text-gray-500 justify-center pt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            
            <div className="flex-2">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full py-2 pl-3 pr-10 border rounded-lg appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              <span>{error}</span>
              <button onClick={loadProducts} className="ml-4 bg-gray-200 px-3 py-1 rounded">
                Try Again
              </button>
            </div>
          )}

          {!error && (
            <>
              <div className="mb-6">
                <span className="text-gray-600">
                  Showing {filteredProducts.length} of {pagination.total} products
                  {filters.search && ` for "${filters.search}"`}
                  {filters.category !== 'all' && ` in ${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} category`}
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                  <button 
                    onClick={() => setFilters({
                      search: '',
                      category: 'all',
                      minPrice: '',
                      maxPrice: '',
                      inStock: false
                    })}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg"
                  >
                    Show All Products
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-12 flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                              <span className="px-2">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 border rounded-lg ${
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
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
    </>
  );
}