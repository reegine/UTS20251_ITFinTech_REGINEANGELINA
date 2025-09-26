import { useCart } from '../contexts/CartContext';

export default function ProductCard({ product, onAddToCart }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    if (onAddToCart) onAddToCart();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ID').format(price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
    <div className="relative h-56 overflow-hidden">
        <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=Dessert")}
        />
        {product.stock <= 0 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
        </div>
        )}
    </div>

    <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex justify-between items-center mb-4">
        <span className="text-xl font-bold text-pink-600">
            {product.currency} {formatPrice(product.price)}
        </span>
        <span
            className={`text-sm ${
            product.stock > 0 ? "text-green-600" : "text-red-500"
            }`}
        >
            {product.stock > 0 ? `${product.stock} left` : "Out"}
        </span>
        </div>

        <button
        onClick={onAddToCart}
        disabled={product.stock <= 0}
        className={`w-full py-3 px-5 rounded-full font-semibold transition-all duration-200 ${
            product.stock > 0
            ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        >
        {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
    </div>
    </div>

  );
}