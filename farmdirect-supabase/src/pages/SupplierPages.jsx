import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { suppliersAPI, productsAPI, ordersAPI } from '../lib/supabase';
import { Spinner, EmptyState, Button, Input, Select, Stat, OrderStatusBadge } from '../components/ui';
import { ShieldCheck, Package, Plus, Edit2, Trash2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ── SUPPLIER DASHBOARD ───────────────────────────────────────────────
export function SupplierDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    ordersAPI.supplierList(profile.id).then(setOrders).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <Spinner />;

  const pending = orders.filter(o => o.status === 'pending').length;
  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + Number(o.subtotal), 0);

  return (
    <div className="p-5 max-w-3xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Farm dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.name}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${profile?.is_verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {profile?.is_verified ? 'Verified farm' : 'Pending verification'}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Pending" value={pending} sub="need action" />
        <Stat label="Today revenue" value={`AED ${todayRevenue.toFixed(0)}`} highlight />
        <Stat label="Rating" value={profile?.rating || '—'} />
        <Stat label="Total orders" value={profile?.total_orders || 0} />
      </div>
      {orders.filter(o => o.status === 'pending').length > 0 && (
        <>
          <p className="text-sm font-semibold text-red-700 mb-2">⚡ Needs action</p>
          <div className="space-y-2 mb-5">
            {orders.filter(o => o.status === 'pending').map(order => (
              <SupplierOrderCard key={order.id} order={order} onUpdate={(id, status) =>
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
              } />
            ))}
          </div>
        </>
      )}
      <p className="text-sm font-semibold text-gray-800 mb-2">Recent orders</p>
      <div className="space-y-2">
        {orders.filter(o => o.status !== 'pending').slice(0, 5).map(order => (
          <SupplierOrderCard key={order.id} order={order} onUpdate={(id, status) =>
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
          } />
        ))}
        {orders.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No orders yet. Complete your profile and add products.</p>}
      </div>
    </div>
  );
}

function SupplierOrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const nextStatus = { pending:'confirmed', confirmed:'preparing', preparing:'in_transit', in_transit:'delivered' };
  const actionLabel = { pending:'Accept order', confirmed:'Start preparing', preparing:'Mark in transit', in_transit:'Mark delivered' };

  const advance = async () => {
    const next = nextStatus[order.status];
    if (!next) return;
    setLoading(true);
    try {
      await ordersAPI.updateStatus(order.id, next);
      onUpdate(order.id, next);
      toast.success(`Order updated → ${next.replace('_', ' ')}`);
    } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`border rounded-xl p-3 ${order.status === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">{order.restaurant_name}</p>
            {order.is_urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">⚡ Urgent</span>}
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400">{order.order_number} · {format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
          <div className="bg-white rounded-lg border border-gray-100 p-2 mt-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs py-0.5">
                <span className="text-gray-700">{item.product_name}</span>
                <span className="text-gray-500">{item.quantity}{item.unit} · AED {Number(item.line_total).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-semibold">AED {Number(order.subtotal).toFixed(0)}</p>
          {actionLabel[order.status] && (
            <Button size="sm" variant="primary" className="mt-2" loading={loading} onClick={advance}>
              {actionLabel[order.status]}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUPPLIER ORDERS ──────────────────────────────────────────────────
export function SupplierOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!profile?.id) return;
    ordersAPI.supplierList(profile.id).then(setOrders).finally(() => setLoading(false));
  }, [profile]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="p-5 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Incoming orders</h1>
      <p className="text-sm text-gray-500 mb-4">Orders from restaurants</p>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all','pending','confirmed','preparing','in_transit','delivered','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors capitalize ${filter === s ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? `All (${orders.length})` : s.replace('_', ' ')}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {filtered.length === 0 && <EmptyState icon={ClipboardList} title="No orders" description="Orders from restaurants will appear here" />}
          {filtered.map(order => (
            <SupplierOrderCard key={order.id} order={order} onUpdate={(id, status) =>
              setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
            } />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SUPPLIER PRODUCTS ────────────────────────────────────────────────
export function SupplierProducts() {
  const { profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name:'', category:'greens', unit:'kg', price_per_unit:'', min_quantity:1, freshness_days:3, seasonal:false, emoji:'🌿' });

  const load = () => {
    if (!profile?.id) return;
    productsAPI.list({ supplier_id: profile.id }).then(setProducts).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [profile]);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await productsAPI.update(editingId, form); toast.success('Product updated'); }
      else { await productsAPI.create(profile.id, form); toast.success('Product added'); }
      setShowForm(false); setEditingId(null);
      setForm({ name:'', category:'greens', unit:'kg', price_per_unit:'', min_quantity:1, freshness_days:3, seasonal:false, emoji:'🌿' });
      load();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
  };

  return (
    <div className="p-5 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage what restaurants can order</p>
        </div>
        <Button variant="primary" onClick={() => { setShowForm(true); setEditingId(null); }}>
          <Plus className="w-4 h-4" /> Add product
        </Button>
      </div>
      {showForm && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">{editingId ? 'Edit product' : 'New product'}</p>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Product name" value={form.name} onChange={set('name')} required placeholder="e.g. Mixed salad greens" />
              <Input label="Emoji" value={form.emoji} onChange={set('emoji')} placeholder="🌿" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select label="Category" value={form.category} onChange={set('category')}>
                {['greens','vegetables','dairy','herbs','seafood','eggs','fruits','grains','meat'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </Select>
              <Input label="Price (AED)" type="number" step="0.01" value={form.price_per_unit} onChange={set('price_per_unit')} required />
              <Select label="Unit" value={form.unit} onChange={set('unit')}>
                {['kg','g','litre','ml','dozen','bunch','unit','head','box'].map(u => <option key={u}>{u}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min order qty" type="number" value={form.min_quantity} onChange={set('min_quantity')} />
              <Input label="Freshness (days)" type="number" value={form.freshness_days} onChange={set('freshness_days')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="seasonal" checked={form.seasonal} onChange={e => setForm(f => ({ ...f, seasonal: e.target.checked }))} />
              <label htmlFor="seasonal" className="text-sm text-gray-700">Seasonal product</label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="primary" type="submit">Save</Button>
              <Button onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {products.length === 0 && <EmptyState icon={Package} title="No products yet" description="Add your first product so restaurants can order from you" />}
          {products.map(p => (
            <div key={p.id} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-white">
              <span className="text-2xl">{p.emoji || '🌿'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 capitalize">{p.category} · AED {Number(p.price_per_unit).toFixed(2)}/{p.unit} · {p.freshness_days}d shelf life</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm({ name:p.name, category:p.category, unit:p.unit, price_per_unit:p.price_per_unit, min_quantity:p.min_quantity, freshness_days:p.freshness_days, seasonal:p.seasonal, emoji:p.emoji||'🌿' }); setEditingId(p.id); setShowForm(true); }}
                  className="p-1.5 text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                <button onClick={async () => { await productsAPI.delete(p.id); toast.success('Removed'); load(); }}
                  className="p-1.5 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SUPPLIER PROFILE ─────────────────────────────────────────────────
export function SupplierProfile() {
  const { profile } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await suppliersAPI.updateProfile(profile.userId, form);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Farm profile</h1>
      <p className="text-sm text-gray-500 mb-5">Complete your profile to appear in the marketplace</p>
      <div className={`rounded-xl p-4 mb-5 border ${profile?.is_verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-5 h-5 ${profile?.is_verified ? 'text-green-600' : 'text-amber-500'}`} />
          <p className={`text-sm font-medium ${profile?.is_verified ? 'text-green-800' : 'text-amber-800'}`}>
            {profile?.is_verified ? 'Your farm is verified ✓' : 'Verification pending — our team will review your UAE farm license within 2 business days'}
          </p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Farm name" value={form.name || ''} onChange={set('name')} required />
          <Select label="Main category" value={form.category || 'greens'} onChange={set('category')}>
            {['greens','vegetables','dairy','herbs','seafood','eggs','fruits','grains','meat'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" placeholder="+971..." value={form.phone || ''} onChange={set('phone')} />
          <Input label="City / Emirate" placeholder="Dubai" value={form.city || ''} onChange={set('city')} />
        </div>
        <Input label="Farm address" value={form.address || ''} onChange={set('address')} />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">About your farm</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500 resize-none" rows={3}
            placeholder="Tell restaurants about your farm..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Avg delivery (hours)" type="number" value={form.lead_time_hours || 24} onChange={set('lead_time_hours')} />
          <Input label="Min order (AED)" type="number" value={form.min_order_value || 0} onChange={set('min_order_value')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="urgent" checked={form.accepts_urgent || false} onChange={e => setForm(f => ({ ...f, accepts_urgent: e.target.checked }))} />
          <label htmlFor="urgent" className="text-sm text-gray-700">Accept urgent / same-day orders</label>
        </div>
        <Button variant="primary" type="submit" loading={saving}>Save profile</Button>
      </form>
    </div>
  );
}
