'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { signIn, loading, error, needsVerification } = useAuth();
  const router = useRouter();
  const verifyStatus = typeof router.query.verify === 'string' ? router.query.verify : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendState('idle');
    const success = await signIn(email, password);

    // Hanya redirect jika login berhasil
    if (success) {
      router.push('/');
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResendState('sent');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">Selamat Datang</h2>
          <p className="text-base-content/70">Masuk untuk melanjutkan membaca novel favoritmu</p>
          {verifyStatus === 'success' && (
            <p className="text-sm text-success mt-2">Email berhasil diverifikasi. Silakan masuk.</p>
          )}
          {(verifyStatus === 'invalid' || verifyStatus === 'error') && (
            <p className="text-sm text-error mt-2">Link verifikasi tidak valid atau sudah kedaluwarsa.</p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/50" />
                </div>
                <input
                  type="email"
                  required
                  className="input input-bordered w-full pl-10 bg-base-100"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/50" />
                </div>
                <input
                  type="password"
                  required
                  className="input input-bordered w-full pl-10 bg-base-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <label className="label">
                <Link href="/forgot-password" className="label-text-alt link link-primary">
                  Lupa password?
                </Link>
              </label>
            </div>
          </div>

          {error && (
            <div className="alert alert-error shadow-lg">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {needsVerification && (
            <div className="text-center">
              {resendState === 'sent' ? (
                <p className="text-sm text-base-content/70">Kalau email kamu terdaftar, link baru sudah dikirim.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending' || !email}
                  className="btn btn-sm btn-outline"
                >
                  {resendState === 'sending' ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
                </button>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Masuk'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-base-content/70">
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="link link-primary font-medium"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 