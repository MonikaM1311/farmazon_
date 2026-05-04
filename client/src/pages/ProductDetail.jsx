import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Skeleton';
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiStar, FiHeart } from 'react-icons/fi';
import { FaHeart, FaStar, FaRegStar } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { getFreshnessTag, getStockAlert } from '../utils/productUtils';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
          {s <= (hover || value) ? <FaStar className="text-yellow-500" size={size} /> : <FaRegStar className="text-gray-300" size={size} />}
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/${id}`),
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data);
      setReviews(rRes.data);
      if (user?.wishlist) setWishlisted(user.wishlist.includes(id));
    }).catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/shop" className="btn-primary mt-4 inline-block">Back to Shop</Link>
    </div>
  );

  const handleAdd = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      window.location.href = '/login';
      return;
    }
    addToCart(product, qty);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = async () => {
    if (!user) return toast.error('Login to save wishlist');
    try {
      const { data } = await api.post(`/wishlist/${id}`);
      setWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? '❤️ Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Failed'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reviews/${id}`, reviewForm);
      setReviews((prev) => [data, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success('Review deleted');
    } catch { toast.error('Failed'); }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  const freshness = getFreshnessTag(product.harvestDate);
  const stockAlert = getStockAlert(product.stock);
  const savings = product.marketPrice > product.price ? product.marketPrice - product.price : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/shop" className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-medium">
        <FiArrowLeft /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden shadow-md border border-green-100">
          <img
            src={product.image || PLACEHOLDER}
            alt={product.name}
            className="w-full h-80 object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
        </div>

        <div>
          <span className={`badge text-white mb-3 ${
            product.category === 'fruit' ? 'bg-yellow-500' :
            product.category === 'vegetable' ? 'bg-green-700' : 'bg-green-800'
          }`}>
            {product.category}
          </span>
          <h1 className="text-3xl font-extrabold text-green-900 mb-2">{product.name}</h1>
          <p className="text-gray-500 mb-4">{product.description}</p>

          {/* Rating summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <FaStar key={s} className={s <= Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-200'} size={14} />
                ))}
              </div>
              <span className="font-bold text-gray-800">{avgRating}</span>
              <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
            </div>
          )}

          {/* 💰 Price Comparison */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-green-800">₹{product.price}</span>
            <span className="text-gray-400 mb-1">/{product.unit || 'kg'}</span>
            {savings > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through mb-1">₹{product.marketPrice}</span>
                <span className="mb-1 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  You save ₹{savings}!
                </span>
              </>
            )}
          </div>
          {savings > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <span>Farmer price: <strong className="text-green-700">₹{product.price}</strong></span>
              <span>·</span>
              <span>Market price: <strong className="text-gray-600">₹{product.marketPrice}</strong></span>
            </div>
          )}

          <div className="space-y-2 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <GiWheat className="text-yellow-500" />
              <span>Farmer: <Link to={`/farmer/${product.farmerId?._id || product.farmerId}`} className="font-semibold text-green-700 hover:underline">{product.farmerName || product.farmerId?.name || 'Local Farmer'}</Link></span>
              {product.farmerId?.isVerified && <span className="badge bg-blue-100 text-blue-700">✓ Verified</span>}
            </div>
            {/* 🧪 Lab Tested Badge */}
            {product.labReport?.verified && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-xl w-fit">
                🧪 Lab Tested ✅ <span className="font-normal text-xs text-emerald-600">Pesticide-free certified</span>
                <a
                  href={product.labReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline ml-1"
                >
                  View Report →
                </a>
              </div>
            )}
            {/* 🕒 Harvest Tag */}
            {freshness && (
              <div className={`flex items-center gap-2 font-semibold text-sm px-3 py-1.5 rounded-xl border w-fit ${freshness.bgColor} ${freshness.color}`}>
                <span>{freshness.icon} {freshness.label}</span>
              </div>
            )}
            {/* 🔔 Stock Alert */}
            {stockAlert && product.stock > 0 && (
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl w-fit ${stockAlert.color}`}>
                🔔 {stockAlert.label}
              </div>
            )}
            {product.shelfLife && (
              <div className="flex items-center gap-2">
                <span>⏱️ Shelf life: <strong>{product.shelfLife}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>📦 Stock: <strong>{product.stock} {product.unit || 'kg'} available</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-green-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-green-50 transition-colors"><FiMinus /></button>
              <span className="px-4 py-2 font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-green-50 transition-colors"><FiPlus /></button>
            </div>
            <span className="text-gray-500 text-sm">Total: <strong className="text-green-800">₹{(product.price * qty).toFixed(2)}</strong></span>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={product.stock === 0} className={`btn-primary flex-1 flex items-center justify-center gap-2 py-3 ${
              !user ? 'opacity-60 cursor-not-allowed' : ''
            }`} title={!user ? 'Login to add to cart' : ''}>
              <FiShoppingCart /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button onClick={handleWishlist} className={`p-3 rounded-xl border-2 transition-all ${wishlisted ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-400'}`}>
              {wishlisted ? <FaHeart className="text-red-500" size={18} /> : <FiHeart size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-green-900 mb-6">Customer Reviews</h2>

        {/* Add Review Form */}
        {user?.role === 'consumer' && (
          <form onSubmit={submitReview} className="card p-5 border border-green-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
            <div className="mb-3">
              <label className="text-sm text-gray-600 mb-1 block">Your Rating</label>
              <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
            </div>
            <textarea
              className="input resize-none mb-3"
              rows={3}
              placeholder="Share your experience with this product..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              required
            />
            <button type="submit" disabled={submitting} className="btn-primary py-2 px-6 text-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <p className="text-xs text-gray-400 mt-2">* Only buyers who received this product can review</p>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="card p-4 border border-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-r from-green-800 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {r.userName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.userName}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <FaStar key={s} className={s <= r.rating ? 'text-yellow-500' : 'text-gray-200'} size={11} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    {user?._id === r.userId && (
                      <button onClick={() => deleteReview(r._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
