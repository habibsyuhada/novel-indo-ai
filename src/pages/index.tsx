import { useEffect, useState, useRef, useCallback } from 'react';
import NovelCard from '../components/NovelCard';
import { Novel } from '../lib/novel';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import { trackSearch } from '../lib/gtm';

type NovelWithChapters = Novel & {
  total_chapters: number;
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'title_asc', label: 'Judul A-Z' },
  { value: 'title_desc', label: 'Judul Z-A' },
  { value: 'views', label: 'Paling Banyak Dibaca' },
  { value: 'trending', label: 'Trending Bulan Ini' },
] as const;

type SortValue = typeof SORT_OPTIONS[number]['value'];

export default function Home() {
  const [novels, setNovels] = useState<NovelWithChapters[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortValue>('newest');
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce search input -> searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      if (searchInput.trim()) {
        trackSearch(searchInput.trim());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  type NovelsApiResponse = {
    limit: number;
    page: number;
    nextPage: number | null;
    data: NovelWithChapters[];
  };

  const fetchNovels = useCallback(async (nextPage: number | null, q: string, sortValue: SortValue) => {
    try {
      if (!nextPage) {
        setLoading(true);
        setHasMore(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      let isHidden: string | null = null;
      if (typeof window !== "undefined") {
        isHidden = window.localStorage.getItem("isHidden");
      }

      const params = new URLSearchParams();
      const p = nextPage ?? 1;
      params.set("page", String(p));
      params.set("sort", sortValue);
      if (q) params.set("q", q);

      if (isHidden === "0" || isHidden === "1") params.set("isHidden", isHidden);

      const url = `/api/novels?${params.toString()}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`API error: ${r.status}`);

      const json = (await r.json()) as NovelsApiResponse;

      setHasMore(Boolean(json.nextPage));
      setPage(json.page);

      if (!nextPage) {
        setNovels(json.data);
      } else {
        setNovels((prev) => [...prev, ...json.data]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreNovels = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNovels(page + 1, searchTerm, sort);
    }
  }, [loadingMore, hasMore, page, searchTerm, sort, fetchNovels]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastNovelElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreNovels();
      }
    }, { threshold: 0.5 });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreNovels]);

  useEffect(() => {
    fetchNovels(null, searchTerm, sort);
  }, [fetchNovels, searchTerm, sort]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  return (
    <>
      <SEO
        title="Baca Novel Indo - Baca Novel Indonesia Online"
        description="Baca novel Indonesia dan terjemahan secara online. Temukan novel favorit Anda dengan berbagai genre seperti romance, fantasy, action, dan lainnya."
        keywords="novel indonesia, baca novel online, novel terjemahan, novel romance, novel fantasy, novel action, novel terbaru"
      />

      <JsonLd
        type="website"
        data={{
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bacanovelindo.click',
          name: 'Baca Novel Indo',
          description: 'Baca novel Indonesia dan terjemahan secara online. Temukan novel favorit Anda dengan berbagai genre.'
        }}
        id="json-ld-home-website"
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Baca Novel Indo
          </h1>
          <p className="text-lg md:text-xl text-base-content/70">
            Discover and read your favorite novels online
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="form-control flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isMobile ? "Search novels..." : "Search novels by title, tag, genre..."}
                  className="input input-bordered w-full pl-11"
                  value={searchInput}
                  onChange={handleSearch}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <select
              className="select select-bordered"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              aria-label="Urutkan novel"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              {searchTerm ? 'Search Results' : 'Latest Novels'}
            </h2>
          </div>

          {loading ? (
            <div className="min-h-[400px] flex justify-center items-center">
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="text-base-content/70">Loading novels...</p>
              </div>
            </div>
          ) : (
            <>
              {novels.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {novels.map((novel, index) => {
                    if (novels.length === index + 1) {
                      return (
                        <div ref={lastNovelElementRef} key={novel.id}>
                          <NovelCard
                            novel={novel}
                            totalChapters={novel.total_chapters}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <NovelCard
                          key={novel.id}
                          novel={novel}
                          totalChapters={novel.total_chapters}
                        />
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="min-h-[400px] flex justify-center items-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-base-content/30 mb-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <p className="text-xl font-medium mb-2">No novels found</p>
                    <p className="text-base-content/70">
                      {searchTerm ? 'Try different keywords or check your spelling.' : 'Check back later for new novels.'}
                    </p>
                  </div>
                </div>
              )}

              {loadingMore && (
                <div className="flex justify-center my-8">
                  <div className="flex flex-col items-center gap-2">
                    <span className="loading loading-spinner loading-md"></span>
                    <p className="text-base-content/70">Loading more novels...</p>
                  </div>
                </div>
              )}

              {!hasMore && novels.length > ITEMS_PER_PAGE && (
                <div className="text-center mt-8 text-base-content/70">
                  <p>Semua novel sudah ditampilkan</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
