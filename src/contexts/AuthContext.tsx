import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState, User } from '@/types/user';

type SignUpResult = { success: boolean; message?: string };

type AuthContextValue = AuthState & {
  signUp: (email: string, password: string, name: string, turnstileToken: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    needsVerification: false,
  });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: User | null }) => {
        if (cancelled) return;
        setAuthState({ user: data.user, loading: false, error: null, needsVerification: false });
      })
      .catch(() => {
        if (cancelled) return;
        setAuthState({ user: null, loading: false, error: null, needsVerification: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, turnstileToken: string): Promise<SignUpResult> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null, needsVerification: false }));
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, turnstileToken }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal mendaftar');

      setAuthState({ user: null, loading: false, error: null, needsVerification: false });
      return { success: true, message: data.message };
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { success: false };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null, needsVerification: false }));
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: data.error ?? 'Gagal masuk',
          needsVerification: data.code === 'EMAIL_NOT_VERIFIED',
        }));
        return false;
      }

      setAuthState({ user: data.user, loading: false, error: null, needsVerification: false });
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
      setAuthState({ user: null, loading: false, error: null, needsVerification: false });
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
