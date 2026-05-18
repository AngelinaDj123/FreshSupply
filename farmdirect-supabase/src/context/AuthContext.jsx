import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }

    // Get role from users table
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    const role = userRow?.role || authUser.user_metadata?.role;

    // Get profile (restaurant or supplier)
    let profileData = null;
    if (role === 'restaurant') {
      const { data } = await supabase.from('restaurants').select('*').eq('user_id', authUser.id).single();
      profileData = data;
    } else if (role === 'supplier') {
      const { data } = await supabase.from('suppliers').select('*').eq('user_id', authUser.id).single();
      profileData = data;
    }

    setProfile({ ...profileData, role, userId: authUser.id, email: authUser.email });
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (formData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { role: formData.role, name: formData.name } },
    });
    if (error) throw error;

    const userId = authData.user.id;

    // Insert into users table
    await supabase.from('users').insert({
      id: userId,
      email: formData.email,
      role: formData.role,
      password_hash: 'supabase_auth',
    });

    // Create profile
    if (formData.role === 'restaurant') {
      await supabase.from('restaurants').insert({
        user_id: userId,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
      });
    } else {
      await supabase.from('suppliers').insert({
        user_id: userId,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
      });
    }

    return authData;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
