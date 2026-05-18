import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, Building2, ShoppingCart, ClipboardList, Leaf, Coins, Package, Bell, LogOut, Sprout, Store, Crown } from 'lucide-react';

const restaurantNav = [
  { to: '/marketplace', icon: LayoutGrid,    label: 'Marketplace' },
  { to: '/farms',       icon: Building2,     label: 'UAE Farms' },
  { to: '/cart',        icon: ShoppingCart,  label: 'Cart', showBadge: true },
  { to: '/orders',      icon: ClipboardList, label: 'My Orders' },
  { to: '/freshness',   icon: Leaf,          label: 'Freshness' },
  { to: '/savings',     icon: Coins,         label: 'Savings' },
];

const supplierNav = [
  { to: '/supplier/dashboard', icon: LayoutGrid,    label: 'Dashboard' },
  { to: '/supplier/orders',    icon: ClipboardList, label: 'Orders' },
  { to: '/supplier/products',  icon: Package,       label: 'My Products' },
  { to: '/supplier/profile',   icon: Store,         label: 'Farm Profile' },
];

export default function Layout({ cart }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const isSupplier = profile?.role === 'supplier';
  const navItems = isSupplier ? supplierNav : restaurantNav;
  const cartCount = cart?.reduce((s, i) => s + i.qty, 0) || 0;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">FarmDirect</p>
              <p className="text-xs text-gray-400 capitalize leading-tight">{profile?.role}</p>
            </div>
          </div>
          {profile?.name && (
            <p className="text-xs text-gray-500 mt-2 truncate font-medium">{profile.name}</p>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, showBadge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {showBadge && cartCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{cartCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          {!isSupplier && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-2 mb-1 cursor-pointer hover:bg-amber-100 transition-colors">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Get Prime</span>
            </div>
          )}
          <NavLink to="/notifications"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`
            }
          >
            <Bell className="w-4 h-4" /> Alerts
          </NavLink>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
