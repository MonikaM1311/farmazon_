import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiMapPin, FiCreditCard, FiShield, FiTruck } from 'react-icons/fi';

const PAYMENT_OPTIONS = [
  { value: 'COD',      label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
  { value: 'UPI',      label: 'UPI / QR Code',    icon: '📱', desc: 'GPay, PhonePe, Paytm & more' },
  { value: 'Card',     label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { value: 'Netbanking', label: 'Net Banking',    icon: '🏦', desc: 'All major banks supported' },
];

// Load Razorpay script dynamically
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user?.address || '');
  const [payment, setPayment] = useState('COD');
  const [loading, setLoading] = useState(false);

  const cartProducts = cart.map((i) => ({
    productId: i._id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image || '',
  }));

  // COD flow — direct order creation
  const handleCOD = async () => {
    const { data } = await api.post('/payment/cod', {
      products: cartProducts,
      deliveryAddress: address,
      totalPrice: total,
    });
    clearCart();
    navigate(`/order-success/${data._id}`);
  };

  // Razorpay flow — create order → open modal → verify
  const handleRazorpay = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Payment gateway failed to load. Check your internet connection.');
      return;
    }

    // Create Razorpay order on backend
    const { data } = await api.post('/payment/create-order', {
      products: cartProducts,
      deliveryAddress: address,
      totalPrice: total,
    });

    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'Farmazon',
      description: 'Fresh Farm Produce',
      image: 'https://i.imgur.com/n5tjHFD.png',
      order_id: data.razorpayOrderId,
      prefill: { name: user.name, email: user.email },
      theme: { color: '#166534' },
      // Map payment method to Razorpay method
      method: payment === 'UPI' ? { upi: true } : payment === 'Card' ? { card: true } : payment === 'Netbanking' ? { netbanking: true } : undefined,

      handler: async (response) => {
        try {
          // Verify signature on backend
          await api.post('/payment/verify', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: data.orderId,
          });
          clearCart();
          toast.success('Payment successful! 🎉');
          navigate(`/order-success/${data.orderId}`);
        } catch {
          toast.error('Payment verification failed. Contact support.');
          navigate(`/payment-failed/${data.orderId}`);
        }
      },

      modal: {
        ondismiss: async () => {
          // Mark order as failed when modal is closed without payment
          try {
            await api.post('/payment/fail', { orderId: data.orderId });
          } catch {}
          toast.error('Payment cancelled.');
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', async (response) => {
      try {
        await api.post('/payment/fail', { orderId: data.orderId });
      } catch {}
      toast.error(`Payment failed: ${response.error.description}`);
      navigate(`/payment-failed/${data.orderId}`);
    });

    rzp.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('Please enter delivery address');
    if (!cart.length) return toast.error('Cart is empty');

    setLoading(true);
    try {
      if (payment === 'COD') {
        await handleCOD();
      } else {
        await handleRazorpay();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-green-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">

          {/* Delivery Address */}
          <div className="card p-6 border border-green-100">
            <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <FiMapPin className="text-yellow-500" /> Delivery Address
            </h2>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Enter your full delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <FiTruck size={11} /> Estimated delivery in 2–3 business days
            </p>
          </div>

          {/* Payment Method */}
          <div className="card p-6 border border-green-100">
            <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <FiCreditCard className="text-yellow-500" /> Payment Method
            </h2>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map(({ value, label, icon, desc }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    payment === value
                      ? 'border-green-700 bg-green-50'
                      : 'border-gray-200 hover:border-green-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={payment === value}
                    onChange={() => setPayment(value)}
                    className="accent-green-700"
                  />
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  {value !== 'COD' && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Secure
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Security note for online payments */}
            {payment !== 'COD' && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                <FiShield className="text-green-700 shrink-0" />
                <p className="text-xs text-green-800">
                  Your payment is secured by <strong>Razorpay</strong>. We never store your card details.
                </p>
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : payment === 'COD' ? (
              `Place Order — ₹${total.toFixed(2)}`
            ) : (
              `Pay ₹${total.toFixed(2)} Securely`
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="card p-6 border border-green-100">
            <h2 className="font-bold text-green-900 mb-4">Order Summary</h2>
            <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">{item.name} × {item.quantity}</span>
                  <span className="font-semibold ml-2 shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm border-t border-green-100 pt-3">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span><span className="text-green-600 font-medium">FREE</span>
              </div>
              {payment !== 'COD' && (
                <div className="flex justify-between text-gray-500">
                  <span>Payment charges</span><span className="text-green-600 font-medium">₹0</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-green-100">
                <span>Total</span>
                <span className="text-green-800">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="card p-4 border border-green-100">
            <div className="space-y-2 text-xs text-gray-500">
              {[
                ['🔒', 'SSL Secured Checkout'],
                ['↩️', '7-day Easy Returns'],
                ['🌿', '100% Fresh Guarantee'],
                ['🚚', 'Free Delivery on all orders'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
