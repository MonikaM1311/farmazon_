import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PageLoader } from '../components/ui/Skeleton';
import { FiPackage, FiUser, FiMapPin, FiClock, FiRefreshCw, FiHeart, FiGift, FiCopy, FiShoppingCart, FiTrash2, FiAlertCircle, FiUpload } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};
const RETURN_STATUS_COLOR = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};
const RETURN_STATUS_ICON = { pending: '⏳', approved: '✅', rejected: '❌' };
const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_ICONS = { pending: '🕐', confirmed: '✅', shipped: '🚚', delivered: '🎉', cancelled: '❌' };

function OrderStatusTracker({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="mt-3 flex items-center gap-2 py-2 px-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-600 font-medium">
        ❌ Order Cancelled
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= currentIdx
                  ? 'bg-gradient-to-r from-green-800 to-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {i < currentIdx ? '✓' : i === currentIdx ? STATUS_ICONS[step] : i + 1}
              </div>
              <span className={`text-xs capitalize font-medium ${i <= currentIdx ? 'text-green-800' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-1 mb-5 rounded-full transition-all ${i < currentIdx ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user, updateUser } = useAuth();
  const { addToCart } = useCart();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(location.state?.tab || 'orders');
  const [profile, setProfile] = useState({ name: user?.name || '', address: user?.address || '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(null);
  const [returnModal, setReturnModal] = useState(null); // orderId
  const [returnForm, setReturnForm] = useState({ type: 'refund', reason: '', image: '' });
  const [returnImg, setReturnImg] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrders = () =>
    api.get('/orders/my').then(({ data }) => setOrders(data)).finally(() => setLoading(false));

  const fetchWishlist = () =>
    api.get('/wishlist').then(({ data }) => setWishlist(data));

  useEffect(() => {
    fetchOrders();
    fetchWishlist();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (orderId) => {
    setReordering(orderId);
    try {
      await api.post(`/orders/${orderId}/reorder`);
      toast.success('🛒 Reorder placed as COD!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reorder failed');
    } finally {
      setReordering(null);
    }
  };

  const handleReturnImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    const reader = new FileReader();
    reader.onload = (ev) => { setReturnImg(ev.target.result); setReturnForm((f) => ({ ...f, image: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  const submitReturn = async () => {
    if (!returnForm.reason.trim()) return toast.error('Please describe the issue');
    setSubmittingReturn(true);
    try {
      const { data } = await api.post(`/orders/${returnModal}/return`, returnForm);
      setOrders((prev) => prev.map((o) => o._id === returnModal ? data.order : o));
      toast.success('Return request submitted!');
      setReturnModal(null);
      setReturnForm({ type: 'refund', reason: '', image: '' });
      setReturnImg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.post(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed'); }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const referralCode = user?._id?.slice(-8).toUpperCase();
  const copyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
    toast.success('Referral link copied!');
  };

  const TABS = [
    ['orders', 'My Orders', <FiPackage />],
    ['wishlist', 'Wishlist', <FiHeart />],
    ['profile', 'Profile', <FiUser />],
    ['referral', 'Referral', <FiGift />],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-r from-green-800 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-green-900">{user?.name}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-green-100 overflow-x-auto">
        {TABS.map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === key ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon} {label}
            {key === 'wishlist' && wishlist.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{wishlist.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        loading ? <PageLoader /> : orders.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage className="text-5xl text-green-200 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet. Start shopping!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={fetchOrders} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 transition-colors">
                <FiRefreshCw size={12} /> Refresh
              </button>
            </div>
            {orders.map((order) => (
              <div key={order._id} className="card p-5 border border-green-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-green-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <FiClock size={11} /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge capitalize ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_ICONS[order.status]} {order.status}
                    </span>
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleReorder(order._id)}
                        disabled={reordering === order._id}
                        className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <FiRefreshCw size={11} /> {reordering === order._id ? '...' : 'Reorder'}
                      </button>
                    )}
                    {order.status === 'delivered' && (!order.returnRequest?.status || order.returnRequest.status === 'none') && (
                      <button
                        onClick={() => { setReturnModal(order._id); setReturnForm({ type: 'refund', reason: '', image: '' }); setReturnImg(''); }}
                        className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <FiAlertCircle size={11} /> Return / Refund
                      </button>
                    )}
                  </div>
                </div>
                <OrderStatusTracker status={order.status} />
                <div className="text-sm text-gray-600 space-y-1 mt-4 pt-3 border-t border-green-50">
                  {order.products.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.name} × {p.quantity}</span>
                      <span>₹{(p.price * p.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-100">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FiMapPin size={11} /> {order.deliveryAddress}
                  </span>
                  <span className="font-bold text-green-800">₹{order.totalPrice.toFixed(2)}</span>
                </div>

                {/* Return Request Status */}
                {order.returnRequest?.status && order.returnRequest.status !== 'none' && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs ${RETURN_STATUS_COLOR[order.returnRequest.status]}`}>
                    <p className="font-semibold mb-1">
                      {RETURN_STATUS_ICON[order.returnRequest.status]} {order.returnRequest.type === 'refund' ? 'Refund' : 'Replacement'} Request — {order.returnRequest.status.toUpperCase()}
                    </p>
                    <p className="text-gray-500">Reason: {order.returnRequest.reason}</p>
                    {order.returnRequest.farmerNote && <p className="mt-1">Farmer note: <strong>{order.returnRequest.farmerNote}</strong></p>}
                    {order.returnRequest.status === 'approved' && order.returnRequest.type === 'refund' && (
                      <p className="mt-1 font-bold text-emerald-700">Refund amount: ₹{order.returnRequest.refundAmount}</p>
                    )}
                    {order.returnRequest.image && (
                      <a href={order.returnRequest.image} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 inline-block">View attached photo →</a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Return / Refund Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-red-100 shadow-2xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Request Return / Refund</h2>
            <p className="text-xs text-gray-400 mb-4">Describe the issue and we'll notify the farmer.</p>

            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {['refund', 'replacement'].map((t) => (
                <button
                  key={t}
                  onClick={() => setReturnForm((f) => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    returnForm.type === t
                      ? t === 'refund' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {t === 'refund' ? '💰 Refund' : '🔄 Replacement'}
                </button>
              ))}
            </div>

            <textarea
              className="input resize-none mb-3"
              rows={3}
              placeholder={`Describe the issue (e.g. ${returnForm.type === 'refund' ? 'product was rotten, wrong item received' : 'received damaged goods, missing items'})`}
              value={returnForm.reason}
              onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
            />

            {/* Photo upload */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-600 border border-dashed border-blue-300 rounded-xl px-3 py-2 hover:bg-blue-50 transition-colors mb-4">
              <input type="file" accept="image/*" className="hidden" onChange={handleReturnImage} />
              <FiUpload size={13} />
              {returnImg ? 'Photo attached ✓ (click to change)' : 'Attach a photo (optional)'}
            </label>
            {returnImg && <img src={returnImg} alt="proof" className="w-full h-28 object-cover rounded-xl mb-4 border border-gray-100" />}

            <div className="flex gap-3">
              <button
                onClick={() => { setReturnModal(null); setReturnImg(''); }}
                className="flex-1 btn-outline py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                disabled={submittingReturn}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
                  returnForm.type === 'refund' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                } disabled:opacity-50`}
              >
                {submittingReturn ? 'Submitting...' : `Submit ${returnForm.type === 'refund' ? 'Refund' : 'Replacement'} Request`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Tab */}
      {tab === 'wishlist' && (
        wishlist.length === 0 ? (
          <div className="text-center py-16">
            <FiHeart className="text-5xl text-green-200 mx-auto mb-3" />
            <p className="text-gray-500">Your wishlist is empty.</p>
            <Link to="/shop" className="btn-primary mt-4 inline-block text-sm">Browse Products</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map((product) => (
                <div key={product._id} className="card overflow-hidden border border-green-100 flex flex-col">
                  <Link to={`/product/${product._id}`} className="relative">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'}
                      alt={product.name}
                      className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'; }}
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <Link to={`/product/${product._id}`}>
                      <p className="font-semibold text-gray-800 text-sm truncate hover:text-green-800">{product.name}</p>
                    </Link>
                    <p className="text-xs text-gray-400 truncate mb-1">{product.farmerName || 'Local Farmer'}</p>
                    <p className="text-green-800 font-bold text-sm mb-3">₹{product.price}<span className="text-xs text-gray-400 font-normal">/{product.unit || 'kg'}</span></p>
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-1 text-xs bg-gradient-to-r from-green-800 to-yellow-500 text-white py-1.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-40"
                      >
                        <FiShoppingCart size={11} /> Add
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card p-6 max-w-lg border border-green-100">
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-green-900 mb-1 block">Full Name</label>
              <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-green-900 mb-1 block">Email</label>
              <input className="input bg-gray-50" value={user?.email} disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-green-900 mb-1 block">Phone</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-green-900 mb-1 block">Address</label>
              <textarea className="input resize-none" rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Referral Tab */}
      {tab === 'referral' && (
        <div className="max-w-lg space-y-4">
          <div className="card p-6 border border-green-100">
            <h2 className="font-bold text-green-900 mb-2 flex items-center gap-2"><FiGift className="text-yellow-500" /> Your Referral Code</h2>
            <p className="text-gray-500 text-sm mb-4">Invite friends to Farmazon and earn ₹50 credits for each successful referral!</p>
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="font-mono font-bold text-green-800 text-lg tracking-widest flex-1">{referralCode}</span>
              <button onClick={copyReferral} className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium">
                <FiCopy size={14} /> Copy Link
              </button>
            </div>
          </div>
          <div className="card p-5 border border-green-100">
            <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
            <div className="space-y-3">
              {[
                ['1', 'Share your referral link with friends'],
                ['2', 'Friend registers and places their first order'],
                ['3', 'You both get ₹50 off on next order'],
              ].map(([num, text]) => (
                <div key={num} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-green-800 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{num}</div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
