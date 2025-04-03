import { useEffect, useState, useRef, useCallback } from 'react';
import NovelCard from '../components/NovelCard';
import { supabase, Novel } from '../lib/supabase';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import { trackSearch } from '../lib/gtm';

type NovelWithChapters = Novel & {
  total_chapters: number;
};

export default function Home() {
  const [novels, setNovels] = useState<NovelWithChapters[]>([]);
  const [filteredNovels, setFilteredNovels] = useState<NovelWithChapters[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 12;
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastNovelElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchTerm) {
        loadMoreNovels();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, searchTerm]);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchNovels = async (currentPage: number) => {
    try {
      const offset = currentPage * ITEMS_PER_PAGE;
      
      if (currentPage === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Fetch novels with total chapters count
      const { data: novelsData, error: novelsError } = await supabase
        .from('novel')
        .select('*')
        .order('updated_date', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (novelsError) throw novelsError;

      if (novelsData) {
        // Fetch total chapters count for each novel
        const novelsWithChapters = await Promise.all(
          novelsData.map(async (novel) => {
            const { count, error: countError } = await supabase
              .from('novel_chapter')
              .select('id', { count: 'exact', head: true })
              .eq('novel', novel.id);

            if (countError) throw countError;

            return {
              ...novel,
              total_chapters: count || 0
            };
          })
        );

        if (novelsWithChapters.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }

        if (currentPage === 0) {
          setNovels(novelsWithChapters);
          setFilteredNovels(novelsWithChapters);
        } else {
          setNovels(prev => [...prev, ...novelsWithChapters]);
          setFilteredNovels(prev => [...prev, ...novelsWithChapters]);
        }
      }
    } catch (error) {
      console.error('Error fetching novels:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNovels = () => {
    if (!loadingMore && hasMore && !searchTerm) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNovels(nextPage);
    }
  };

  useEffect(() => {
    // Mulai dengan halaman pertama
    fetchNovels(0);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNovels(novels);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = novels.filter(
        novel => 
          novel.name.toLowerCase().includes(term) || 
          novel.tag?.toLowerCase().includes(term) || 
          novel.genre.toLowerCase().includes(term) ||
          (novel.tag && novel.tag.toLowerCase().includes(term))
      );
      setFilteredNovels(filtered);
    }
  }, [searchTerm, novels]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Track search if there's a search term
    if (value.trim()) {
      trackSearch(value.trim());
    }
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
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click',
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
          <div className="form-control max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input 
                type="text" 
                placeholder={isMobile ? "Search novels..." : "Search novels by title, tag, genre..."} 
                className="input input-bordered w-full pl-11" 
                value={searchTerm}
                onChange={handleSearch}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              {searchTerm ? 'Search Results' : 'Latest Novels'}
            </h2>
            {searchTerm && filteredNovels.length > 0 && (
              <p className="text-base-content/70">
                Found {filteredNovels.length} {filteredNovels.length === 1 ? 'novel' : 'novels'}
              </p>
            )}
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
              {filteredNovels.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredNovels.map((novel, index) => {
                    if (filteredNovels.length === index + 1 && !searchTerm) {
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
              
              {!hasMore && novels.length > ITEMS_PER_PAGE && !searchTerm && (
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
