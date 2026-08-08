'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { getCoverUrl } from '@/lib/novel';
import SEO from '@/components/SEO';

type HistoryItem = {
  novelId: number;
  name: string;
  cover: string | null;
  url: string | null;
  chapter: number;
  totalChapters: number;
  updatedAt: string;
};

export default function RiwayatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetch('/api/reading-progress/list')
      .then((r) => r.json())
      .then((data: { data: HistoryItem[] }) => setItems(data.data ?? []))
      .catch((e) => console.error('Gagal memuat riwayat baca:', e))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <SEO title="Riwayat Baca - Baca Novel Indo" description="Novel yang pernah kamu baca" />

      <div className="max-w-4xl mx-auto px-2">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Riwayat Baca</h1>

        {items.length === 0 ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center gap-2">
            <p className="text-xl font-medium">Belum ada riwayat baca</p>
            <p className="text-base-content/70">Mulai baca novel dan checkpoint-nya akan muncul di sini.</p>
            <Link href="/" className="btn btn-primary mt-4">Cari Novel</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.novelId}
                href={`/novel/${item.url || item.novelId}/chapter/${item.chapter}`}
                className="card card-side bg-base-100 hover:shadow-lg transition-shadow duration-200 border border-base-300"
              >
                <div className="w-20 sm:w-24 flex-none relative aspect-[3/4]">
                  {item.cover ? (
                    <Image
                      src={getCoverUrl(item.cover)}
                      alt={`Cover of ${item.name}`}
                      fill
                      className="object-cover rounded-l-lg"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-base-300 flex items-center justify-center rounded-l-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-base-content/30">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="card-body p-3 sm:p-4 justify-center">
                  <h2 className="card-title text-base sm:text-lg line-clamp-2">{item.name}</h2>
                  <p className="text-sm text-primary">
                    Chapter {item.chapter}{item.totalChapters ? ` dari ${item.totalChapters}` : ''}
                  </p>
                  <p className="text-xs text-base-content/60">
                    Terakhir dibaca {formatDistanceToNow(parseISO(item.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
