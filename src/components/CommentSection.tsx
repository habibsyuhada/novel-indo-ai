'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { COMMENT_MAX_LENGTH } from '@/lib/validation';

type CommentItem = {
  id: number;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author_name: string;
  is_own: boolean;
};

export default function CommentSection({ chapterId }: { chapterId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const r = await fetch(`/api/comments?chapterId=${chapterId}`);
      const data = await r.json();
      setComments(data.data ?? []);
    } catch {
      // biarkan daftar sebelumnya, tidak perlu block UI karena gagal fetch
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = body.trim();
    if (trimmed.length < 2) {
      setError('Komentar minimal 2 karakter');
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, body: trimmed }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Gagal mengirim komentar');

      setBody('');
      setInfo(data.message ?? 'Komentar terkirim, menunggu review admin');
      fetchComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mt-4 md:mt-6">
      <div className="card-body p-3 md:p-6">
        <h2 className="text-lg font-bold mb-2">Komentar</h2>

        <form onSubmit={handleSubmit} className="space-y-2 mb-6">
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder={user ? `Berkomentar sebagai ${user.name}` : 'Berkomentar sebagai Anonim'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-base-content/50">
              {body.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? <span className="loading loading-spinner loading-xs"></span> : 'Kirim'}
            </button>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
        </form>

        {loading ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner"></span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-base-content/60">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-base-300 pb-3 last:border-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{c.author_name}</span>
                  <span className="text-xs text-base-content/50">{new Date(c.created_at).toLocaleString('id-ID')}</span>
                  {c.is_own && c.status === 'pending' && <span className="badge badge-warning badge-sm">Menunggu review</span>}
                  {c.is_own && c.status === 'rejected' && <span className="badge badge-error badge-sm">Ditolak</span>}
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
