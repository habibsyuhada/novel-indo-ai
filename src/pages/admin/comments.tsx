'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import SEO from '@/components/SEO';

type AdminCommentItem = {
  id: number;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author_name: string;
  novel_id: number;
  novel_name: string;
  novel_url: string | null;
  chapter: string;
};

const TABS: { value: AdminCommentItem['status']; label: string }[] = [
  { value: 'pending', label: 'Menunggu Review' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

export default function AdminCommentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<AdminCommentItem['status']>('pending');
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/comments?status=${status}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal memuat komentar');
      setComments(data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.isAdmin) {
      router.push('/');
      return;
    }
    fetchComments();
  }, [authLoading, user, router, fetchComments]);

  const handleReview = async (id: number, nextStatus: 'approved' | 'rejected') => {
    setActingId(id);
    try {
      const r = await fetch(`/api/admin/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal memperbarui komentar');
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <>
      <SEO title="Admin - Kelola Komentar" description="Moderasi komentar pembaca" />

      <div className="max-w-4xl mx-auto px-2">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Kelola Komentar</h1>

        <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              className={`tab ${status === tab.value ? 'tab-active' : ''}`}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-base-content/60">Tidak ada komentar di kategori ini.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="card bg-base-100 border border-base-300">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between flex-wrap gap-1 text-sm text-base-content/60">
                    <Link
                      href={`/novel/${c.novel_url || c.novel_id}/chapter/${c.chapter}`}
                      target="_blank"
                      className="link link-primary"
                    >
                      {c.novel_name} - Chapter {c.chapter}
                    </Link>
                    <span>{new Date(c.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <p className="font-medium text-sm">{c.author_name}</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{c.body}</p>

                  {status === 'pending' && (
                    <div className="card-actions justify-end mt-2">
                      <button
                        className="btn btn-sm btn-error btn-outline"
                        disabled={actingId === c.id}
                        onClick={() => handleReview(c.id, 'rejected')}
                      >
                        Tolak
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        disabled={actingId === c.id}
                        onClick={() => handleReview(c.id, 'approved')}
                      >
                        Setujui
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
