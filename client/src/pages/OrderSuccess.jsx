import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { PageLoader } from '../components/ui/Skeleton';
import { FiCheckCircle, FiPackage, FiCreditCard, FiCalendar } from 'react-icons/fi';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

const PAYMENT_BADGE = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed:  'bg-red-100 text-red-700',
};
const PAYMENT_ICON = { paid: '✅', pending: '🕐', failed: '❌' };

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiCheckCircle className="text-green-700 text-4xl" />
      </div>
      <h1 className="text-3xl font-extrabold text-green-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-6">Your fresh produce is on its way 🌿</p>

      {order && (
        <div className="card p-6 text-left mb-6 border border-green-100">

          {/* Order ID + Status row */}
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <div>
              <p className="font-bold text-green-900 text-lg">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`badge capitalize ${PAYMENT_BADGE[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
              {PAYMENT_ICON[order.paymentStatus]} Payment {order.paymentStatus}
            </span>
          </div>

          {/* Payment & Delivery info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <FiCreditCard className="text-yellow-500" size={14} />
                <span className="text-xs font-semibold text-green-900">Payment</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{order.paymentMethod}</p>
              {order.razorpayPaymentId && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">ID: {order.razorpayPaymentId}</p>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <FiCalendar className="text-yellow-500" size={14} />
                <span className="text-xs font-semibold text-green-900">Est. Delivery</span>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : '2–3 business days'}
              </p>
            </div>
          </div>

          {/* Order status stepper */}
          <div className="flex items-center justify-between mb-1">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    STATUS_STEPS.indexOf(order.status) >= i
                      ? 'bg-gradient-to-r from-green-800 to-yellow-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {STATUS_STEPS.indexOf(order.status) > i ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs capitalize ${STATUS_STEPS.indexOf(order.status) >= i ? 'text-green-800 font-medium' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 mb-4 rounded-full ${STATUS_STEPS.indexOf(order.status) > i ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="space-y-2 text-sm mt-4 pt-3 border-t border-green-100">
            {order.products.map((p, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{p.name} × {p.quantity}</span>
                <span>₹{(p.price * p.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div className="border-t border-green-100 pt-2 flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span className="text-green-800">₹{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-gray-600 border border-green-100">
            <FiPackage className="inline mr-2 text-yellow-500" />
            Delivering to: {order.deliveryAddress}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
        <Link to="/dashboard" className="btn-outline">View All Orders</Link>
      </div>
    </div>
  );
}
