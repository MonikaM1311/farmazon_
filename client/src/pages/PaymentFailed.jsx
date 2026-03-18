import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiXCircle, FiRefreshCw, FiShoppingCart } from 'react-icons/fi';

export default function PaymentFailed() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiXCircle className="text-red-500 text-4xl" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Payment Failed</h1>
      <p className="text-gray-500 mb-2">Your payment could not be processed.</p>
      <p className="text-sm text-gray-400 mb-8">
        Don't worry — your cart is still saved. You can retry or choose a different payment method.
      </p>

      <div className="card p-5 border border-red-100 mb-6 text-left">
        <p className="text-sm font-semibold text-gray-700 mb-3">What you can do:</p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            Check your internet connection and try again
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            Try a different payment method (UPI, Card, or COD)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            Contact your bank if the amount was deducted
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            Reach us at support@farmazon.in for help
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate('/checkout')}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <FiRefreshCw size={15} /> Retry Payment
        </button>
        <Link to="/shop" className="btn-outline flex items-center justify-center gap-2">
          <FiShoppingCart size={15} /> Back to Shop
        </Link>
      </div>
    </div>
  );
}
