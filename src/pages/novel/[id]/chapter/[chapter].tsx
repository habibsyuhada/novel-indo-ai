import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../components/Layout';
import { supabase, Novel, NovelChapter } from '../../../../lib/supabase';
import styles from '../../../../styles/chapter.module.css';

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
  
  // Text-to-speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState<number>(-1);
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const paragraphsRef = useRef<string[]>([]);
  const currentParagraphIndex = useRef<number>(0);
  const paragraphElementsRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const wasPlayingBeforeHidden = useRef<boolean>(false);
  const [showAndroidWarning, setShowAndroidWarning] = useState(false);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAndroid = useRef<boolean>(false);
  
  // Define WakeLock types
  type WakeLockSentinel = {
    released: boolean;
    release: () => Promise<void>;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
  
  type WakeLockNavigator = Navigator & {
    wakeLock: {
      request: (type: 'screen') => Promise<WakeLockSentinel>;
    };
  };
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile and detect Android
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check if device is Android
    if (typeof navigator !== 'undefined') {
      isAndroid.current = /android/i.test(navigator.userAgent);
      
      // Create silent audio element for Android
      if (isAndroid.current) {
        // Create a silent audio element that will keep the process alive
        const audioElement = document.createElement('audio');
        audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audioElement.loop = true;
        silentAudioRef.current = audioElement;
      }
    }
    
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

      // Load speech rate
      const savedSpeechRate = localStorage.getItem('speechRate');
      if (savedSpeechRate) {
        setSpeechRate(parseFloat(savedSpeechRate));
      }

      // Voice will be loaded after voices are available
      const savedVoiceIndex = localStorage.getItem('selectedVoiceIndex');
      if (savedVoiceIndex) {
        setSelectedVoiceIndex(parseInt(savedVoiceIndex));
      }
    }
  }, []);

  // Fetch chapter data
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!id || !chapter) return;
      
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
          
          // Fetch current chapter
          const { data: currentChapter, error: chapterError } = await supabase
            .from('novel_chapter')
            .select('*')
            .eq('novel', id)
            .eq('chapter', chapter)
            .single();

          if (chapterError) throw chapterError;
          
          if (currentChapter) {
            setChapterData(currentChapter);
            
            // Prepare paragraphs for text-to-speech
            paragraphsRef.current = currentChapter.text
              .split('\n')
              .filter((paragraph: string) => paragraph.trim() !== '');
            
            // Initialize paragraph elements ref array
            paragraphElementsRef.current = new Array(paragraphsRef.current.length).fill(null);
            
            // Check for previous chapter
            const { data: prevChapterData } = await supabase
              .from('novel_chapter')
              .select('chapter')
              .eq('novel', id)
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
              .eq('novel', id)
              .gt('chapter', chapter)
              .order('chapter', { ascending: true })
              .limit(1)
              .single();
            
            if (nextChapterData) {
              setNextChapter(nextChapterData.chapter);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [id, chapter]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadVoices = () => {
      const voices = speechSynthesis?.getVoices() || [];
      
      // Try to find saved voice or default to English
      if (voices.length > 0) {
        if (selectedVoiceIndex < voices.length) {
          setSelectedVoice(voices[selectedVoiceIndex]);
        } else {
          // Try to find an English voice
          const englishVoice = voices.find(voice => 
            voice.lang.includes('en') || voice.lang.includes('id')
          );
          setSelectedVoice(englishVoice || voices[0]);
          setSelectedVoiceIndex(voices.indexOf(englishVoice || voices[0]));
          localStorage.setItem('selectedVoiceIndex', voices.indexOf(englishVoice || voices[0]).toString());
        }
      }
    };
    
    // Chrome loads voices asynchronously
    if (speechSynthesis) {
      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // For Firefox
    }
    
    // Cleanup
    return () => {
      stopSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoiceIndex]);

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

  // Scroll to highlighted paragraph
  useEffect(() => {
    if (currentHighlightIndex >= 0 && paragraphElementsRef.current[currentHighlightIndex]) {
      const paragraphElement = paragraphElementsRef.current[currentHighlightIndex];
      if (paragraphElement) {
        // Scroll the paragraph into view with a smooth behavior
        paragraphElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentHighlightIndex]);

  // Text-to-speech functions
  const speakNextParagraph = () => {
    if (!speechSynthesis || currentParagraphIndex.current >= paragraphsRef.current.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      currentParagraphIndex.current = 0;
      setCurrentHighlightIndex(-1);
      
      // Stop silent audio if it's playing (for Android)
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(paragraphsRef.current[currentParagraphIndex.current]);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = speechRate;
    
    utterance.onstart = () => {
      setCurrentHighlightIndex(currentParagraphIndex.current);
      
      // Start playing silent audio to keep process alive on Android
      if (isAndroid.current && silentAudioRef.current) {
        silentAudioRef.current.play().catch(err => {
          console.error('Failed to play silent audio:', err);
        });
        
        // Show Android warning once
        if (!showAndroidWarning) {
          setShowAndroidWarning(true);
        }
      }
    };
    
    utterance.onend = () => {
      currentParagraphIndex.current += 1;
      speakNextParagraph();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentHighlightIndex(-1);
      
      // Stop silent audio if it's playing (for Android)
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    };
    
    currentUtterance.current = utterance;
    speechSynthesis.speak(utterance);
  };
  
  const pauseSpeaking = () => {
    if (speechSynthesis && isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
      
      // Pause silent audio (for Android)
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    }
  };
  
  const resumeSpeaking = () => {
    if (speechSynthesis && isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      
      // Resume silent audio (for Android)
      if (isAndroid.current && silentAudioRef.current) {
        silentAudioRef.current.play().catch(err => {
          console.error('Failed to play silent audio:', err);
        });
      }
    }
  };
  
  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentParagraphIndex.current = 0;
      setCurrentHighlightIndex(-1);
      
      // Stop silent audio if it's playing (for Android)
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    }
  };

  // Set paragraph ref
  const setParagraphRef = (element: HTMLParagraphElement | null, index: number) => {
    paragraphElementsRef.current[index] = element;
  };

  // Handle paragraph click to start reading from that paragraph
  const handleParagraphClick = (index: number) => {
    // If already speaking, stop first
    if (isSpeaking) {
      stopSpeaking();
      
      // Small delay to ensure speech synthesis is reset before starting again
      setTimeout(() => {
        setIsSpeaking(true);
        setIsPaused(false);
        currentParagraphIndex.current = index;
        setCurrentHighlightIndex(index);
        speakNextParagraph();
      }, 100);
    } else {
      // Start speaking from the clicked paragraph
      setIsSpeaking(true);
      setIsPaused(false);
      currentParagraphIndex.current = index;
      setCurrentHighlightIndex(index);
      speakNextParagraph();
    }
  };

  // Handle page visibility changes (for mobile devices when screen is locked)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden (screen locked or app in background)
        wasPlayingBeforeHidden.current = isSpeaking && !isPaused;
        
        if (isSpeaking && !isPaused) {
          // We need to pause speech when page is hidden
          speechSynthesis?.pause();
          // Note: We don't update state here because the page is hidden
        }
      } else if (document.visibilityState === 'visible') {
        // Page is visible again (screen unlocked or app in foreground)
        if (wasPlayingBeforeHidden.current) {
          // Resume speech if it was playing before
          speechSynthesis?.resume();
          wasPlayingBeforeHidden.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, isPaused]);

  // Handle wake lock to prevent screen from turning off during speech
  useEffect(() => {
    // Only try to get a wake lock if the feature is supported and we're speaking
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isSpeaking && !isPaused) {
        try {
          // Request a screen wake lock
          wakeLockRef.current = await (navigator as WakeLockNavigator).wakeLock.request('screen');
          
          console.log('Wake Lock is active');
          
          // Add a listener to release the wake lock if the page becomes hidden
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock was released');
          });
        } catch (err) {
          console.error(`Failed to get wake lock: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    
    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
          .then(() => {
            wakeLockRef.current = null;
            console.log('Wake Lock released');
          })
          .catch((err: unknown) => {
            console.error(`Failed to release wake lock: ${err instanceof Error ? err.message : String(err)}`);
          });
      }
    };
    
    if (isSpeaking && !isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    
    // Clean up on unmount
    return () => {
      releaseWakeLock();
    };
  }, [isSpeaking, isPaused]);

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
    <Layout>
      <Head>
        <title>{novel.name} - Chapter {chapterData.chapter}: {chapterData.title} - Novel Indo</title>
        <meta name="description" content={`Read ${novel.name} Chapter ${chapterData.chapter}: ${chapterData.title}`} />
      </Head>

      {/* Android Warning Toast */}
      {showAndroidWarning && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-info">
            <div>
              <span>For Android: Keep screen on for uninterrupted playback</span>
              <button 
                className="btn btn-sm btn-circle ml-2" 
                onClick={() => setShowAndroidWarning(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-1 bg-base-300 z-50">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <Link href={`/novel/${novel.id}`} className="btn btn-ghost btn-sm md:btn-md">
          {isMobile ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          ) : (
            "← Back to Novel"
          )}
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl mb-4 md:mb-6">
        <div className="card-body p-3 md:p-6">
          <h1 className="card-title text-xl md:text-2xl">{novel.name}</h1>
          <h2 className="text-lg md:text-xl">Chapter {chapterData.chapter}: {chapterData.title}</h2>
          
          <div className="mt-3 md:mt-4">
            <div className="flex flex-wrap gap-2 md:gap-4 items-center">
              {isSpeaking ? (
                <>
                  <button 
                    onClick={isPaused ? resumeSpeaking : pauseSpeaking} 
                    className="btn btn-sm md:btn-md btn-primary"
                    aria-label={isPaused ? "Resume reading" : "Pause reading"}
                  >
                    {isPaused ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 md:mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                        {!isMobile && "Resume"}
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 md:mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                        {!isMobile && "Pause"}
                      </>
                    )}
                  </button>
                  <button 
                    onClick={stopSpeaking} 
                    className="btn btn-sm md:btn-md btn-error"
                    aria-label="Stop reading"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 md:mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                    </svg>
                    {!isMobile && "Stop"}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleParagraphClick(0)} 
                  className="btn btn-sm md:btn-md btn-primary"
                  aria-label="Read aloud"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1 md:mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  {!isMobile && "Read Aloud"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4 md:mb-6">
        {prevChapter ? (
          <Link href={`/novel/${novel.id}/chapter/${prevChapter}`} className="btn btn-outline btn-sm md:btn-md">
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              "← Previous Chapter"
            )}
          </Link>
        ) : (
          <button className="btn btn-outline btn-sm md:btn-md" disabled>
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              "← Previous Chapter"
            )}
          </button>
        )}
        
        <Link href={`/novel/${novel.id}`} className="btn btn-primary btn-sm md:btn-md">
          {isMobile ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          ) : (
            "Chapter List"
          )}
        </Link>
        
        {nextChapter ? (
          <Link href={`/novel/${novel.id}/chapter/${nextChapter}`} className="btn btn-outline btn-sm md:btn-md">
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              "Next Chapter →"
            )}
          </Link>
        ) : (
          <button className="btn btn-outline btn-sm md:btn-md" disabled>
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              "Next Chapter →"
            )}
          </button>
        )}
      </div>

      <div className="card bg-base-100 shadow-xl mb-4 md:mb-6" ref={contentRef}>
        <div className="card-body p-3 md:p-6">
          <div className="prose max-w-none">
            <div 
              className={styles.chapterContent} 
              style={{ fontSize: `${fontSize}px` }}
            >
              {chapterData.text.split('\n').filter(paragraph => paragraph.trim() !== '').map((paragraph, index) => (
                <p 
                  key={index} 
                  ref={(el) => setParagraphRef(el, index)}
                  className={currentHighlightIndex === index ? 'bg-primary bg-opacity-20 rounded transition-all duration-300' : ''}
                  onClick={() => handleParagraphClick(index)}
                  style={{ cursor: 'pointer' }}
                  title="Click to read from this paragraph"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4 md:mb-6">
        {prevChapter ? (
          <Link href={`/novel/${novel.id}/chapter/${prevChapter}`} className="btn btn-outline btn-sm md:btn-md">
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              "← Previous Chapter"
            )}
          </Link>
        ) : (
          <button className="btn btn-outline btn-sm md:btn-md" disabled>
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              "← Previous Chapter"
            )}
          </button>
        )}
        
        <Link href={`/novel/${novel.id}`} className="btn btn-primary btn-sm md:btn-md">
          {isMobile ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          ) : (
            "Chapter List"
          )}
        </Link>
        
        {nextChapter ? (
          <Link href={`/novel/${novel.id}/chapter/${nextChapter}`} className="btn btn-outline btn-sm md:btn-md">
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              "Next Chapter →"
            )}
          </Link>
        ) : (
          <button className="btn btn-outline btn-sm md:btn-md" disabled>
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              "Next Chapter →"
            )}
          </button>
        )}
      </div>
    </Layout>
  );
} 