import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PageLoader } from '../components/ui/Skeleton';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiX, FiUpload, FiLink, FiBarChart2, FiAlertTriangle, FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiMapPin, FiSave } from 'react-icons/fi';
import { FarmMapPicker } from '../components/ui/FarmMap';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', price: '', marketPrice: '', category: 'vegetable', image: '', harvestDate: '', stock: '', unit: 'kg' };
const CATEGORIES = ['fruit', 'vegetable', 'grain', 'dairy', 'other'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', shipped: 'bg-green-100 text-green-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [labUploadId, setLabUploadId] = useState(null);
  const [labUploading, setLabUploading] = useState(false);
  const [resolveModal, setResolveModal] = useState(null); // { orderId, type }
  const [resolveForm, setResolveForm] = useState({ status: 'approved', refundAmount: '', farmerNote: '' });
  const [resolving, setResolving] = useState(false);
  const [farmCoords, setFarmCoords] = useState({ lat: null, lng: null });
  const [farmLocation, setFarmLocation] = useState('');
  const [savingFarm, setSavingFarm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, aRes] = await Promise.all([
        api.get('/products/my'),
        api.get('/orders/farmer'),
        api.get('/farmers/analytics'),
      ]);
      setProducts(pRes.data);
      setOrders(oRes.data);
      setAnalytics(aRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Poll every 8s if any lab report is pending AI verification
  useEffect(() => {
    const hasPending = products.some((p) => p.labReport?.aiStatus === 'pending');
    if (!hasPending) return;
    const timer = setInterval(async () => {
      const { data } = await api.get('/products/my');
      setProducts(data);
    }, 8000);
    return () => clearInterval(timer);
  }, [products]);

  // Pre-fill farm location from user profile
  useEffect(() => {
    if (user?.location) setFarmLocation(user.location);
    if (user?.coordinates?.lat) setFarmCoords({ lat: user.coordinates.lat, lng: user.coordinates.lng });
  }, [user]);

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, marketPrice: p.marketPrice || '', category: p.category, image: p.image || '', harvestDate: p.harvestDate ? p.harvestDate.slice(0, 10) : '', stock: p.stock, unit: p.unit || 'kg' });
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

  const handleLabUpload = async (e, productId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB');
    setLabUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { data } = await api.post(`/products/${productId}/lab-report`, { file: ev.target.result });
        setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, labReport: data.labReport } : p));
        toast.success('Lab report uploaded! Pending verification.');
      } catch {
        toast.error('Upload failed');
      } finally {
        setLabUploading(false);
        setLabUploadId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyLab = async (productId, verified) => {
    try {
      const { data } = await api.put(`/products/${productId}/lab-report/verify`, { verified });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, labReport: data.labReport } : p));
      toast.success(verified ? '✅ Lab report verified!' : 'Verification removed');
    } catch {
      toast.error('Failed to update verification');
    }
  };

  const handleResolveReturn = async () => {
    if (!resolveForm.status) return;
    setResolving(true);
    try {
      const { data } = await api.put(`/orders/${resolveModal.orderId}/return/resolve`, resolveForm);
      setOrders((prev) => prev.map((o) => o._id === resolveModal.orderId ? data.order : o));
      toast.success(`Return request ${resolveForm.status}!`);
      setResolveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setResolving(false);
    }
  };

  const saveFarmLocation = async () => {
    if (!farmCoords.lat || !farmCoords.lng) return toast.error('Click on the map to pin your farm location');
    setSavingFarm(true);
    try {
      await api.put('/farmers/profile', { location: farmLocation, coordinates: farmCoords });
      toast.success('Farm location saved! 🌾');
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSavingFarm(false);
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
        {[['products', 'My Products'], ['orders', 'Orders'], ['analytics', 'Analytics'], ['farm', 'Farm Location']].map(([key, label]) => (
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
                        <input type="number" className="input" placeholder="Market Price ₹ (optional)" value={form.marketPrice} onChange={(e) => setForm({ ...form, marketPrice: e.target.value })} min="0" title="MRP / market price for comparison" />
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
                        {/* Lab Report Status */}
                        <div className="mt-3 pt-3 border-t border-green-50">
                          {p.labReport?.url ? (
                            <div className="space-y-2">
                              {/* AI Status Badge */}
                              {p.labReport.aiStatus === 'pending' && (
                                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  AI Verification in progress...
                                </div>
                              )}
                              {p.labReport.aiStatus === 'approved' && (
                                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <FiCheckCircle size={12} /> Lab Tested ✅ AI Verified
                                  <span className="ml-auto font-bold">{p.labReport.aiScore}/100</span>
                                </div>
                              )}
                              {p.labReport.aiStatus === 'needs_review' && (
                                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                                  <FiClock size={12} /> Needs Manual Review
                                  <span className="ml-auto font-bold">{p.labReport.aiScore}/100</span>
                                </div>
                              )}
                              {p.labReport.aiStatus === 'rejected' && (
                                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                                  <FiAlertCircle size={12} /> AI Rejected
                                  <span className="ml-auto font-bold">{p.labReport.aiScore}/100</span>
                                </div>
                              )}

                              {/* Score bar */}
                              {p.labReport.aiScore !== null && p.labReport.aiScore !== undefined && (
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                                    <span>AI Confidence</span>
                                    <span>{p.labReport.aiScore}/100</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${
                                        p.labReport.aiScore >= 80 ? 'bg-emerald-500' :
                                        p.labReport.aiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${p.labReport.aiScore}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Breakdown details */}
                              {p.labReport.aiBreakdown && !p.labReport.aiBreakdown.error && (
                                <div className="text-xs text-gray-500 space-y-0.5 bg-gray-50 rounded-lg p-2">
                                  <p>🏛️ Lab: <strong>{p.labReport.aiBreakdown.lab_name}</strong></p>
                                  <p>📊 Keywords matched: <strong>{p.labReport.aiBreakdown.keywords_found}</strong></p>
                                  {p.labReport.aiBreakdown.dates_found?.length > 0 && (
                                    <p>📅 Date: <strong>{p.labReport.aiBreakdown.dates_found[0]}</strong> {p.labReport.aiBreakdown.date_valid ? '✅' : '⚠️ old'}</p>
                                  )}
                                  {p.labReport.aiBreakdown.result_values?.length > 0 && (
                                    <p>🧪 Results: <strong>{p.labReport.aiBreakdown.result_values.join(', ')}</strong></p>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <a href={p.labReport.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                  <FiFileText size={11} /> View Report
                                </a>
                                {p.labReport.aiStatus !== 'pending' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const { data } = await api.post(`/products/${p._id}/lab-report/retry`);
                                        setProducts((prev) => prev.map((pr) => pr._id === p._id ? { ...pr, labReport: data.labReport } : pr));
                                        toast.success('AI re-verification started');
                                      } catch { toast.error('Retry failed'); }
                                    }}
                                    className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                  >
                                    🔄 Re-verify
                                  </button>
                                )}
                                <button
                                  onClick={() => handleVerifyLab(p._id, !p.labReport.verified)}
                                  className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ml-auto ${
                                    p.labReport.verified
                                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {p.labReport.verified ? 'Unverify' : 'Override Verify'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className={`flex items-center gap-2 cursor-pointer text-xs px-3 py-1.5 rounded-lg border border-dashed transition-all w-full justify-center ${
                              labUploading && labUploadId === p._id
                                ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                                : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                            }`}>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={labUploading}
                                onChange={(e) => { setLabUploadId(p._id); handleLabUpload(e, p._id); }}
                              />
                              {labUploading && labUploadId === p._id
                                ? <><div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                                : <><FiUpload size={11} /> Upload Lab Report (PDF/Image)</>}
                            </label>
                          )}
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

          {tab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5 border border-green-100">
                  <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-800">₹{analytics.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="card p-5 border border-green-100">
                  <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-green-800">{analytics.totalOrders}</p>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="card p-5 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2"><FiBarChart2 /> Monthly Revenue (Last 6 Months)</h3>
                <div className="space-y-2">
                  {analytics.monthlyRevenue.map(({ month, revenue }) => {
                    const max = Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1);
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">{month}</span>
                        <div className="flex-1 bg-green-50 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-800 to-yellow-500 rounded-full transition-all"
                            style={{ width: `${(revenue / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-green-800 w-16 text-right">₹{revenue.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products */}
              {analytics.topProducts.length > 0 && (
                <div className="card p-5 border border-green-100">
                  <h3 className="font-semibold text-green-900 mb-3">🏆 Top Products by Revenue</h3>
                  <div className="space-y-2">
                    {analytics.topProducts.map(({ name, revenue }, i) => (
                      <div key={name} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700"><span className="font-bold text-yellow-600 mr-2">#{i + 1}</span>{name}</span>
                        <span className="font-semibold text-green-800">₹{revenue.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Alerts */}
              {analytics.lowStock.length > 0 && (
                <div className="card p-5 border border-orange-100 bg-orange-50">
                  <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2"><FiAlertTriangle /> Low Stock Alerts</h3>
                  <div className="space-y-2">
                    {analytics.lowStock.map((p) => (
                      <div key={p._id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{p.name}</span>
                        <span className="font-semibold text-orange-700">{p.stock} {p.unit} left</span>
                      </div>
                    ))}
                  </div>
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

                  {/* Return Request */}
                  {order.returnRequest?.status === 'pending' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                          <FiAlertCircle size={12} />
                          {order.returnRequest.type === 'refund' ? '💰 Refund' : '🔄 Replacement'} Request — PENDING
                        </p>
                        <button
                          onClick={() => { setResolveModal({ orderId: order._id, type: order.returnRequest.type }); setResolveForm({ status: 'approved', refundAmount: order.totalPrice, farmerNote: '' }); }}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">Reason: {order.returnRequest.reason}</p>
                      {order.returnRequest.image && (
                        <a href={order.returnRequest.image} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">View photo →</a>
                      )}
                    </div>
                  )}
                  {order.returnRequest?.status && ['approved','rejected'].includes(order.returnRequest.status) && (
                    <div className={`mt-3 p-2 rounded-xl border text-xs ${
                      order.returnRequest.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      {order.returnRequest.status === 'approved' ? '✅' : '❌'} Return {order.returnRequest.status}
                      {order.returnRequest.refundAmount > 0 && ` — Refund: ₹${order.returnRequest.refundAmount}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === 'farm' && (
            <div className="space-y-5 max-w-2xl">
              <div className="card p-5 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                  <FiMapPin className="text-green-700" /> Pin Your Farm on the Map
                </h3>
                <p className="text-xs text-gray-400 mb-4">Click anywhere on the map to drop a pin at your farm's exact location. Customers will see this on your profile.</p>

                <FarmMapPicker
                  lat={farmCoords.lat}
                  lng={farmCoords.lng}
                  onChange={(coords) => setFarmCoords(coords)}
                />

                {farmCoords.lat && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <FiMapPin size={11} className="text-green-600" />
                    Pinned at {farmCoords.lat.toFixed(5)}, {farmCoords.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="card p-5 border border-green-100">
                <label className="text-sm font-medium text-green-900 mb-1 block">Farm Location Name</label>
                <input
                  className="input mb-4"
                  placeholder="e.g. Coimbatore, Tamil Nadu"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                />
                <button
                  onClick={saveFarmLocation}
                  disabled={savingFarm || !farmCoords.lat}
                  className="btn-primary flex items-center gap-2 py-2 px-6 text-sm disabled:opacity-50"
                >
                  <FiSave size={14} /> {savingFarm ? 'Saving...' : 'Save Farm Location'}
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">🌾 Why add your farm location?</p>
                <ul className="space-y-1 text-xs text-green-700 list-disc list-inside">
                  <li>Builds trust — customers see exactly where their food comes from</li>
                  <li>Local buyers can find and prefer nearby farms</li>
                  <li>Shown on your public farmer profile page</li>
                </ul>
              </div>
            </div>
          )}

        </>
      )}

      {/* Resolve Return Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-100 shadow-2xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Resolve Return Request</h2>
            <p className="text-xs text-gray-400 mb-4">
              Customer requested a <strong>{resolveModal.type}</strong>. Choose how to resolve.
            </p>

            <div className="flex gap-2 mb-4">
              {['approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setResolveForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    resolveForm.status === s
                      ? s === 'approved' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {s === 'approved' ? '✅ Approve' : '❌ Reject'}
                </button>
              ))}
            </div>

            {resolveForm.status === 'approved' && resolveModal.type === 'refund' && (
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Refund Amount (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={resolveForm.refundAmount}
                  onChange={(e) => setResolveForm((f) => ({ ...f, refundAmount: e.target.value }))}
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">Enter the amount to refund to the customer.</p>
              </div>
            )}

            <textarea
              className="input resize-none mb-4"
              rows={2}
              placeholder="Note to customer (optional)"
              value={resolveForm.farmerNote}
              onChange={(e) => setResolveForm((f) => ({ ...f, farmerNote: e.target.value }))}
            />

            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="flex-1 btn-outline py-2 text-sm">Cancel</button>
              <button
                onClick={handleResolveReturn}
                disabled={resolving}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
                  resolveForm.status === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {resolving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
