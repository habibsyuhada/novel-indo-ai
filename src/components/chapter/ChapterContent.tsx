import { useRef, useEffect } from 'react';
import { Novel, NovelChapter } from '../../lib/supabase';
import styles from '../../styles/chapter.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface ChapterContentProps {
  novel: Novel;
  chapterData: NovelChapter;
  fontSize: number;
  ttsEnabled: boolean;
  currentParagraphIndex: number;
  isPlaying: boolean;
  onParagraphClick: (paragraph: string, index: number) => void;
  onContentRef: (ref: HTMLDivElement | null) => void;
}

const ChapterContent = ({
  novel,
  chapterData,
  fontSize,
  ttsEnabled,
  currentParagraphIndex,
  isPlaying,
  onParagraphClick,
  onContentRef
}: ChapterContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  
  // Get TTS auto-scroll settings from Redux
  const { ttsAutoScroll, ttsScrollPosition, ttsScrollBehavior } = useSelector(
    (state: RootState) => state.settings
  );
  
  // Split text into paragraphs
  const paragraphs = chapterData.text.split('\n').filter(p => p.trim() !== '');
	localStorage.setItem('curchapter', chapterData.chapter.toString());
  
  // Pass content ref to parent
  useEffect(() => {
    if (contentRef.current) {
      onContentRef(contentRef.current);
    }
  }, [onContentRef]);
  
  // Reset paragraph refs array
  useEffect(() => {
    paragraphRefs.current = new Array(paragraphs.length).fill(null);
  }, [paragraphs.length]);
  
  // Auto-scroll to current paragraph when TTS is playing
  useEffect(() => {
    if (ttsEnabled && isPlaying && ttsAutoScroll && paragraphRefs.current[currentParagraphIndex]) {
      paragraphRefs.current[currentParagraphIndex]?.scrollIntoView({
        behavior: ttsScrollBehavior,
        block: ttsScrollPosition
      });
    }
  }, [currentParagraphIndex, isPlaying, ttsEnabled, ttsAutoScroll, ttsScrollPosition, ttsScrollBehavior]);
  
  return (
    <article 
      id="chapter-content" 
      ref={contentRef}
      itemScope 
      itemType="https://schema.org/Article"
      className={`flex-1 ${styles.chapterContent}`}
      style={{ fontSize: `${fontSize}px`, overflowX: 'auto' }}
    >
      <meta itemProp="headline" content={`${novel.name} - Chapter ${chapterData.chapter}: ${chapterData.title}`} />
      <meta itemProp="author" content={novel.author || 'Baca Novel Indo'} />
      <meta itemProp="inLanguage" content="id" />

      <h1 className="text-xl md:text-2xl mb-4 font-bold">
        Chapter {chapterData.chapter}: {chapterData.title}
      </h1>
      
      <section 
        itemProp="articleBody"
        lang="id"
        className="mt-6"
      >
				<p>
					Chapter {chapterData.chapter}
				</p>
        {paragraphs.map((paragraph: string, index: number) => (
          <p 
            key={index}
            ref={(el: HTMLParagraphElement | null) => {
              paragraphRefs.current[index] = el;
            }}
            className={`mb-4 ${ttsEnabled && currentParagraphIndex === index && isPlaying ? 'bg-primary/50 transition-colors duration-200' : ''} ${ttsEnabled && isPlaying ? 'cursor-pointer hover:bg-primary/10' : ''}`}
            tabIndex={0}
            onClick={() => {
              if (ttsEnabled && index !== currentParagraphIndex) {
                onParagraphClick(paragraph, index);
              }
            }}
            title={ttsEnabled ? "Klik untuk mulai membaca dari paragraf ini" : ""}
          >
            {paragraph}
          </p>
        ))}
      </section>
    </article>
  );
};

export default ChapterContent; 