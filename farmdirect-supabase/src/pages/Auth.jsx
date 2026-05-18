import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';
import { Sprout } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      // Auth state change will redirect via App.jsx
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold">FarmDirect UAE</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Access your restaurant or farm account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Password" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Button variant="primary" className="w-full justify-center" loading={loading} type="submit">
            Sign in
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          No account? <Link to="/register" className="text-green-700 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'restaurant', phone: '', city: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Check your email to confirm.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold">FarmDirect UAE</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-5">Join as a restaurant or UAE farm</p>

        <div className="flex rounded-lg border border-gray-200 p-1 mb-4">
          {['restaurant', 'supplier'].map(r => (
            <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors capitalize font-medium ${
                form.role === r ? 'bg-green-700 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'supplier' ? '🌿 Farm' : '🍽️ Restaurant'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label={form.role === 'restaurant' ? 'Restaurant name' : 'Farm name'}
            placeholder="Name" value={form.name} onChange={set('name')} required />
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="Min 6 characters"
            value={form.password} onChange={set('password')} minLength={6} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" placeholder="+971..." value={form.phone} onChange={set('phone')} />
            <Input label="City" placeholder="Dubai" value={form.city} onChange={set('city')} />
          </div>
          <Button variant="primary" className="w-full justify-center" loading={loading} type="submit">
            Create account
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          Have an account? <Link to="/login" className="text-green-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
