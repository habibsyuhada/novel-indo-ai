import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { supabase, Novel, getStorageUrl } from '../../lib/supabase';

// Buat tipe baru untuk daftar chapter yang tidak memerlukan semua properti NovelChapter
type ChapterListItem = {
  id: number;
  chapter: number;
  title: string;
};

export default function NovelDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);
  const chaptersPerPage = 50;

  // Format genre and tags
  const formatList = (text: string) => {
    if (!text) return [];
    return text.split(';').filter(item => item.trim() !== '');
  };

  // Fetch chapters for current page
  const fetchChapterPage = useCallback(async (page: number) => {
    if (!id) return;
    
    try {
      const from = (page - 1) * chaptersPerPage;
      const to = from + chaptersPerPage - 1;
      
      const { data } = await supabase
        .from('novel_chapter')
        .select('id, chapter, title')
        .eq('novel', id)
        .order('chapter', { ascending: true })
        .range(from, to);
      
      if (data) {
        setChapters(data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching chapter page:', error);
    }
  }, [id]);

  useEffect(() => {
    const fetchNovelAndChapters = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch novel details
        const { data: novelData, error: novelError } = await supabase
          .from('novel')
          .select('*')
          .eq('id', id)
          .single();

        if (novelError) throw novelError;
        
        if (novelData) {
          setNovel(novelData);
          
          // Get total chapter count
          const { count } = await supabase
            .from('novel_chapter')
            .select('id', { count: 'exact', head: true })
            .eq('novel', id);
          
          if (count !== null) {
            setTotalChapters(count);
          }

          // Fetch first page of chapters
          await fetchChapterPage(1);
        }
      } catch (error) {
        console.error('Error fetching novel details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovelAndChapters();
  }, [id, fetchChapterPage]);

  // Calculate total pages
  const totalPages = Math.ceil(totalChapters / chaptersPerPage);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  if (!novel) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Novel not found</h1>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const genres = formatList(novel.genre);
  const tags = formatList(novel.tag);

  return (
    <Layout>
      <Head>
        <title>{novel.name} - Novel Indo</title>
        <meta name="description" content={novel.description} />
      </Head>

      <div className="mb-8">
        <Link href="/" className="btn btn-ghost mb-4">
          ← Back to Home
        </Link>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              <div className="flex-none w-full md:w-64">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                  {novel.cover ? (
                    <Image
                      src={getStorageUrl(novel.cover)}
                      alt={`Cover of ${novel.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 256px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-base-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-base-content/30">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Novel Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">{novel.name}</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-2">
                    <p><span className="font-semibold">Author:</span> {novel.author || 'Unknown'}</p>
                    <p><span className="font-semibold">Status:</span> <span className={`badge ${novel.status === 1 ? 'badge-warning' : 'badge-success'}`}>{novel.status === 1 ? 'Ongoing' : 'Completed'}</span></p>
                    <p><span className="font-semibold">Publisher:</span> {novel.publishers || 'Unknown'}</p>
                    <p><span className="font-semibold">Year:</span> {novel.year || 'Unknown'}</p>
                    <div>
                      <p className="font-semibold mb-1">Genres:</p>
                      <div className="flex flex-wrap gap-1">
                        {genres.map((genre) => (
                          <span key={genre} className="badge badge-primary">{genre}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span key={tag} className="badge badge-outline">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-2">Description</h3>
                  <p className="whitespace-pre-line">{novel.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Chapters</h2>
          <span className="text-sm text-base-content/70">Total: {totalChapters} chapters</span>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4">
            {chapters.length > 0 ? (
              <>
                {/* Chapter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {chapters.map((chapter) => (
                    <Link 
                      key={chapter.id} 
                      href={`/novel/${novel.id}/chapter/${chapter.chapter}`}
                      className="card bg-base-200 hover:bg-base-300 transition-colors duration-200"
                    >
                      <div className="card-body p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-none w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-primary">{chapter.chapter}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium leading-tight mb-1">Chapter {chapter.chapter}</h3>
                            <p className="text-sm text-base-content/70 truncate">{chapter.title}</p>
                          </div>
                          <div className="flex-none text-base-content/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-4 border-t border-base-300">
                    <div className="flex flex-col items-center gap-4">
                      <div className="join">
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => fetchChapterPage(1)}
                          disabled={currentPage === 1}
                          aria-label="First page"
                        >
                          «
                        </button>
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => fetchChapterPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          aria-label="Previous page"
                        >
                          ‹
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="join-item btn btn-sm btn-disabled no-animation">
                          Page {currentPage} of {totalPages}
                        </div>
                        
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => fetchChapterPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          aria-label="Next page"
                        >
                          ›
                        </button>
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => fetchChapterPage(totalPages)}
                          disabled={currentPage === totalPages}
                          aria-label="Last page"
                        >
                          »
                        </button>
                      </div>

                      {/* Quick Jump */}
                      <div className="flex items-center gap-2 text-sm">
                        <span>Jump to chapter:</span>
                        <select 
                          className="select select-sm select-bordered w-24"
                          value={currentPage}
                          onChange={(e) => fetchChapterPage(Number(e.target.value))}
                        >
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <option key={page} value={page}>
                              {((page - 1) * chaptersPerPage) + 1}-{Math.min(page * chaptersPerPage, totalChapters)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-base-content/30 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <p className="text-base-content/70">No chapters available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 