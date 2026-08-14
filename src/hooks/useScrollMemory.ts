import { useEffect, useRef } from 'react';
import { getSavedScrollPosition, saveScrollPosition } from '@/lib/scrollMemory';

interface UseScrollMemoryProps {
  novelId: string | number | undefined | null;
  chapter: string | number | undefined | null;
  ready: boolean; // true kalau chapter sudah selesai loading & konten sudah dirender
}

const SAVE_DEBOUNCE_MS = 400;

// Menyimpan & memulihkan posisi scroll terakhir per chapter di localStorage,
// supaya kalau halaman ke-refresh di tengah chapter panjang, user tidak kehilangan jejak bacanya.
export default function useScrollMemory({ novelId, chapter, ready }: UseScrollMemoryProps): void {
  const restoredKeyRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || novelId == null || chapter == null) return;

    const key = `${novelId}:${chapter}`;

    if (restoredKeyRef.current !== key) {
      restoredKeyRef.current = key;
      const savedY = getSavedScrollPosition(novelId, chapter);
      if (savedY != null) {
        // Tunggu satu frame supaya layout (gambar, font) sempat settle dulu sebelum restore scroll
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'auto' });
        });
      }
    }

    const handleScroll = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveScrollPosition(novelId, chapter, window.scrollY);
      }, SAVE_DEBOUNCE_MS);
    };

    const handlePageHide = () => {
      saveScrollPosition(novelId, chapter, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [novelId, chapter, ready]);
}
