import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PageLoader } from '../components/ui/Skeleton';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiX, FiUpload, FiLink, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', price: '', category: 'vegetable', image: '', harvestDate: '', stock: '', unit: 'kg' };
const CATEGORIES = ['fruit', 'vegetable', 'grain', 'dairy', 'other'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', shipped: 'bg-green-100 text-green-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([api.get('/products/my'), api.get('/orders/farmer')]);
      setProducts(pRes.data);
      setOrders(oRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, image: p.image || '', harvestDate: p.harvestDate ? p.harvestDate.slice(0, 10) : '', stock: p.stock, unit: p.unit || 'kg' });
    setImagePreview(p.image || '');
    setImageMode('url');
    setEditId(p._id);
    setShowForm(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setImagePreview(base64);
      // Upload to Cloudinary
      setUploading(true);
      try {
        const { data } = await api.post('/upload', { image: base64 });
        setForm((f) => ({ ...f, image: data.url }));
        toast.success('Image uploaded!');
      } catch {
        toast.error('Image upload failed');
        setImagePreview('');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.put(`/products/${editId}`, form);
        setProducts((prev) => prev.map((p) => (p._id === editId ? data : p)));
        toast.success('Product updated!');
      } else {
        const { data } = await api.post('/products', form);
        setProducts((prev) => [data, ...prev]);
        toast.success('Product added!');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      const icons = { pending: '🕐', confirmed: '✅', shipped: '🚚', delivered: '🎉', cancelled: '❌' };
      toast.success(`${icons[status] || ''} Order marked as ${status}`);
    } catch {
      toast.error('Update failed');
    }
  };

  const earnings = orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.products.reduce((s, p) => s + p.price * p.quantity, 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-r from-green-800 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-green-900">{user?.name}</h1>
          <p className="text-sm text-yellow-600 font-medium">🌾 Farmer Account</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Products', value: products.length, icon: '📦', color: 'from-green-800 to-green-600' },
          { label: 'Total Orders', value: orders.length, icon: '🛒', color: 'from-yellow-600 to-amber-500' },
          { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, icon: '✅', color: 'from-green-600 to-emerald-500' },
          { label: 'Earnings', value: `₹${earnings.toFixed(0)}`, icon: '💰', color: 'from-yellow-500 to-yellow-700' },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-r ${s.color} text-white rounded-2xl p-4`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-white/80 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-green-100">
        {[['products', 'My Products'], ['orders', 'Orders']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {tab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600 text-sm">{products.length} products listed</p>
                <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setImagePreview(''); setImageMode('url'); }} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                  <FiPlus /> Add Product
                </button>
              </div>

              {/* Product Form Modal */}
              {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-green-100">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-green-900 text-lg">{editId ? 'Edit Product' : 'Add New Product'}</h2>
                      <button onClick={() => setShowForm(false)}><FiX className="text-gray-500 hover:text-gray-700" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input className="input" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      <textarea className="input resize-none" rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" className="input" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
                        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" className="input" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} min="0" />
                        <input className="input" placeholder="Unit (kg/piece)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                      </div>
                      <input type="date" className="input" value={form.harvestDate} onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} />
                      {/* Image Upload */}
                      <div>
                        <div className="flex gap-2 mb-2">
                          <button type="button" onClick={() => setImageMode('url')} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${imageMode === 'url' ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 text-gray-500 hover:border-green-400'}`}>
                            <FiLink size={11} /> URL
                          </button>
                          <button type="button" onClick={() => setImageMode('upload')} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${imageMode === 'upload' ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 text-gray-500 hover:border-green-400'}`}>
                            <FiUpload size={11} /> Upload from device
                          </button>
                        </div>

                        {imageMode === 'url' ? (
                          <input
                            className="input"
                            placeholder="Paste image URL (optional)"
                            value={form.image}
                            onChange={(e) => { setForm({ ...form, image: e.target.value }); setImagePreview(e.target.value); }}
                          />
                        ) : (
                          <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            uploading ? 'border-yellow-400 bg-yellow-50' : 'border-green-300 bg-green-50 hover:border-green-600 hover:bg-green-100'
                          }`}>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                            {uploading ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-green-700">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-green-700">
                                <FiUpload size={20} />
                                <span className="text-xs font-medium">Click to select image</span>
                                <span className="text-xs text-gray-400">JPG, PNG, WEBP — max 5MB</span>
                              </div>
                            )}
                          </label>
                        )}

                        {/* Preview */}
                        {(imagePreview || form.image) && (
                          <div className="relative mt-2">
                            <img
                              src={imagePreview || form.image}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-xl border border-green-100"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              onClick={() => { setForm({ ...form, image: '' }); setImagePreview(''); }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <FiX size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setShowForm(false); setImagePreview(''); }} className="btn-outline flex-1">Cancel</button>
                        <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">{saving ? 'Saving...' : editId ? 'Update' : 'Add Product'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🌱</p>
                  <p className="text-gray-500">No products yet. Add your first product!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div key={p._id} className="card overflow-hidden border border-green-100">
                      <img src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'} alt={p.name} className="w-full h-36 object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'; }} />
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{p.name}</h3>
                            <p className="text-green-800 font-bold">₹{p.price}/{p.unit}</p>
                          </div>
                          <span className="badge bg-green-100 text-green-800 capitalize">{p.category}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1 text-sm border border-green-300 text-green-700 py-1.5 rounded-xl hover:bg-green-50 transition-colors">
                            <FiEdit2 size={13} /> Edit
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="flex-1 flex items-center justify-center gap-1 text-sm border border-red-300 text-red-500 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
                            <FiTrash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <FiPackage className="text-5xl text-green-200 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet.</p>
                </div>
              ) : orders.map((order) => (
                <div key={order._id} className="card p-5 border border-green-100">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <p className="font-semibold text-green-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <div className="flex items-center gap-2">
                      <span className={`badge capitalize ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="text-xs border border-green-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-700"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {order.products.map((p, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{p.name} × {p.quantity}</span>
                        <span>₹{(p.price * p.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-100 text-sm">
                    <span className="text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-green-800">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
