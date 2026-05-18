import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, inventoryAPI, notificationsAPI } from '../lib/supabase';
import { Spinner, EmptyState, Button, OrderStatusBadge, Stat } from '../components/ui';
import { ClipboardList, Bell, CheckCheck, Leaf, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── ORDERS LIST ──────────────────────────────────────────────────────
export function OrdersList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!profile?.id) return;
    ordersAPI.list(profile.id, filter !== 'all' ? filter : undefined)
      .then(setOrders).catch(() => toast.error('Failed to load orders')).finally(() => setLoading(false));
  }, [profile, filter]);

  return (
    <div className="p-5 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">My Orders</h1>
      <p className="text-sm text-gray-500 mb-4">All your direct-farm orders</p>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all','pending','confirmed','in_transit','delivered','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors capitalize ${filter === s ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {orders.length === 0 && <EmptyState icon={ClipboardList} title="No orders yet" description="Place your first order from the marketplace" action={<Button variant="primary" onClick={() => navigate('/marketplace')}>Browse marketplace</Button>} />}
          {orders.map(order => (
            <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-green-200 transition-colors">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700 shrink-0">
                {(order.supplier_name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{order.supplier_name}</p>
                  {order.is_urgent && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Urgent</span>}
                </div>
                <p className="text-xs text-gray-500">{order.order_number} · {format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">AED {Number(order.total).toFixed(0)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ORDER DETAIL ─────────────────────────────────────────────────────
export function OrderDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    ordersAPI.get(id).then(setOrder).catch(() => toast.error('Order not found')).finally(() => setLoading(false));
  }, [id]);

  const submitReview = async () => {
    try {
      await ordersAPI.review(id, profile?.id, order.supplier_id, { rating, comment });
      toast.success('Review submitted!');
      setReviewing(false);
    } catch (err) { toast.error('Failed to submit review'); }
  };

  if (loading) return <Spinner />;
  if (!order) return <div className="p-6 text-gray-400">Order not found</div>;

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Order {order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(order.created_at), 'MMMM d, yyyy · h:mm a')}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Supplier</p>
          <p className="font-medium text-gray-900">{order.supplier_name}</p>
          {order.supplier_phone && <p className="text-sm text-gray-500">{order.supplier_phone}</p>}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
          <div className="space-y-2">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.product_name} <span className="text-gray-400">×{item.quantity}{item.unit}</span></span>
                <span className="font-medium">AED {Number(item.line_total).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>AED {Number(order.subtotal).toFixed(0)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Platform fee</span><span>AED {Number(order.platform_fee).toFixed(0)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>AED {Number(order.total).toFixed(0)}</span></div>
          </div>
        </div>
        {order.status === 'delivered' && !reviewing && (
          <Button onClick={() => setReviewing(true)}>⭐ Leave a review</Button>
        )}
        {reviewing && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">Rate this order</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
            <textarea className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-500 resize-none" rows={3}
              placeholder="How was the quality and delivery?" value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={submitReview}>Submit</Button>
              <Button onClick={() => setReviewing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FRESHNESS ────────────────────────────────────────────────────────
export function Freshness() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([inventoryAPI.list(profile.id), inventoryAPI.alerts(profile.id)])
      .then(([inv, alrt]) => { setInventory(inv); setAlerts(alrt); })
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <Spinner />;

  const sections = [
    { title: '🔴 Critical — use or reorder now', items: inventory.filter(i => parseFloat(i.freshness_pct) < 30) },
    { title: '🟡 Fair — keep an eye on these',   items: inventory.filter(i => parseFloat(i.freshness_pct) >= 30 && parseFloat(i.freshness_pct) < 60) },
    { title: '🟢 Good — plenty of freshness left', items: inventory.filter(i => parseFloat(i.freshness_pct) >= 60) },
  ].filter(s => s.items.length > 0);

  return (
    <div className="p-5 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Freshness tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live shelf-life of your inventory</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/marketplace')}><RefreshCw className="w-4 h-4" /> Reorder</Button>
      </div>
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-medium text-red-800">{alerts.length} item{alerts.length > 1 ? 's' : ''} expiring within 48 hours</p>
          </div>
          {alerts.map(a => (
            <div key={a.id} className="flex items-center gap-3">
              <span className="text-sm text-red-700 flex-1">{a.product_name}</span>
              <span className="text-xs text-red-500">Expires {formatDistanceToNow(new Date(a.expires_at), { addSuffix: true })}</span>
              <Button size="sm" variant="primary" onClick={() => navigate('/marketplace')}>Reorder</Button>
            </div>
          ))}
        </div>
      )}
      {inventory.length === 0 && <EmptyState icon={Leaf} title="No inventory yet" description="Place your first order to start tracking freshness" action={<Button variant="primary" onClick={() => navigate('/marketplace')}>Browse marketplace</Button>} />}
      {sections.map(section => (
        <div key={section.title} className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">{section.title}</p>
          <div className="border rounded-xl overflow-hidden bg-white">
            {section.items.map((item, idx) => {
              const pct = parseFloat(item.freshness_pct);
              const color = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-amber-400' : 'bg-red-500';
              const daysLeft = Math.max(0, Math.round((new Date(item.expires_at) - new Date()) / 86400000));
              return (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== section.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-sm font-semibold w-10 text-right ${pct < 30 ? 'text-red-600' : pct < 60 ? 'text-amber-600' : 'text-green-600'}`}>{Math.round(pct)}%</span>
                  <span className="text-xs text-gray-400 w-14 text-right">{daysLeft}d left</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SAVINGS ──────────────────────────────────────────────────────────
export function Savings() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    inventoryAPI.savings(profile.id).then(setData).finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <Spinner />;
  const s = data?.summary || {};

  return (
    <div className="p-5 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Your savings</h1>
      <p className="text-sm text-gray-500 mb-5">Money saved buying direct from UAE farms</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600 mb-1">Total saved</p>
          <p className="text-2xl font-semibold text-green-800">AED {Number(s.net_savings || 0).toFixed(0)}</p>
          <p className="text-xs text-green-500 mt-1">vs middleman prices</p>
        </div>
        <Stat label="Total orders" value={s.total_orders || 0} sub="all delivered" />
        <Stat label="Avg markup avoided" value="~19%" sub="per order" />
      </div>
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex gap-3 items-start">
        <TrendingDown className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-800">How we calculate savings</p>
          <p className="text-sm text-green-600 mt-1">Traditional distributors add 15–25% markup. FarmDirect charges only 5%, passing the rest to you.</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-3">Breakdown by farm</p>
      <div className="space-y-2">
        {(data?.by_supplier || []).map((row, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-white">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-sm font-semibold text-green-700 shrink-0">
              {(row.supplier_name || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{row.supplier_name}</p>
              <p className="text-xs text-gray-400">{row.orders} orders · AED {Number(row.spend || 0).toFixed(0)} spent</p>
            </div>
            <p className="text-sm font-semibold text-green-700">AED {Number(row.saved || 0).toFixed(0)} saved</p>
          </div>
        ))}
        {!data?.by_supplier?.length && <p className="text-sm text-gray-400 text-center py-8">No delivered orders yet</p>}
      </div>
    </div>
  );
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────
export function Notifications() {
  const { profile } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.userId) return;
    notificationsAPI.list(profile.userId).then(setNotifs).finally(() => setLoading(false));
  }, [profile]);

  const markAllRead = async () => {
    await notificationsAPI.markAllRead(profile.userId);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unread = notifs.filter(n => !n.read).length;
  const TYPE_ICONS = { new_order:'🛒', order_confirmed:'✅', order_preparing:'👨‍🍳', order_in_transit:'🚚', order_delivered:'📦', freshness_alert:'🌿', order_cancelled:'❌' };

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-green-700 hover:underline">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>
      {loading ? <Spinner /> : (
        <>
          {notifs.length === 0 && <EmptyState icon={Bell} title="No alerts yet" description="Order updates will appear here" />}
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${n.read ? 'bg-white border-gray-100' : 'bg-green-50 border-green-200'}`}>
                <span className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
