import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function ComboPacks() {
  const [combos, setCombos] = useState([]);
  const [show, setShow] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/combos').then(({ data }) => setCombos(data)).catch(() => {});
  }, []);

  if (!combos.length) return null;

  const handleAddCombo = (combo) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      window.location.href = '/login';
      return;
    }
    // Add combo as a single cart item
    addToCart({
      _id: `combo_${combo._id}`,
      name: combo.name,
      price: combo.comboPrice,
      unit: 'pack',
      image: combo.image || '',
      isCombo: true,
      comboProducts: combo.products,
    });
    toast.success(`${combo.name} added to cart! 🧺`);
  };

  const savings = (combo) => combo.originalPrice - combo.comboPrice;
  const savingsPct = (combo) => Math.round((savings(combo) / combo.originalPrice) * 100);

  return (
    <div className="mb-8">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-900">🧺 Combo Packs</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
            Save more
          </span>
        </div>
        {show ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>

      {show && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {combos.map((combo) => (
            <div key={combo._id} className="card border border-green-100 overflow-hidden flex flex-col">
              {/* Savings badge */}
              <div className="bg-gradient-to-r from-green-800 to-yellow-500 px-4 py-3 relative">
                <span className="absolute top-2 right-2 bg-white text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {savingsPct(combo)}% OFF
                </span>
                <p className="text-white font-bold text-sm leading-tight">{combo.name}</p>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{combo.description}</p>

                {/* Included items */}
                <div className="space-y-1 mb-4 flex-1">
                  {combo.products.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {p.name} — {p.quantity} {p.unit}
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t border-green-50 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xl font-bold text-green-800">₹{combo.comboPrice}</span>
                      <span className="text-xs text-gray-400 line-through ml-2">₹{combo.originalPrice}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Save ₹{savings(combo)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddCombo(combo)}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm"
                  >
                    <FiShoppingCart size={14} /> Add Combo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
