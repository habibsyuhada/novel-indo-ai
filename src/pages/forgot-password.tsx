'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal mengirim link reset password');
      setStatus('sent');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300 text-center">
          <Mail className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-primary">Cek Email Kamu</h2>
          <p className="text-base-content/70">
            Kalau email <span className="font-medium">{email}</span> terdaftar, link reset password sudah dikirim. Link berlaku selama 1 jam.
          </p>
          <Link href="/login" className="link link-primary font-medium">
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-2">Lupa Password</h2>
          <p className="text-base-content/70">Masukkan email kamu, kami akan kirim link untuk reset password</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              disabled={status === 'sending'}
              className="btn btn-primary w-full"
            >
              {status === 'sending' ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Kirim Link Reset'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-base-content/70">
              Sudah ingat password?{' '}
              <Link href="/login" className="link link-primary font-medium">
                Masuk sekarang
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
