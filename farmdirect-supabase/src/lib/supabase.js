import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── AUTH ─────────────────────────────────────────────────────────────

export const authAPI = {
  register: async ({ email, password, role, name, phone, city }) => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, name } },
    });
    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Insert into users table
    await supabase.from('users').insert({
      id: userId, email, role, password_hash: 'supabase_auth',
    });

    // 3. Create profile
    if (role === 'restaurant') {
      await supabase.from('restaurants').insert({ user_id: userId, name, phone, city });
    } else {
      await supabase.from('suppliers').insert({ user_id: userId, name, phone, city });
    }

    return authData;
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  logout: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ── SUPPLIERS / FARMS ────────────────────────────────────────────────

export const suppliersAPI = {
  list: async ({ category, search, urgent } = {}) => {
    let q = supabase
      .from('suppliers')
      .select('*, products(count)')
      .eq('active', true)
      .order('rating', { ascending: false });

    if (category) q = q.eq('category', category);
    if (urgent)   q = q.eq('accepts_urgent', true);
    if (search)   q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`*, products(*), reviews(*, restaurants(name))`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  myProfile: async (userId) => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...updates, onboarded: true })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── PRODUCTS ─────────────────────────────────────────────────────────

export const productsAPI = {
  list: async ({ supplier_id, category, search } = {}) => {
    let q = supabase
      .from('products')
      .select('*, suppliers(name, lead_time_hours, city, certifications, is_verified)')
      .eq('active', true)
      .eq('in_stock', true);

    if (supplier_id) q = q.eq('supplier_id', supplier_id);
    if (category)    q = q.eq('category', category);
    if (search)      q = q.ilike('name', `%${search}%`);

    const { data, error } = await q.order('name');
    if (error) throw error;

    // Flatten supplier info onto each product
    return data.map(p => ({
      ...p,
      supplier_name: p.suppliers?.name,
      lead_time_hours: p.suppliers?.lead_time_hours,
      certifications: p.suppliers?.certifications,
      is_verified: p.suppliers?.is_verified,
    }));
  },

  create: async (supplierId, product) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, supplier_id: supplierId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);
    if (error) throw error;
  },
};

// ── ORDERS ───────────────────────────────────────────────────────────

export const ordersAPI = {
  place: async ({ restaurantId, supplierId, items, isUrgent, deliveryNotes, requestedDelivery }) => {
    // Calculate totals
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const platformFee = parseFloat((subtotal * 0.05).toFixed(2));
    const total = subtotal + platformFee;

    // Generate order number
    const orderNumber = 'FD-' + String(Math.floor(Math.random() * 90000) + 10000);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        restaurant_id: restaurantId,
        supplier_id: supplierId,
        subtotal, platform_fee: platformFee, total,
        is_urgent: isUrgent || false,
        delivery_notes: deliveryNotes,
        requested_delivery: requestedDelivery,
        status: 'pending',
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    // Create order items
    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    return order;
  },

  list: async (restaurantId, status) => {
    let q = supabase
      .from('orders')
      .select('*, suppliers(name), order_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data.map(o => ({ ...o, supplier_name: o.suppliers?.name }));
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, suppliers(name, phone), restaurants(name), order_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return {
      ...data,
      supplier_name: data.suppliers?.name,
      supplier_phone: data.suppliers?.phone,
      restaurant_name: data.restaurants?.name,
      items: data.order_items,
    };
  },

  cancel: async (id) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'pending');
    if (error) throw error;
  },

  review: async (orderId, restaurantId, supplierId, { rating, comment }) => {
    const { error } = await supabase.from('reviews').insert({
      order_id: orderId, restaurant_id: restaurantId,
      supplier_id: supplierId, rating, comment,
    });
    if (error) throw error;
  },

  // Supplier: list incoming orders
  supplierList: async (supplierId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, restaurants(name, phone), order_items(*)')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(o => ({
      ...o,
      restaurant_name: o.restaurants?.name,
      restaurant_phone: o.restaurants?.phone,
      items: o.order_items,
    }));
  },

  updateStatus: async (id, status) => {
    const updates = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (error) throw error;
  },
};

// ── INVENTORY / FRESHNESS ────────────────────────────────────────────

export const inventoryAPI = {
  list: async (restaurantId) => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(name, unit, freshness_days), suppliers:products(supplier_id(name))')
      .eq('restaurant_id', restaurantId)
      .gt('quantity_remaining', 0)
      .order('expires_at');
    if (error) throw error;

    return data.map(i => ({
      ...i,
      product_name: i.products?.name,
      unit: i.products?.unit,
      freshness_pct: Math.max(0, Math.min(100,
        100 * (new Date(i.expires_at) - new Date()) /
        (new Date(i.expires_at) - new Date(i.received_at))
      )).toFixed(1),
    }));
  },

  alerts: async (restaurantId) => {
    const twoDaysFromNow = new Date(Date.now() + 2 * 86400000).toISOString();
    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(name, unit, supplier_id)')
      .eq('restaurant_id', restaurantId)
      .gt('quantity_remaining', 0)
      .lt('expires_at', twoDaysFromNow)
      .gt('expires_at', new Date().toISOString());
    if (error) throw error;
    return data.map(i => ({
      ...i,
      product_name: i.products?.name,
      supplier_id: i.products?.supplier_id,
      freshness_pct: Math.max(0, Math.min(100,
        100 * (new Date(i.expires_at) - new Date()) /
        (new Date(i.expires_at) - new Date(i.received_at))
      )).toFixed(1),
    }));
  },

  savings: async (restaurantId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('subtotal, platform_fee, supplier_id, suppliers(name)')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'delivered');
    if (error) throw error;

    const totalSpend = data.reduce((s, o) => s + Number(o.subtotal), 0);
    const totalFees  = data.reduce((s, o) => s + Number(o.platform_fee), 0);
    const netSavings = totalSpend * 0.20 - totalFees;

    // Group by supplier
    const bySupplier = {};
    data.forEach(o => {
      const key = o.supplier_id;
      if (!bySupplier[key]) bySupplier[key] = { supplier_name: o.suppliers?.name, orders: 0, spend: 0 };
      bySupplier[key].orders++;
      bySupplier[key].spend += Number(o.subtotal);
    });
    const bySupplierArr = Object.values(bySupplier).map(s => ({
      ...s, saved: (s.spend * 0.20 - s.spend * 0.05).toFixed(2),
    }));

    return {
      summary: {
        net_savings: netSavings.toFixed(2),
        total_orders: data.length,
        direct_spend: totalSpend.toFixed(2),
      },
      by_supplier: bySupplierArr,
    };
  },
};

// ── NOTIFICATIONS ────────────────────────────────────────────────────

export const notificationsAPI = {
  list: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  markRead: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  markAllRead: async (userId) => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  },

  create: async (userId, { type, title, body, data }) => {
    await supabase.from('notifications').insert({ user_id: userId, type, title, body, data });
  },
};
