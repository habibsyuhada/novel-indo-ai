import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import { supabase, Novel, NovelChapter } from '../../../../lib/supabase';
import styles from '../../../../styles/chapter.module.css';
import SEO from '../../../../components/SEO';
import JsonLd, { generateArticleData, generateBreadcrumbData } from '../../../../components/JsonLd';

export default function ChapterPage() {
  const router = useRouter();
  const { id, chapter } = router.query;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapterData, setChapterData] = useState<NovelChapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<number | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(18);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [chapterList, setChapterList] = useState<{chapter: number, title: string}[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 100;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load font size
      const savedFontSize = localStorage.getItem('fontSize');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize));
      }
    }
  }, []);

  // Fetch a specific page of chapters
  const fetchChapterPage = useCallback(async (page: number) => {
    if (!novel?.id) return;
    
    try {
      const from = (page - 1) * chaptersPerPage;
      const to = from + chaptersPerPage - 1;
      
      const { data } = await supabase
        .from('novel_chapter')
        .select('chapter, title') // Only select needed columns, not the text content
        .eq('novel', novel.id)
        .order('chapter', { ascending: true })
        .range(from, to);
      
      if (data) {
        setChapterList(data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching chapter page:', error);
    }
  }, [novel?.id, chaptersPerPage]);

  // Fetch chapter data
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!id || !chapter) return;
      
      try {
        setLoading(true);
        
        // Fetch novel details - check if id is numeric (old ID) or string (new URL)
        let query = supabase.from('novel').select('*');
        
        // Check if id is numeric (old ID) or string (new URL)
        if (!isNaN(Number(id))) {
          query = query.eq('id', id);
        } else {
          query = query.eq('url', id);
        }
        
        const { data: novelData, error: novelError } = await query.single();

        if (novelError) throw novelError;
        
        if (novelData) {
          setNovel(novelData);
          
          // Fetch current chapter
          const { data: currentChapter, error: chapterError } = await supabase
            .from('novel_chapter')
            .select('*')
            .eq('novel', novelData.id)  // Always use the numeric ID for chapter queries
            .eq('chapter', chapter)
            .single();

          if (chapterError) throw chapterError;
          
          if (currentChapter) {
            setChapterData(currentChapter);
            
            // Check for previous chapter
            const { data: prevChapterData } = await supabase
              .from('novel_chapter')
              .select('chapter')
              .eq('novel', novelData.id)
              .lt('chapter', chapter)
              .order('chapter', { ascending: false })
              .limit(1)
              .single();
            
            if (prevChapterData) {
              setPrevChapter(prevChapterData.chapter);
            }
            
            // Check for next chapter
            const { data: nextChapterData } = await supabase
              .from('novel_chapter')
              .select('chapter')
              .eq('novel', novelData.id)
              .gt('chapter', chapter)
              .order('chapter', { ascending: true })
              .limit(1)
              .single();
            
            if (nextChapterData) {
              setNextChapter(nextChapterData.chapter);
            }

            // Get total chapter count
            const { count } = await supabase
              .from('novel_chapter')
              .select('id', { count: 'exact', head: true })
              .eq('novel', novelData.id);
            
            if (count !== null) {
              setTotalChapters(count);
            }

            // Calculate which page the current chapter is on
            const chapterNum = parseInt(chapter as string);
            const calculatedPage = Math.ceil(chapterNum / chaptersPerPage);
            setCurrentPage(calculatedPage);

            // Fetch chapters for the current page
            await fetchChapterPage(calculatedPage);
          }
        }
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [id, chapter, fetchChapterPage]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const windowScrollTop = window.scrollY - element.offsetTop;
      
      if (windowScrollTop >= 0) {
        const scrolled = Math.min(100, Math.max(0, (windowScrollTop / totalHeight) * 100));
        setReadingProgress(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Render chapter content with proper paragraph formatting
  const renderChapterContent = () => {
    if (!chapterData || !novel) return null;
    
    // Split text into paragraphs
    const paragraphs = chapterData.text.split('\n').filter(p => p.trim() !== '');
    
    return (
      <article 
        id="chapter-content" 
        ref={contentRef}
        itemScope 
        itemType="https://schema.org/Article"
        className={`flex-1 ${isMobile ? "pb-16" : "pr-4"} ${styles.chapterContent}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <meta itemProp="headline" content={`${novel.name} - Chapter ${chapterData.chapter}: ${chapterData.title}`} />
        <meta itemProp="author" content={novel.author || 'Novel Indo'} />
        <meta itemProp="inLanguage" content="id" />

        <h1 className="text-xl md:text-2xl mb-4 font-bold">
          Chapter {chapterData.chapter}: {chapterData.title}
        </h1>
        
        <section 
          itemProp="articleBody"
          lang="id"
          className="mt-6"
        >
          {paragraphs.map((paragraph: string, index: number) => (
            <p 
              key={index}
              className="mb-4"
              tabIndex={0}
            >
              {paragraph}
            </p>
          ))}
        </section>
      </article>
    );
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalChapters / chaptersPerPage);

  // Generate pagination buttons
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
      pages.push(
        <button 
          key="first" 
          className="btn btn-sm" 
          onClick={() => fetchChapterPage(1)}
          aria-label="First page"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button 
          key={i} 
          className={`btn btn-sm ${currentPage === i ? 'btn-primary' : ''}`} 
          onClick={() => fetchChapterPage(i)}
          aria-label={`Page ${i}`}
          aria-current={currentPage === i ? "page" : undefined}
        >
          {i}
        </button>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      
      pages.push(
        <button 
          key="last" 
          className="btn btn-sm" 
          onClick={() => fetchChapterPage(totalPages)}
          aria-label="Last page"
        >
          {totalPages}
        </button>
      );
    }
    
    return (
      <div className="flex flex-wrap justify-center gap-1 my-4">
        <button 
          className="btn btn-sm" 
          onClick={() => fetchChapterPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          «
        </button>
        {pages}
        <button 
          className="btn btn-sm" 
          onClick={() => fetchChapterPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          »
        </button>
      </div>
    );
  };

  // Chapter list drawer
  const renderChapterListModal = () => {
    if (!showChapterList) return null;

    return (
      <div className="drawer drawer-end fixed inset-0 z-50">
        <input id="chapter-drawer" type="checkbox" className="drawer-toggle" checked={showChapterList} readOnly />
        <div className="drawer-side">
          <label htmlFor="chapter-drawer" className="drawer-overlay" onClick={() => setShowChapterList(false)}></label>
          <div className={`bg-base-100 h-full flex flex-col ${isMobile ? 'w-full' : 'w-[480px] shadow-xl'}`}>
            <div className="p-4 border-b border-base-300">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Chapters</h2>
                <button 
                  onClick={() => setShowChapterList(false)} 
                  className="btn btn-sm btn-circle btn-ghost"
                  aria-label="Close chapter list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              <ul className="menu menu-compact w-full">
                {chapterList.map((item) => (
                  <li key={item.chapter}>
                    <Link 
                      href={`/novel/${novel?.url || id}/chapter/${item.chapter}`}
                      className={parseInt(chapter as string) === item.chapter ? "active" : ""}
                      onClick={() => setShowChapterList(false)}
                    >
                      <span className="font-medium">Chapter {item.chapter}</span>
                      <span className="text-sm truncate">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-2 border-t border-base-300">
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  if (!novel || !chapterData) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEO 
        title={`${novel.name} - Chapter ${chapterData.chapter}: ${chapterData.title} - Novel Indo`}
        description={`Baca ${novel.name} Chapter ${chapterData.chapter}: ${chapterData.title} karya ${novel.author} secara online di Novel Indo.`}
        image={novel.cover ?? '/images/default-cover.jpg'}
        keywords={`${novel.name}, Chapter ${chapterData.chapter}, ${chapterData.title}, ${novel.author}, ${novel.genre || 'Novel'}, baca novel online`}
        author={novel.author}
        article={true}
      />
      
      <JsonLd 
        type="article" 
        data={generateArticleData(
          novel,
          chapterData.title,
          chapterData.chapter,
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}/novel/${novel.url || novel.id}/chapter/${chapterData.chapter}`,
          novel.created_at,
          novel.updated_at
        )}
        id={`json-ld-article-${novel.id}-${chapterData.chapter}`}
      />
      
      <JsonLd 
        type="breadcrumb" 
        data={generateBreadcrumbData([
          { name: 'Home', url: '/' },
          { name: novel.name, url: `/novel/${novel.url || novel.id}` },
          { name: `Chapter ${chapterData.chapter}: ${chapterData.title}`, url: `/novel/${novel.url || novel.id}/chapter/${chapterData.chapter}` }
        ])}
        id={`json-ld-breadcrumb-${novel.id}-${chapterData.chapter}`}
      />
      
      <Layout
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      >
        <div className="fixed top-0 left-0 w-full h-1 bg-base-300 z-50">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${readingProgress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(readingProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
          ></div>
        </div>

        {/* Desktop navigation */}
        <div className="mb-4 flex justify-between items-center md:block hidden">
          <Link href={`/novel/${novel.url || novel.id}`} className="btn btn-ghost btn-md">
            ← Back to Novel
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl mb-4 md:mb-6">
          <div className="card-body p-3 md:p-6">
            
            <div className="flex">
              {renderChapterContent()}

              {/* Desktop sidebar */}
              {!isMobile && (
                <div className="w-12 flex-none">
                  <div className="fixed flex flex-col gap-2 p-2 bg-base-200 rounded-l-xl shadow-lg right-0">
                    <div className="space-y-2">
                      {prevChapter ? (
                        <Link 
                          href={`/novel/${novel.url || novel.id}/chapter/${prevChapter}`}
                          className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                          aria-label="Previous chapter"
                          title="Previous Chapter"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </Link>
                      ) : (
                        <button className="btn btn-circle btn-sm btn-ghost opacity-50" disabled title="No Previous Chapter">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="divider my-0"></div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                      <Link 
                        href={`/novel/${novel.url || novel.id}`}
                        className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                        aria-label="Back to novel"
                        title="Back to Novel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      </Link>
                      </div>

                      <div className="flex justify-between items-center">
                      <button 
                        onClick={() => setShowChapterList(true)}
                        className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                        aria-label="Show chapter list"
                        title="Chapter List"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>
                      </div>

                      <div className="flex justify-between items-center">
                      <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                        aria-label="Open settings"
                        title="Settings"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      </div>
                    </div>

                    <div className="divider my-0"></div>

                    <div className="space-y-2">
                      {nextChapter ? (
                        <Link 
                          href={`/novel/${novel.url || novel.id}/chapter/${nextChapter}`}
                          className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                          aria-label="Next chapter"
                          title="Next Chapter"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      ) : (
                        <button className="btn btn-circle btn-sm btn-ghost opacity-50" disabled title="No Next Chapter">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation bar */}
        {isMobile && (
          <div className="btm-nav btm-nav-sm fixed bottom-0 z-50 bg-base-100 border-t border-base-300 shadow-lg">
            {prevChapter ? (
              <Link 
                href={`/novel/${novel.url || novel.id}/chapter/${prevChapter}`}
                className="text-base-content"
                aria-label="Previous chapter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span className="btm-nav-label text-xs">Prev</span>
              </Link>
            ) : (
              <button className="text-base-content opacity-50" disabled aria-label="No previous chapter">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span className="btm-nav-label text-xs">Prev</span>
              </button>
            )}
            
            <Link 
              href={`/novel/${novel.url || novel.id}`}
              className="text-base-content"
              aria-label="Back to novel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              <span className="btm-nav-label text-xs">Novel</span>
            </Link>
            
            <button 
              onClick={() => setShowChapterList(true)}
              className="text-base-content"
              aria-label="Show chapter list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="btm-nav-label text-xs">Chapters</span>
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-base-content"
              aria-label="Open settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="btm-nav-label text-xs">Settings</span>
            </button>
            
            {nextChapter ? (
              <Link 
                href={`/novel/${novel.url || novel.id}/chapter/${nextChapter}`}
                className="text-base-content"
                aria-label="Next chapter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="btm-nav-label text-xs">Next</span>
              </Link>
            ) : (
              <button className="text-base-content opacity-50" disabled aria-label="No next chapter">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="btm-nav-label text-xs">Next</span>
              </button>
            )}
          </div>
        )}

        {/* Chapter list drawer */}
        {renderChapterListModal()}
      </Layout>
    </>
  );
}