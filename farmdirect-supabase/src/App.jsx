import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { LoginPage, RegisterPage } from './pages/Auth';
import Marketplace from './pages/Marketplace';
import Farms from './pages/Farms';
import FarmDetail from './pages/FarmDetail';
import Cart from './pages/Cart';
import { OrdersList, OrderDetail, Freshness, Savings, Notifications } from './pages/RestaurantPages';
import { SupplierDashboard, SupplierOrders, SupplierProducts, SupplierProfile } from './pages/SupplierPages';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function HomeRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={profile?.role === 'supplier' ? '/supplier/dashboard' : '/marketplace'} replace />;
}

function AppRoutes() {
  const [cart, setCart] = useState([]);
  const { profile } = useAuth();
  const isSupplier = profile?.role === 'supplier';

  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/"         element={<HomeRedirect />} />

      <Route element={<RequireAuth><Layout cart={cart} /></RequireAuth>}>
        {/* Restaurant */}
        <Route path="/marketplace"  element={<Marketplace cart={cart} setCart={setCart} />} />
        <Route path="/farms"        element={<Farms />} />
        <Route path="/farms/:id"    element={<FarmDetail cart={cart} setCart={setCart} />} />
        <Route path="/cart"         element={<Cart cart={cart} setCart={setCart} />} />
        <Route path="/orders"       element={<OrdersList />} />
        <Route path="/orders/:id"   element={<OrderDetail />} />
        <Route path="/freshness"    element={<Freshness />} />
        <Route path="/savings"      element={<Savings />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Supplier */}
        <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        <Route path="/supplier/orders"    element={<SupplierOrders />} />
        <Route path="/supplier/products"  element={<SupplierProducts />} />
        <Route path="/supplier/profile"   element={<SupplierProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { fontFamily: 'inherit', fontSize: '14px' },
          success: { iconTheme: { primary: '#3B6D11', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
