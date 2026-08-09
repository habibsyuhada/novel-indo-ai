'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Mail, Lock, User, Check, X } from 'lucide-react';
import { USERNAME_RE, USERNAME_HINT, PASSWORD_MIN_LENGTH } from '@/lib/validation';
import { Turnstile } from '@/components/Turnstile';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [registered, setRegistered] = useState(false);
  const { signUp, loading, error } = useAuth();

  const passwordChecks = {
    length: password.length >= PASSWORD_MIN_LENGTH,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number;
  const isUsernameValid = USERNAME_RE.test(username);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isUsernameValid) {
      setFormError(`Username tidak valid. ${USERNAME_HINT}`);
      return;
    }
    if (!isPasswordValid) {
      setFormError('Password belum memenuhi semua syarat di bawah.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok.');
      return;
    }
    if (!turnstileToken) {
      setFormError('Selesaikan verifikasi captcha terlebih dahulu.');
      return;
    }

    const result = await signUp(email, password, username, turnstileToken);

    if (result.success) {
      setRegistered(true);
    }
  };

  const CheckItem = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? 'text-success' : 'text-base-content/50'}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {children}
    </li>
  );

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 p-8 rounded-xl shadow-xl bg-base-200 border border-base-300 text-center">
          <Mail className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-primary">Cek Email Kamu</h2>
          <p className="text-base-content/70">
            Kami sudah mengirim link verifikasi ke <span className="font-medium">{email}</span>. Klik link di email
            itu untuk mengaktifkan akun kamu sebelum bisa masuk.
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
          <h2 className="text-3xl font-bold text-primary mb-2">Buat Akun Baru</h2>
          <p className="text-base-content/70">Daftar untuk mulai membaca novel favoritmu</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-base-content/50" />
                </div>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full pl-10 bg-base-100"
                  placeholder="username_kamu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {username.length > 0 && !isUsernameValid && (
                <p className="text-xs text-error mt-1">{USERNAME_HINT}</p>
              )}
            </div>

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

          <div className="flex justify-center">
            <Turnstile onToken={setTurnstileToken} />
          </div>

          {(formError || error) && (
            <div className="alert alert-error shadow-lg">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError || error}</span>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Daftar'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-base-content/70">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="link link-primary font-medium"
              >
                Masuk sekarang
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
