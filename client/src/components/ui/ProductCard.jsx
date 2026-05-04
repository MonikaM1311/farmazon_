import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useState, useEffect } from 'react';
import { getFreshnessTag, getStockAlert } from '../../utils/productUtils';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (user?.wishlist) setWishlisted(user.wishlist.includes(product._id));
  }, [user, product._id]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add items to cart');
      window.location.href = '/login';
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Login to save wishlist');
    setToggling(true);
    try {
      const { data } = await api.post(`/wishlist/${product._id}`);
      setWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? '❤️ Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setToggling(false);
    }
  };

  const freshness = getFreshnessTag(product.harvestDate);
  const stockAlert = getStockAlert(product.stock);
  const savings = product.marketPrice > product.price ? product.marketPrice - product.price : 0;

  return (
    <Link to={`/product/${product._id}`} className="card group block overflow-hidden border border-green-100">
      <div className="relative overflow-hidden h-48">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />

        {/* Category badge */}
        <span className={`absolute top-2 left-2 badge text-white ${
          product.category === 'fruit' ? 'bg-yellow-500' :
          product.category === 'vegetable' ? 'bg-green-700' :
          product.category === 'grain' ? 'bg-amber-600' : 'bg-green-800'
        }`}>
          {product.category}
        </span>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          disabled={toggling}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
        >
          {wishlisted ? <FaHeart className="text-red-500 text-sm" /> : <FiHeart className="text-gray-500 text-sm" />}
        </button>

        {/* 🕒 Harvest Tag */}
        {freshness && (
          <span className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${freshness.bgColor} ${freshness.color}`}>
            {freshness.icon} {freshness.label}
          </span>
        )}

        {/* 🔔 Stock Alert */}
        {stockAlert && !freshness && (
          <span className={`absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${stockAlert.color}`}>
            {stockAlert.label}
          </span>
        )}
        {stockAlert && freshness && (
          <span className={`absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${stockAlert.color}`}>
            {stockAlert.label}
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}

        {/* 🧪 Lab Tested Badge */}
        {product.labReport?.verified && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 whitespace-nowrap">
            🧪 Lab Tested ✅
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{product.farmerName || 'Local Farmer'}</p>

        {product.avgRating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <FiStar className="text-yellow-500 fill-yellow-500" size={11} />
            <span className="text-xs text-gray-600 font-medium">{Number(product.avgRating).toFixed(1)}</span>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        {product.shelfLife && (
          <p className="text-xs text-green-600 mt-0.5">🌿 Fresh for {product.shelfLife}</p>
        )}

        {/* 💰 Price Comparison */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-green-800">₹{product.price}</span>
              <span className="text-xs text-gray-400">/{product.unit || 'kg'}</span>
              {savings > 0 && (
                <span className="text-xs text-gray-400 line-through">₹{product.marketPrice}</span>
              )}
            </div>
            {savings > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                Save ₹{savings}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`bg-gradient-to-r from-green-800 to-yellow-500 text-white p-2 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 ${
              !user ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!user ? 'Login to add to cart' : ''}
          >
            <FiShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
