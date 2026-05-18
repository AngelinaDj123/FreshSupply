import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../lib/supabase';
import { Button, Input } from '../components/ui';
import { ShoppingCart, Zap, Crown, Trash2, Plus, Minus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const DELIVERY_OPTIONS = [
  { id: 'express',  label: 'Express',   icon: '⚡', time: '2–4 hours',   fee: 15 },
  { id: 'morning',  label: 'Morning',   icon: '🌅', time: 'By 8:00 AM',  fee: 8  },
  { id: 'schedule', label: 'Scheduled', icon: '📅', time: 'Plan ahead',  fee: 0  },
];

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [delivery, setDelivery] = useState('express');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateQty = (id, delta) => setCart(prev => prev.map(i =>
    i.id !== id ? i : { ...i, qty: Math.max(i.min_quantity || 1, i.qty + delta) }
  ));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const bySupplier = cart.reduce((acc, item) => {
    const key = item.supplier_id;
    if (!acc[key]) acc[key] = { supplier_name: item.supplier_name, supplier_id: key, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const subtotal = cart.reduce((s, i) => s + i.qty * Number(i.price_per_unit), 0);
  const deliveryFee = DELIVERY_OPTIONS.find(d => d.id === delivery)?.fee || 0;
  const platformFee = subtotal * 0.05;
  const total = subtotal + deliveryFee + platformFee;

  const getDeliveryTime = () => {
    const now = new Date();
    if (delivery === 'express') return new Date(now.getTime() + 4 * 3600000).toISOString();
    if (delivery === 'morning') { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0); return d.toISOString(); }
    return null;
  };

  const placeOrder = async () => {
    if (!cart.length) return;
    if (!profile?.id) { toast.error('Please log in'); return; }
    setLoading(true);
    try {
      const groups = Object.values(bySupplier);
      for (const group of groups) {
        await ordersAPI.place({
          restaurantId: profile.id,
          supplierId: group.supplier_id,
          items: group.items.map(i => ({
            product_id: i.id, name: i.name, unit: i.unit,
            quantity: i.qty, unit_price: Number(i.price_per_unit),
          })),
          isUrgent: delivery === 'express',
          deliveryNotes: notes,
          requestedDelivery: getDeliveryTime(),
        });
      }
      setCart([]);
      toast.success('Orders placed! 🎉');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
      <ShoppingCart className="w-12 h-12 text-gray-200 mb-4" />
      <p className="text-gray-600 font-medium mb-1">Your cart is empty</p>
      <p className="text-sm text-gray-400 mb-5">Browse UAE farms and add produce to get started</p>
      <Button variant="primary" onClick={() => navigate('/marketplace')}>Browse marketplace</Button>
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-5">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Your cart</h1>
        {Object.values(bySupplier).map(group => (
          <div key={group.supplier_id} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              <p className="text-sm font-medium text-gray-700">{group.supplier_name || 'Farm'}</p>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {group.items.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 ${idx !== group.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">{item.emoji || '🌿'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">AED {Number(item.price_per_unit).toFixed(0)}/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -(item.min_quantity || 1))} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm w-10 text-center font-medium">{item.qty}{item.unit}</span>
                    <button onClick={() => updateQty(item.id, item.min_quantity || 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="text-sm font-semibold w-16 text-right">AED {(item.qty * Number(item.price_per_unit)).toFixed(0)}</div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 ml-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Delivery speed</p>
          <div className="grid grid-cols-3 gap-3">
            {DELIVERY_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setDelivery(opt.id)}
                className={`p-3 rounded-xl border text-center transition-all ${delivery === opt.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{opt.icon}</div>
                <p className="text-xs font-medium text-gray-800">{opt.label}</p>
                <p className="text-xs text-green-600 mt-0.5">{opt.time}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.fee === 0 ? 'Free' : `AED ${opt.fee}`}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-5">
          <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">FarmDirect Prime</p>
            <p className="text-xs text-amber-600 mt-0.5">Free express delivery + priority stock from UAE farms</p>
          </div>
          <button className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 whitespace-nowrap">Try free</button>
        </div>

        <Input label="Delivery notes (optional)" placeholder="e.g. call on arrival, loading bay B"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="w-64 border-l border-gray-100 bg-gray-50 p-4 flex flex-col flex-shrink-0">
        <p className="text-sm font-semibold text-gray-800 mb-4">Order summary</p>
        <div className="space-y-2 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-gray-600 truncate mr-2">{item.name} ×{item.qty}</span>
              <span className="font-medium shrink-0">AED {(item.qty * Number(item.price_per_unit)).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>AED {subtotal.toFixed(0)}</span></div>
          <div className="flex justify-between text-sm text-gray-500"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `AED ${deliveryFee}`}</span></div>
          <div className="flex justify-between text-sm text-gray-500"><span>Platform fee (5%)</span><span>AED {platformFee.toFixed(0)}</span></div>
          <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200"><span>Total</span><span>AED {total.toFixed(0)}</span></div>
        </div>
        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-2.5 text-xs text-green-700">
          Saving ~AED {(subtotal * 0.15).toFixed(0)} vs middleman prices
        </div>
        <Button variant="primary" className="w-full justify-center mt-4 py-2.5" loading={loading} onClick={placeOrder}>
          {delivery === 'express' && <Zap className="w-4 h-4" />} Place order
        </Button>
        <button onClick={() => navigate('/marketplace')} className="text-xs text-green-700 hover:underline text-center mt-3">← Continue shopping</button>
      </div>
    </div>
  );
}
