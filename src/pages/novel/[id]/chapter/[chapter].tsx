import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { toggleSettings } from '../../../../store/settingsSlice';

// Hooks
import useChapterData from '../../../../hooks/useChapterData';
import useTts from '../../../../hooks/useTts';
import useReadingProgress from '../../../../hooks/useReadingProgress';

// Components
import SEO from '../../../../components/SEO';
import JsonLd, { generateArticleData, generateBreadcrumbData } from '../../../../components/JsonLd';
import ChapterContent from '../../../../components/chapter/ChapterContent';
import ChapterList from '../../../../components/chapter/ChapterList';
import Navigation from '../../../../components/chapter/Navigation';
import TtsControls from '../../../../components/chapter/TtsControls';

export default function ChapterPage() {
  const router = useRouter();
  const { id, chapter } = router.query;
  const chaptersPerPage = 100;
  
  // UI state
  const [isMobile, setIsMobile] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  
  // Redux
  const dispatch = useDispatch();
  const { fontSize, ttsEnabled } = useSelector((state: RootState) => state.settings);
  
  // Fetch chapter data
  const { 
    novel, 
    chapterData, 
    prevChapter, 
    nextChapter, 
    loading, 
    chapterList, 
    totalChapters,
    currentPage,
    fetchChapterPage
  } = useChapterData({ id, chapter, chaptersPerPage });
  
  // Reading progress
  const readingProgress = useReadingProgress({ contentElement });
  
  // TTS functionality
  const paragraphs = chapterData?.text.split('\n').filter(p => p.trim() !== '') || [];
  
  // handleParagraphChange is now a simple pass-through function
  // Auto-scroll is now handled in the ChapterContent component
  const handleParagraphChange = useCallback(() => {
    // No-op - scrolling is handled in ChapterContent
  }, []);
  
  const {
    isPlaying,
    isPaused,
    currentParagraphIndex,
    currentText,
    startSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking
  } = useTts({ 
    enabled: ttsEnabled, 
    paragraphs,
    onParagraphChange: handleParagraphChange
  });
  
  // Handle play/pause button
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseSpeaking();
    } else if (isPaused && currentText) {
      resumeSpeaking();
    } else if (paragraphs.length > 0) {
      startSpeaking(paragraphs[currentParagraphIndex], currentParagraphIndex);
    }
  }, [isPlaying, isPaused, currentText, paragraphs, currentParagraphIndex, startSpeaking, pauseSpeaking, resumeSpeaking]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if we have novel data and chapter data
      if (!novel || !chapterData) return;

      // Don't handle if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
          if (nextChapter) {
            router.push(`/novel/${novel.url || novel.id}/chapter/${nextChapter}`);
          }
          break;
        case 'ArrowLeft':
          if (prevChapter) {
            router.push(`/novel/${novel.url || novel.id}/chapter/${prevChapter}`);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [novel, chapterData, nextChapter, prevChapter, router]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalChapters / chaptersPerPage);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!novel || !chapterData) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Chapter tidak ditemukan</h1>
        <Link href="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${novel.name} - Chapter ${chapterData.chapter}: ${chapterData.title} - Baca Novel Indo`}
        description={`Baca ${novel.name} Chapter ${chapterData.chapter}: ${chapterData.title} karya ${novel.author} secara online di Baca Novel Indo.`}
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
      
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-base-300 z-50">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(readingProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>

      {/* Desktop navigation back to novel */}
      <div className="mb-4 flex justify-between items-center md:block hidden">
        <Link href={`/novel/${novel.url || novel.id}`} className="btn btn-ghost btn-md">
          ← Kembali ke Novel
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl mb-4 md:mb-6">
        <div className="card-body p-3 md:p-6">
          <div className="flex">
            <ChapterContent
              novel={novel}
              chapterData={chapterData}
              fontSize={fontSize}
              ttsEnabled={ttsEnabled}
              currentParagraphIndex={currentParagraphIndex}
              isPlaying={isPlaying}
              onParagraphClick={startSpeaking}
              onContentRef={setContentElement}
            />
            
            {/* Desktop navigation */}
            {!isMobile && (
              <Navigation
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                novel={novel}
                isMobile={false}
                onListClick={() => setShowChapterList(true)}
                onSettingsClick={() => dispatch(toggleSettings())}
              />
            )}
          </div>
        </div>
      </div>

      {/* TTS Controls */}
      <TtsControls 
        ttsEnabled={ttsEnabled}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStop={stopSpeaking}
      />

      {/* Mobile navigation */}
      {isMobile && (
        <Navigation
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          novel={novel}
          isMobile={true}
          onListClick={() => setShowChapterList(true)}
          onSettingsClick={() => dispatch(toggleSettings())}
        />
      )}

      {/* Chapter list */}
      <ChapterList
        showChapterList={showChapterList}
        onClose={() => setShowChapterList(false)}
        chapterList={chapterList}
        currentChapter={chapter}
        novelId={novel.id}
        novelUrl={novel.url || undefined}
        isMobile={isMobile}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={fetchChapterPage}
      />
    </>
  );
}