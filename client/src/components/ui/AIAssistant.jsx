import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiTrash2, FiShoppingCart, FiStar } from 'react-icons/fi';
import { GiRobotAntennas } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const WELCOME = {
  role: 'bot',
  text: "👋 Hi! I'm **Farma**, your smart farm assistant.\n\nI can help with:\n- 🛒 Search & add products to cart\n- 🥗 Health goal recommendations\n- 🍳 Recipe ideas & storage tips\n- 🌦️ Seasonal produce\n- 💰 Budget grocery planning\n- 🌐 Any general question\n- 🇮🇳 தமிழிலும் கேட்கலாம்!",
  time: new Date(),
};

const QUICK_CHIPS = [
  { label: '🛒 Show tomatoes', msg: 'Show me tomatoes' },
  { label: '💪 Immunity boost', msg: 'What vegetables boost immunity?' },
  { label: '🥗 Weight loss', msg: 'Suggest vegetables for weight loss' },
  { label: '🌦️ In season now', msg: 'What produce is in season now?' },
  { label: '💰 Under ₹200', msg: 'Budget groceries under ₹200' },
  { label: '🍳 Tomato recipe', msg: 'Give me a tomato recipe' },
  { label: '📦 Store carrots', msg: 'How to store carrots?' },
  { label: '🌐 General question', msg: 'What is photosynthesis?' },
];

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';

// Render markdown: **bold**, "- " bullet lists
function MessageText({ text }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isBullet = line.trim().startsWith('- ');
        const content = isBullet ? line.trim().slice(2) : line;
        const parts = content.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
        return isBullet
          ? <div key={i} className="flex gap-1.5 items-start"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" /><span>{rendered}</span></div>
          : <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

// Product card rendered inside chat
function ChatProductCard({ product, onAdd }) {
  return (
    <div className="bg-white border border-green-100 rounded-xl overflow-hidden shadow-sm flex gap-2 p-2">
      <img
        src={product.image || PLACEHOLDER}
        alt={product.name}
        className="w-14 h-14 object-cover rounded-lg shrink-0"
        onError={(e) => { e.target.src = PLACEHOLDER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-xs truncate">{product.name}</p>
        <p className="text-xs text-gray-400 truncate">{product.farmerName || 'Local Farmer'}</p>
        {product.avgRating > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <FiStar className="text-yellow-500 fill-yellow-500" size={9} />
            <span className="text-xs text-gray-500">{Number(product.avgRating).toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-green-800 font-bold text-xs">₹{product.price}/{product.unit || 'kg'}</span>
          <button
            onClick={() => onAdd(product)}
            className="flex items-center gap-1 bg-gradient-to-r from-green-800 to-yellow-500 text-white text-xs px-2 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <FiShoppingCart size={10} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msg, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-8);
      const { data } = await api.post('/ai/chat', { message: msg, history });

      const botMsg = {
        role: 'bot',
        text: data.reply,
        time: new Date(),
        action: data.action || null,
        products: data.products || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: '⚠️ Sorry, I had trouble responding. Please try again.',
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([{ ...WELCOME, time: new Date() }]);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const showChips = messages.length <= 2;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-green-800 to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label="Open AI Assistant"
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {Math.min(messages.length - 1, 9)}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-green-100 flex flex-col overflow-hidden"
          style={{ height: '540px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-900 to-green-700 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400/20 rounded-full flex items-center justify-center shrink-0">
              <GiRobotAntennas className="text-yellow-400 text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Farma AI</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <p className="text-green-300 text-xs">Online · EN / தமிழ்</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-green-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              title="Clear chat"
            >
              <FiTrash2 size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-green-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-800 to-yellow-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 shadow-sm rounded-bl-sm border border-green-100'
                }`}>
                  <MessageText text={msg.text} />

                  {/* Inline product cards */}
                  {msg.action === 'show_products' && msg.products?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map((p) => (
                        <ChatProductCard key={p._id} product={p} onAdd={handleAddToCart} />
                      ))}
                      <button
                        onClick={() => { navigate('/shop'); setOpen(false); }}
                        className="w-full text-xs text-green-700 hover:text-green-900 border border-green-200 rounded-lg py-1.5 mt-1 hover:bg-green-50 transition-colors"
                      >
                        View all in Shop →
                      </button>
                    </div>
                  )}
                </div>
                {msg.time && (
                  <span className="text-xs text-gray-400 mt-0.5 px-1">{formatTime(msg.time)}</span>
                )}
              </div>
            ))}

            {/* Quick Chips */}
            {showChips && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => send(chip.msg)}
                    className="text-xs bg-white border border-green-200 text-green-800 px-3 py-1.5 rounded-full hover:bg-green-800 hover:text-white hover:border-green-800 transition-all font-medium shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center shrink-0">
                  <GiRobotAntennas className="text-yellow-400 text-xs" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-green-100">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-green-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask anything... or தமிழில் கேளுங்கள்"
                className="flex-1 border border-green-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-green-50"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-green-800 to-yellow-500 text-white p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-all active:scale-95"
              >
                <FiSend size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Farma AI · EN / தமிழ் · Farmazon</p>
          </div>
        </div>
      )}
    </>
  );
}
