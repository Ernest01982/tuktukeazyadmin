import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

type Profile = { id: string; email: string | null; role: 'rider'|'driver'|'admin' };
type Ctx = {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};
const AuthContext = createContext<Ctx>({} as any);
export const useAuth = () => useContext(AuthContext);

const ADMIN_LIST = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Boot once
  useEffect(() => {
    let unsub: any;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await ensureProfile(data.session.user);
      setLoading(false);

      unsub = supabase.auth.onAuthStateChange(async (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) await ensureProfile(sess.user);
        else setProfile(null);
      }).data.subscription;
    })();
    return () => { try { unsub?.unsubscribe(); } catch {} };
  }, []);

  const ensureProfile = async (u: any) => {
    try {
      const email = (u.email || '').toLowerCase();
      
      // First try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id,email,role')
        .eq('id', u.id)
        .maybeSingle();
      
      if (existingProfile) {
        setProfile(existingProfile as Profile);
        return;
      }
      
      // If no profile exists, try to create one
      if (!existingProfile && !fetchError) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: u.id, email, role: 'rider' })
          .select('id,email,role')
          .single();
        
        if (insertError) {
          console.error('Failed to create profile:', insertError);
          // Set a minimal profile for client-side use
          setProfile({ id: u.id, email, role: 'rider' });
          return;
        }
        
        setProfile(newProfile as Profile);
        return;
      }
      
      // If there was a fetch error, handle it
      if (fetchError) {
        console.error('Failed to fetch profile:', fetchError);
        // Set a minimal profile for client-side use
        setProfile({ id: u.id, email, role: 'rider' });
      }
    } catch (e:any) {
      console.error('profile bootstrap failed', e);
      // Don't show toast error for profile issues, just set minimal profile
      setProfile({ id: u.id, email: (u.email || '').toLowerCase(), role: 'rider' });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); throw error; }
    setSession(data.session);
    setUser(data.user);
    if (data.user) await ensureProfile(data.user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const value = useMemo(() => ({
    user, session, profile, loading,
    isAdmin: (profile?.role === 'admin') || ADMIN_LIST.includes((user?.email || '').toLowerCase()),
    signIn, signOut, refreshProfile: async () => { if (user) await ensureProfile(user); },
  }), [user, session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}