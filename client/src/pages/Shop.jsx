import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ui/ProductCard';
import { ProductSkeleton } from '../components/ui/Skeleton';
import ComboPacks from '../components/ui/ComboPacks';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';

const CATEGORIES = ['all', 'fruit', 'vegetable', 'grain', 'dairy', 'other'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Parse natural language: "fresh tomatoes under ₹50" → { search: 'tomatoes', maxPrice: 50 }
const parseSmartSearch = (text) => {
  const result = { search: text, minPrice: '', maxPrice: '' };
  const underMatch = text.match(/under\s*[₹rs]?\s*(\d+)/i);
  const aboveMatch = text.match(/above\s*[₹rs]?\s*(\d+)/i);
  const betweenMatch = text.match(/between\s*[₹rs]?\s*(\d+)\s*(?:and|to|-)\s*[₹rs]?\s*(\d+)/i);
  if (betweenMatch) { result.minPrice = betweenMatch[1]; result.maxPrice = betweenMatch[2]; }
  else if (underMatch) result.maxPrice = underMatch[1];
  else if (aboveMatch) result.minPrice = aboveMatch[1];
  result.search = text.replace(/under\s*[₹rs]?\s*\d+/i, '').replace(/above\s*[₹rs]?\s*\d+/i, '').replace(/between\s*[₹rs]?\s*\d+\s*(?:and|to|-)\s*[₹rs]?\s*\d+/i, '').replace(/fresh|organic|local/gi, '').trim();
  return result;
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, sort };
        if (category !== 'all') params.category = category;
        if (search) params.search = search;
        if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice');
        if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice');
        const { data } = await api.get('/products', { params });
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category, search, sort, page, searchParams]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setPage(1);
    setSearchParams(p);
  };

  const handleSmartSearch = (raw) => {
    const parsed = parseSmartSearch(raw);
    const p = new URLSearchParams(searchParams);
    if (parsed.search) p.set('search', parsed.search); else p.delete('search');
    if (parsed.minPrice) { p.set('minPrice', parsed.minPrice); setMinPrice(parsed.minPrice); } else p.delete('minPrice');
    if (parsed.maxPrice) { p.set('maxPrice', parsed.maxPrice); setMaxPrice(parsed.maxPrice); } else p.delete('maxPrice');
    p.delete('page');
    setPage(1);
    setSearchParams(p);
  };

  const applyPriceFilter = () => {
    const p = new URLSearchParams(searchParams);
    if (minPrice) p.set('minPrice', minPrice); else p.delete('minPrice');
    if (maxPrice) p.set('maxPrice', maxPrice); else p.delete('maxPrice');
    p.delete('page');
    setPage(1);
    setSearchParams(p);
    setShowFilters(false);
  };

  const clearAll = () => {
    setMinPrice(''); setMaxPrice(''); setSearchInput('');
    setSearchParams({});
    setPage(1);
  };

  const hasFilters = category !== 'all' || search || searchParams.get('minPrice') || searchParams.get('maxPrice');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-900">Fresh Produce</h1>
        <p className="text-gray-500 text-sm mt-1">{total} products available</p>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder='Smart search: "fresh tomatoes under ₹50"'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSmartSearch(e.target.value);
              if (!e.target.value) clearAll();
            }}
          />
        </div>
        <select className="input sm:w-44" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${showFilters || searchParams.get('minPrice') || searchParams.get('maxPrice') ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 text-gray-600 hover:border-green-700'}`}
        >
          <FiFilter size={14} /> Filters
          {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
        </button>
      </div>

      {/* Price Filter Panel */}
      {showFilters && (
        <div className="card p-4 mb-4 border border-green-100 flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Min Price (₹)</label>
            <input type="number" className="input w-32" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Max Price (₹)</label>
            <input type="number" className="input w-32" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min="0" />
          </div>
          <button onClick={applyPriceFilter} className="btn-primary py-2 px-5 text-sm">Apply</button>
          <button onClick={() => { setMinPrice(''); setMaxPrice(''); const p = new URLSearchParams(searchParams); p.delete('minPrice'); p.delete('maxPrice'); setSearchParams(p); setShowFilters(false); }} className="text-sm text-gray-500 hover:text-red-500">Clear</button>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap mb-6 items-center">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setParam('category', c === 'all' ? '' : c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              category === c || (c === 'all' && !searchParams.get('category'))
                ? 'bg-gradient-to-r from-green-800 to-yellow-500 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-700'
            }`}
          >
            {c}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-2">
            <FiX size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Combo Packs */}
      <ComboPacks />

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-gray-500 text-lg">No products found</p>
          <button onClick={clearAll} className="btn-primary mt-4">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl font-medium text-sm transition-all ${
                page === i + 1
                  ? 'bg-gradient-to-r from-green-800 to-yellow-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
