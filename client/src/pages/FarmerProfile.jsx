import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { PageLoader } from '../components/ui/Skeleton';
import ProductCard from '../components/ui/ProductCard';
import { FarmMapView } from '../components/ui/FarmMap';
import { FiMapPin, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

export default function FarmerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/farmers/${id}`)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Farmer not found.</p>
      <Link to="/shop" className="btn-primary mt-4 inline-block">Back to Shop</Link>
    </div>
  );

  const { farmer, products } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/shop" className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-medium">
        <FiArrowLeft /> Back to Shop
      </Link>

      {/* Farmer Header */}
      <div className="card p-6 border border-green-100 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-gradient-to-r from-green-800 to-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {farmer.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-green-900">{farmer.name}</h1>
              {farmer.isVerified && (
                <span className="badge bg-blue-100 text-blue-700">✓ Verified Farmer</span>
              )}
            </div>
            {farmer.location && (
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <FiMapPin size={13} /> {farmer.location}
              </p>
            )}
            {farmer.bio && <p className="text-gray-600 mt-2 text-sm">{farmer.bio}</p>}
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
              <FiCalendar size={11} /> Member since {new Date(farmer.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-green-800">{products.length}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><GiWheat className="text-yellow-500" /> Products</p>
          </div>
        </div>
      </div>

      {/* Farm Map */}
      {farmer.coordinates?.lat && farmer.coordinates?.lng && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
            <FiMapPin className="text-green-700" /> Farm Location
          </h2>
          <FarmMapView
            lat={farmer.coordinates.lat}
            lng={farmer.coordinates.lng}
            farmerName={farmer.name}
            location={farmer.location}
          />
          {farmer.location && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
              <FiMapPin size={13} className="text-green-600" /> {farmer.location}
            </p>
          )}
        </div>
      )}

      {/* Products */}
      <h2 className="text-lg font-bold text-green-900 mb-4">Products by {farmer.name}</h2>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-3">🌱</p>
          <p className="text-gray-500">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
