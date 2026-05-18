import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../lib/supabase';
import { Spinner } from '../components/ui';
import { MapPin, Clock, Star, ShieldCheck, Leaf, Award, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FarmDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suppliersAPI.get(id).then(setFarm).catch(() => toast.error('Farm not found')).finally(() => setLoading(false));
  }, [id]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: product.min_quantity || 1, supplier_name: farm.name, supplier_id: farm.id }];
    });
    toast.success(`${product.name} added!`, { icon: '🛒', duration: 1500 });
  };

  if (loading) return <Spinner />;
  if (!farm) return <div className="p-6 text-gray-400">Farm not found</div>;

  const badges = [
    farm.is_verified    && { label: 'Verified',         color: 'bg-green-50 text-green-700 border-green-200',   icon: ShieldCheck },
    farm.gov_licensed   && { label: 'UAE Gov. Licensed', color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Award },
    farm.certifications?.includes('organic')    && { label: 'Certified Organic', color: 'bg-green-50 text-green-800 border-green-200', icon: Leaf },
    farm.certifications?.includes('halal')      && { label: 'Halal',             color: 'bg-amber-50 text-amber-700 border-amber-200', icon: null },
    farm.certifications?.includes('hydroponic') && { label: 'Hydroponic',        color: 'bg-teal-50 text-teal-700 border-teal-200',   icon: null },
    farm.team_reviewed  && { label: 'Team Reviewed',    color: 'bg-purple-50 text-purple-700 border-purple-200', icon: ShieldCheck },
  ].filter(Boolean);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-5 pt-4 pb-0 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center text-3xl border border-green-100 flex-shrink-0">
            {farm.emoji || '🌿'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{farm.name}</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-green-600" />{farm.city}, UAE
            </div>
            {farm.description && <p className="text-sm text-gray-500 mt-2">{farm.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <span key={i} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${b.color}`}>
                {Icon && <Icon className="w-3 h-3" />}{b.label}
              </span>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Rating', value: farm.rating ? `${farm.rating} ★` : '—' },
            { label: 'Orders', value: farm.total_orders || 0 },
            { label: 'Delivery', value: `${farm.lead_time_hours || '?'}h` },
            { label: 'Products', value: farm.products?.length || 0 },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
              <p className="text-base font-semibold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">Products from this farm</p>
        {!farm.products?.length && <p className="text-sm text-gray-400 py-6 text-center">No products listed yet</p>}
        <div className="grid grid-cols-2 gap-3">
          {farm.products?.map(product => (
            <div key={product.id} className="border border-gray-100 rounded-xl p-3 hover:border-green-200 transition-colors">
              <p className="text-sm font-medium text-gray-900">{product.emoji || '🌿'} {product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{product.freshness_days}d shelf life · min {product.min_quantity}{product.unit}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-sm font-semibold">AED {Number(product.price_per_unit).toFixed(0)}</span>
                  <span className="text-xs text-gray-400">/{product.unit}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />{farm.lead_time_hours || 2}h
                  </div>
                </div>
                <button onClick={() => addToCart({ ...product, supplier_id: farm.id })}
                  className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-800 transition-colors text-lg">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {farm.reviews?.length > 0 && (
        <div className="px-5 pb-6">
          <p className="text-sm font-semibold text-gray-800 mb-3">Reviews</p>
          <div className="space-y-3">
            {farm.reviews.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{r.restaurants?.name}</p>
                  <div className="flex text-amber-400">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-500">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
