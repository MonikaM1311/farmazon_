import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiHeart, FiPackage } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-green-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <GiWheat className="text-yellow-400 text-2xl" />
          <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Farmazon
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-green-100 hover:text-yellow-400 font-medium transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">

          {/* My Orders — consumers only */}
          {user?.role === 'consumer' && (
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1.5 p-2 hover:bg-green-800 rounded-xl transition-colors group"
              title="My Orders"
            >
              <FiPackage className="text-lg text-green-100 group-hover:text-yellow-400 transition-colors" />
            </Link>
          )}

          {/* Wishlist — consumers only */}
          {user?.role === 'consumer' && (
            <Link
              to="/dashboard"
              onClick={() => {}}
              className="hidden sm:flex items-center gap-1.5 p-2 hover:bg-green-800 rounded-xl transition-colors group"
              title="Wishlist"
              state={{ tab: 'wishlist' }}
            >
              <FiHeart className="text-lg text-green-100 group-hover:text-red-400 transition-colors" />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative p-2 hover:bg-green-800 rounded-xl transition-colors ml-1">
            <FiShoppingCart className="text-xl text-green-100" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-green-900 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>

          {/* Profile / Auth */}
          {user ? (
            <div className="relative ml-1">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 bg-green-800 hover:bg-green-700 px-3 py-2 rounded-xl transition-colors"
              >
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-green-900 font-bold text-xs">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-yellow-300 hidden sm:block">{user.name.split(' ')[0]}</span>
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <Link
                    to={user.role === 'farmer' ? '/farmer/dashboard' : '/dashboard'}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                    onClick={() => setDropOpen(false)}
                  >
                    <FiUser size={14} /> Dashboard
                  </Link>
                  {user.role === 'consumer' && (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                        onClick={() => setDropOpen(false)}
                      >
                        <FiPackage size={14} /> My Orders
                      </Link>
                      <Link
                        to="/dashboard"
                        state={{ tab: 'wishlist' }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                        onClick={() => setDropOpen(false)}
                      >
                        <FiHeart size={14} /> Wishlist
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 mt-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4 ml-1">Login</Link>
          )}

          <button className="md:hidden p-2 text-green-100" onClick={() => setOpen(!open)}>
            {open ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-green-800 border-t border-green-700 px-4 py-3 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-green-100 hover:text-yellow-400 font-medium py-1 transition-colors" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
