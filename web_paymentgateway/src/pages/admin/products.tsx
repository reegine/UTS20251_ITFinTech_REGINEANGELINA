// src/pages/admin/products.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Notification, { NotificationProps } from '../../components/Notification';
import { useNotification } from '../../hook/useNotification';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
  is_active: boolean;
}

export default function AdminProducts() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId: string | null; productName: string }>({
    show: false,
    productId: null,
    productName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to be loaded
    if (user !== undefined) {
      setAuthChecked(true);
      
      if (!user || user.role !== 'admin') {
        router.push('/');
        return;
      }
      
      if (token) {
        fetchProducts();
      }
    }
  }, [user, token, router]);

  const fetchProducts = async () => {
    if (!token) {
      console.error('❌ No token available');
      showNotification('error', 'Authentication required');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching products with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          showNotification('error', 'Authentication failed. Please login again.');
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch products`);
      }

      const data = await response.json();
      console.log('✅ Products fetched successfully:', data.data.length);
      setProducts(data.data);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      showNotification('error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteConfirm({
      show: true,
      productId,
      productName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.productId || !token) return;

    setDeleting(true);
    try {
      console.log('🔄 Deleting product:', deleteConfirm.productId);
      
      const response = await fetch(`/api/admin/products/${deleteConfirm.productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete failed:', errorText);
        throw new Error(`Failed to delete product: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Delete successful:', result);

      // Remove the product from state immediately for better UX
      setProducts(prev => prev.filter(product => product._id !== deleteConfirm.productId));
      
      showNotification('success', 'Product permanently deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      showNotification('error', `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Refresh the list if deletion failed
      fetchProducts();
    } finally {
      setDeleting(false);
      setDeleteConfirm({ show: false, productId: null, productName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, productId: null, productName: '' });
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Products - Admin</title>
      </Head>
      
      {/* Notification Component */}
      <Notification
        type={notification.type as NotificationProps['type']}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={3000}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.productName}"</strong>? This action cannot be undone and the product will be permanently removed from the system.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
              <p className="text-gray-600">Add, edit, and manage your dessert products</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
            >
              Add Product
            </button>
          </div>

          {showForm && (
            <ProductForm
              product={editingProduct}
              onClose={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              onSave={() => {
                setShowForm(false);
                setEditingProduct(null);
                fetchProducts();
              }}
              token={token}
              showNotification={showNotification}
            />
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-pink-600">
                      IDR {product.price.toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <div>Stock: {product.stock}</div>
                    <div>Category: {product.category}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product._id, product.name)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Product Form Component with Image Upload
function ProductForm({ product, onClose, onSave, token, showNotification }: any) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    image_url: product?.image_url || '',
    stock: product?.stock || '',
    category: product?.category || 'dessert',
    is_active: product?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');
  const [useImageUpload, setUseImageUpload] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showNotification('error', 'Authentication required');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // If user uploaded a file, upload it first
      if (useImageUpload && imageFile) {
        imageUrl = await uploadImageToServer(imageFile);
      }

      const url = product 
        ? `/api/admin/products/${product._id}`
        : '/api/admin/products';

      const method = product ? 'PUT' : 'POST';

      console.log('🔄 Making request to:', {
        url,
        method,
        hasToken: !!token,
        productId: product?._id
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl
        }),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product saved successfully:', result);
      
      // Show success notification
      showNotification('success', 
        product 
          ? 'Product updated successfully!' 
          : 'Product created successfully!'
      );
      
      onSave();
    } catch (error) {
      console.error('❌ Error saving product:', error);
      showNotification('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearImageUpload = () => {
    setImageFile(null);
    setImagePreview('');
    setUseImageUpload(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (IDR)</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          {/* Image Input Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            
            {/* Toggle between URL and Upload */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUseImageUpload(false)}
                className={`px-3 py-2 text-sm rounded-md transition ${
                  !useImageUpload 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setUseImageUpload(true)}
                className={`px-3 py-2 text-sm rounded-md transition ${
                  useImageUpload 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upload Image
              </button>
            </div>

            {!useImageUpload ? (
              <div>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP. Max size: 5MB</p>
              </div>
            )}

            {/* Image Preview */}
            {(imagePreview || formData.image_url) && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img
                  src={imagePreview || formData.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                {useImageUpload && imageFile && (
                  <button
                    type="button"
                    onClick={clearImageUpload}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove uploaded image
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-pink-600 text-white py-2 px-4 rounded hover:bg-pink-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}