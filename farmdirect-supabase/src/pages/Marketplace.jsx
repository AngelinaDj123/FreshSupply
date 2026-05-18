import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../lib/supabase';
import { Spinner, EmptyState } from '../components/ui';
import { Search, ShoppingCart, Zap, Clock, ShieldCheck, Leaf, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🛒' },
  { id: 'greens', label: 'Greens', emoji: '🥬' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🍅' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'herbs', label: 'Herbs', emoji: '🌿' },
  { id: 'seafood', label: 'Seafood', emoji: '🐟' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'fruits', label: 'Fruits', emoji: '🍋' },
  { id: 'grains', label: 'Grains', emoji: '🌾' },
  { id: 'meat', label: 'Meat', emoji: '🥩' },
];

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => navigate(`/farms/${product.supplier_id}`)}
    >
      <div className="h-24 bg-gray-50 flex items-center justify-center text-4xl">
        {product.emoji || '🌿'}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 mb-0.5 truncate">{product.name}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3 text-green-600 shrink-0" />
          <span className="truncate">{product.supplier_name}</span>
        </div>
        <div className="flex gap-1 flex-wrap mb-2">
          {product.is_verified && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
              <ShieldCheck className="w-2.5 h-2.5" /> Verified
            </span>
          )}
          {product.certifications?.includes('organic') && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-800 border border-green-200 font-medium">
              <Leaf className="w-2.5 h-2.5" /> Organic
            </span>
          )}
          {product.certifications?.includes('halal') && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">Halal</span>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-900">AED {Number(product.price_per_unit).toFixed(0)}</span>
            <span className="text-xs text-gray-400">/{product.unit}</span>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Clock className="w-3 h-3" />{product.lead_time_hours || 2}h delivery
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(product); }}
            className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-800 transition-colors text-lg leading-none"
          >+</button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    productsAPI.list({ category: category === 'all' ? undefined : category, search: search || undefined })
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: product.min_quantity || 1 }];
    });
    toast.success(`${product.name} added!`, { icon: '🛒', duration: 1500 });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-500 bg-gray-50"
            placeholder="Search UAE produce, farms, certifications..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => {}}
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" /> Cart
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{cartCount}</span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="px-5 py-2.5 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              category === c.id ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="mx-5 mt-4 mb-2 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Shop directly from UAE farms</p>
            <p className="text-xs text-green-600 mt-0.5">No middlemen · Harvest-fresh · Government-verified</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-green-200 rounded-full px-3 py-1.5 text-xs font-medium text-green-700">
            <Zap className="w-3 h-3" /> 2–4h delivery
          </div>
        </div>

        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            {category === 'all' ? 'All UAE produce' : CATEGORIES.find(c => c.id === category)?.label}
          </p>
          <p className="text-xs text-gray-400">{products.length} items</p>
        </div>

        {loading ? <Spinner /> : (
          <div className="px-5 pb-6 grid grid-cols-3 gap-3">
            {products.length === 0 && <div className="col-span-3"><EmptyState title="No products found" description="Try a different category" /></div>}
            {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
          </div>
        )}
      </div>
    </div>
  );
}
