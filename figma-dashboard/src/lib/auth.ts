/**
 * useAuth — Aegis Intelligence Auth Hook
 * Wraps Supabase session + user_profiles role/dealership.
 * RLS on all tables uses auth.uid() automatically.
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  role: 'admin' | 'client';
  dealership_id: string | null;
  dealership_name: string | null;
  full_name: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, role, dealership_id, full_name, dealerships(name)')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        id: data.id,
        role: data.role,
        dealership_id: data.dealership_id,
        dealership_name: (data.dealerships as any)?.name ?? null,
        full_name: data.full_name,
      });
    }
  }

  useEffect(() => {
    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return { user, session, profile, loading, signOut };
}
