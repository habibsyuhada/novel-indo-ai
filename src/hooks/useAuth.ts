import { useState, useEffect, useCallback } from 'react';
import { AuthState, User } from '@/types/user';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: User | null }) => {
        if (cancelled) return;
        setAuthState({ user: data.user, loading: false, error: null });
      })
      .catch(() => {
        if (cancelled) return;
        setAuthState({ user: null, loading: false, error: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal mendaftar');

      setAuthState({ user: data.user, loading: false, error: null });
      return true;
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      return false;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal masuk');

      setAuthState({ user: data.user, loading: false, error: null });
      return true;
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  };
};
