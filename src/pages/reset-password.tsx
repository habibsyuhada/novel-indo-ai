'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Lock, Check, X } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from '@/lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = {
    length: password.length >= PASSWORD_MIN_LENGTH,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const CheckItem = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? 'text-success' : 'text-base-content/50'}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {children}
    </li>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Link reset password tidak valid.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password belum memenuhi semua syarat di bawah.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setStatus('saving');
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal mereset password');
      setStatus('done');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300 text-center">
          <Check className="h-10 w-10 text-success mx-auto" />
          <h2 className="text-2xl font-bold text-primary">Password Berhasil Diubah</h2>
          <p className="text-base-content/70">Silakan masuk dengan password baru kamu.</p>
          <Link href="/login" className="btn btn-primary">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  if (router.isReady && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300 text-center">
          <X className="h-10 w-10 text-error mx-auto" />
          <h2 className="text-2xl font-bold text-primary">Link Tidak Valid</h2>
          <p className="text-base-content/70">Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.</p>
          <Link href="/forgot-password" className="link link-primary font-medium">
            Minta link reset baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">Buat Password Baru</h2>
          <p className="text-base-content/70">Masukkan password baru untuk akun kamu</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password Baru</span>
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
              <ul className="mt-2 space-y-1">
                <CheckItem ok={passwordChecks.length}>Minimal {PASSWORD_MIN_LENGTH} karakter</CheckItem>
                <CheckItem ok={passwordChecks.letter}>Mengandung huruf</CheckItem>
                <CheckItem ok={passwordChecks.number}>Mengandung angka</CheckItem>
              </ul>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Konfirmasi Password</span>
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-error mt-1">Password tidak cocok</p>
              )}
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

          <div>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="btn btn-primary w-full"
            >
              {status === 'saving' ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Simpan Password Baru'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
