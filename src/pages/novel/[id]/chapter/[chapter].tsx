import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase, Novel, NovelChapter } from '../../../../lib/supabase';
import styles from '../../../../styles/chapter.module.css';
import SEO from '../../../../components/SEO';
import JsonLd, { generateArticleData, generateBreadcrumbData } from '../../../../components/JsonLd';
import { trackChapterView } from '../../../../lib/gtm';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store } from '../../../../store/store';
import { toggleSettings } from '../../../../store/settingsSlice';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  List, 
  Settings, 
  X,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

export default function ChapterPage() {
  const router = useRouter();
  const { id, chapter } = router.query;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapterData, setChapterData] = useState<NovelChapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<number | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [chapterList, setChapterList] = useState<{chapter: number, title: string}[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 100;
  const dispatch = useDispatch();
  const { fontSize, ttsEnabled } = useSelector((state: RootState) => state.settings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentText, setCurrentText] = useState<string>('');
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [noSleep, setNoSleep] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
            
            // Track chapter view
            trackChapterView({
              id: currentChapter.id,
              novel_id: novelData.id,
              chapter: currentChapter.chapter,
              title: currentChapter.title
            });
            
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

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Function to scroll to paragraph
  const scrollToParagraph = useCallback((index: number) => {
    if (paragraphRefs.current[index]) {
      paragraphRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  // Request wake lock with better error handling and retry mechanism
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        // Release any existing wake lock first
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }

        // Request new wake lock
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err) {
        console.log(`Wake Lock error: ${err}`);
        // Retry after 1 second if failed
        setTimeout(requestWakeLock, 1000);
      }
    }
  };

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      } catch (err) {
        console.log(`Wake Lock release error: ${err}`);
      }
    }
  }, []);

  // Initialize NoSleep
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('nosleep.js').then((NoSleep) => {
        setNoSleep(new NoSleep.default());
      });
    }
  }, []);

  // Function declarations first
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentParagraphIndex(0);
      setCurrentText('');
      audioRef.current?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
      // Disable NoSleep
      if (noSleep) {
        noSleep.disable();
        console.log('NoSleep disabled');
      }
    }
  }, [noSleep]);

  const pauseSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      audioRef.current?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, []);

  // Initialize AudioContext
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Modified startSpeaking function
  const startSpeaking = useCallback((text: string, index: number) => {
    if (!speechSynthesisRef.current) return;

    // Enable NoSleep
    if (noSleep) {
      noSleep.enable();
      console.log('NoSleep enabled');
    }

    // Request wake lock when starting speech
    requestWakeLock();

    // Try to start audio playback first
    const startAudio = async () => {
      if (audioRef.current) {
        try {
          // Make sure audio is ready to play
          audioRef.current.currentTime = 0;
          
          // Set up AudioContext only if not already connected
          if (audioContextRef.current && !sourceNodeRef.current) {
            try {
              sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
              sourceNodeRef.current.connect(audioContextRef.current.destination);
              console.log('Audio source connected successfully');
            } catch (err) {
              console.warn('Audio source connection error:', err);
              // Continue even if audio context fails
            }
          }
          
          await audioRef.current.play();
          console.log('Audio playing successfully for TTS');
          
          // Set audio session for background playback
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
            
            // Add position state if supported
            if ('setPositionState' in navigator.mediaSession) {
              navigator.mediaSession.setPositionState({
                duration: 3600,
                playbackRate: 1,
                position: 0
              });
            }
          }
        } catch (err) {
          console.error('Failed to play audio for TTS:', err);
        }
      }
    };

    // Start audio and TTS
    startAudio().then(() => {
      // Cancel any ongoing speech
      speechSynthesisRef.current?.cancel();
      
      // Continue with TTS logic
      // Split long text into smaller chunks (around 200 characters each)
      const chunks = text.match(/.{1,200}(?=\s|$)/g) || [text];
      let currentChunkIndex = 0;

      const speakNextChunk = () => {
        if (currentChunkIndex < chunks.length) {
          const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex].trim());
          utteranceRef.current = utterance;

          // Get settings from Redux store
          const { ttsRate, ttsPitch, ttsVoice } = store.getState().settings;

          // Set voice if specified
          if (ttsVoice) {
            const voices = speechSynthesisRef.current?.getVoices() || [];
            const selectedVoice = voices.find(voice => voice.voiceURI === ttsVoice);
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          } else {
            // Try to set Indonesian voice as fallback
            const voices = speechSynthesisRef.current?.getVoices() || [];
            const indonesianVoice = voices.find(voice => voice.lang.includes('id'));
            if (indonesianVoice) {
              utterance.voice = indonesianVoice;
            }
          }

          // Configure utterance with settings
          utterance.rate = ttsRate;
          utterance.pitch = ttsPitch;

          // Handle utterance events
          utterance.onstart = () => {
            if (currentChunkIndex === 0) {
              setIsPlaying(true);
              setIsPaused(false);
              setCurrentText(text);
              scrollToParagraph(index);
              
              // Update MediaSession state
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
            }
          };

          utterance.onend = () => {
            currentChunkIndex++;
            if (currentChunkIndex < chunks.length) {
              speakNextChunk();
            } else if (chapterData) {
              const paragraphs = chapterData.text.split('\n').filter(p => p.trim() !== '');
              if (index < paragraphs.length - 1) {
                setCurrentParagraphIndex(index + 1);
                startSpeaking(paragraphs[index + 1], index + 1);
              } else {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentParagraphIndex(0);
                setCurrentText('');
                audioRef.current?.pause();
                // Update MediaSession state
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'none';
                }
              }
            }
          };

          utterance.onpause = () => {
            setIsPaused(true);
            setIsPlaying(false);
            // Update MediaSession state
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          };

          utterance.onresume = () => {
            setIsPaused(false);
            setIsPlaying(true);
            // Update MediaSession state
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          };

          utterance.onerror = (event) => {
            console.error('TTS Error:', event);
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentText('');
            audioRef.current?.pause();
            // Update MediaSession state
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'none';
            }
          };

          // Start speaking
          if (speechSynthesisRef.current) {
            speechSynthesisRef.current.speak(utterance);
          }
        }
      };

      // Start the chain of speech
      speakNextChunk();
      setCurrentParagraphIndex(index);
    });
  }, [chapterData, scrollToParagraph, noSleep]);

  const resumeSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      if (currentText && isPaused) {
        audioRef.current?.play().catch(console.error);
        speechSynthesisRef.current.resume();
        setIsPaused(false);
        setIsPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      } else if (chapterData) {
        const paragraphs = chapterData.text.split('\n').filter(p => p.trim() !== '');
        startSpeaking(paragraphs[currentParagraphIndex], currentParagraphIndex);
      }
    }
  }, [chapterData, currentText, isPaused, currentParagraphIndex, startSpeaking]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlaying && isMobile) {
        await requestWakeLock();
      } else if (document.visibilityState === 'hidden' && !isPlaying) {
        await releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock(); // Release wake lock on unmount
    };
  }, [isPlaying, isMobile, releaseWakeLock]);

  // Initialize audio and MediaSession
  useEffect(() => {
    const setupMediaSession = async () => {
      if (!chapterData) return;

      try {
        const audioElement = document.querySelector('#tts-audio-player') as HTMLAudioElement;
        console.log('Audio element found:', !!audioElement);
        
        if (audioElement) {
          audioElement.loop = true;
          audioElement.volume = 0.1;
          // Use a longer audio file for better background support
          audioElement.src = '/audio/background.mp3'; // We'll create this file
          audioRef.current = audioElement;
          
          // Enable audio to play in background
          try {
            // @ts-expect-error - Firefox specific
            audioElement.mozAudioChannelType = 'content';
            // @ts-expect-error - Safari/iOS specific
            audioElement.webkitPreservesPitch = true;
          } catch (e) {
            console.warn('Browser specific audio properties not supported:', e);
          }

          // Set audio properties for background playback
          audioElement.setAttribute('x-webkit-airplay', 'allow');
          audioElement.setAttribute('x-webkit-playsinline', 'true');
          audioElement.setAttribute('webkit-playsinline', 'true');
          audioElement.setAttribute('x-webkit-background-playback', 'true');
          audioElement.setAttribute('playsinline', '');
          
          // Add event listeners
          audioElement.addEventListener('play', () => {
            console.log('Audio started playing');
            requestWakeLock(); // Request wake lock when audio starts
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          });
          
          audioElement.addEventListener('pause', () => {
            console.log('Audio paused');
            // Update MediaSession state when audio pauses
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          });
          
          audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
          });

          // Try to load the audio
          try {
            await audioElement.load();
            console.log('Audio loaded successfully');
          } catch (err) {
            console.error('Failed to load audio:', err);
          }
        }

        if ('mediaSession' in navigator) {
          console.log('MediaSession API available');
          
          // Set metadata first
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `Chapter ${chapterData.chapter}: ${chapterData.title}`,
            artist: novel?.name || 'Novel Reading',
            album: 'Text to Speech',
            artwork: [
              { src: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
            ]
          });

          // Set action handlers
          navigator.mediaSession.setActionHandler('play', async () => {
            try {
              if (!isPlaying && audioRef.current) {
                console.log('Play action triggered');
                // Explicitly try to play audio first
                await audioRef.current.play();
                console.log('Audio started from media controls');
                resumeSpeaking();
              }
            } catch (error) {
              console.error('Play action error:', error);
            }
          });

          navigator.mediaSession.setActionHandler('pause', () => {
            try {
              console.log('Pause action triggered');
              if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                pauseSpeaking();
              }
            } catch (error) {
              console.error('Pause action error:', error);
            }
          });

          navigator.mediaSession.setActionHandler('stop', () => {
            try {
              console.log('Stop action triggered');
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                stopSpeaking();
              }
            } catch (error) {
              console.error('Stop action error:', error);
            }
          });

          // Set initial state
          navigator.mediaSession.playbackState = 'none';
        } else {
          console.log('MediaSession API not available');
        }
      } catch (error) {
        console.error('Error setting up MediaSession:', error);
      }
    };

    setupMediaSession();

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('mediaSession' in navigator) {
        ['play', 'pause', 'stop'].forEach(action => {
          try {
            navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
          } catch (e) {
            console.warn(`Failed to remove ${action} handler:`, e);
          }
        });
      }
    };
  }, [novel, chapterData, isPlaying, resumeSpeaking, pauseSpeaking, stopSpeaking]);

  // Modified cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText('');
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Render TTS controls
  const renderTtsControls = () => {
    if (!ttsEnabled) return null;

    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-base-300 rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => {
              if (isPlaying) {
                pauseSpeaking();
              } else {
                resumeSpeaking();
              }
            }}
            className="btn btn-circle btn-sm"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={stopSpeaking}
            className="btn btn-circle btn-sm"
            aria-label="Stop"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Modify renderChapterContent to highlight current paragraph
  const renderChapterContent = () => {
    if (!chapterData || !novel) return null;
    
    // Split text into paragraphs
    const paragraphs = chapterData.text.split('\n').filter(p => p.trim() !== '');
    
    // Reset paragraph refs array
    paragraphRefs.current = new Array(paragraphs.length).fill(null);
    
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
          {paragraphs.map((paragraph: string, index: number) => (
            <p 
              key={index}
              ref={(el: HTMLParagraphElement | null) => {
                paragraphRefs.current[index] = el;
              }}
              className={`mb-4 ${ttsEnabled && currentParagraphIndex === index && isPlaying ? 'bg-primary/50 transition-colors duration-200' : ''} ${ttsEnabled && isPlaying ? 'cursor-pointer hover:bg-primary/10' : ''}`}
              tabIndex={0}
              onClick={() => {
                if (ttsEnabled && isPlaying && index !== currentParagraphIndex) {
                  startSpeaking(paragraph, index);
                }
              }}
              title={ttsEnabled && isPlaying ? "Click to jump to this paragraph" : ""}
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
                  <X className="w-5 h-5" />
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!novel || !chapterData) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio element - updated for better background support */}
      <audio 
        id="tts-audio-player"
        src="/audio/background.mp3"
        style={{ display: 'none' }}
        playsInline
        preload="auto"
        loop
        controls
        x-webkit-airplay="allow"
        x-webkit-playsinline="true"
        webkit-playsinline="true"
        x-webkit-background-playback="true"
      />

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
                        <ChevronLeft className="w-5 h-5" />
                      </Link>
                    ) : (
                      <button className="btn btn-circle btn-sm btn-ghost opacity-50" disabled title="No Previous Chapter">
                        <ChevronLeft className="w-5 h-5" />
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
                      <Home className="w-5 h-5" />
                    </Link>
                    </div>

                    <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setShowChapterList(true)}
                      className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                      aria-label="Show chapter list"
                      title="Chapter List"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    </div>

                    <div className="flex justify-between items-center">
                    <button 
                      onClick={() => dispatch(toggleSettings())}
                      className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
                      aria-label="Open settings"
                      title="Settings"
                    >
                      <Settings className="w-5 h-5" />
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
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <button className="btn btn-circle btn-sm btn-ghost opacity-50" disabled title="No Next Chapter">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TTS Controls */}
      {renderTtsControls()}

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <div className="btm-nav btm-nav-sm fixed bottom-0 z-50 bg-base-100 border-t border-base-300 shadow-lg">
          {prevChapter ? (
            <Link 
              href={`/novel/${novel.url || novel.id}/chapter/${prevChapter}`}
              className="text-base-content"
              aria-label="Previous chapter"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span className="btm-nav-label text-xs">Prev</span>
            </Link>
          ) : (
            <button className="text-base-content opacity-50" disabled aria-label="No previous chapter">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              <span className="btm-nav-label text-xs">Prev</span>
            </button>
          )}
          
          <Link 
            href={`/novel/${novel.url || novel.id}`}
            className="text-base-content"
            aria-label="Back to novel"
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            <span className="btm-nav-label text-xs">Novel</span>
          </Link>
          
          <button 
            onClick={() => setShowChapterList(true)}
            className="text-base-content"
            aria-label="Show chapter list"
          >
            <List className="w-5 h-5" aria-hidden="true" />
            <span className="btm-nav-label text-xs">Chapters</span>
          </button>
          
          <button 
            onClick={() => dispatch(toggleSettings())}
            className="text-base-content"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span className="btm-nav-label text-xs">Settings</span>
          </button>
          
          {nextChapter ? (
            <Link 
              href={`/novel/${novel.url || novel.id}/chapter/${nextChapter}`}
              className="text-base-content"
              aria-label="Next chapter"
            >
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
              <span className="btm-nav-label text-xs">Next</span>
            </Link>
          ) : (
            <button className="text-base-content opacity-50" disabled aria-label="No next chapter">
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
              <span className="btm-nav-label text-xs">Next</span>
            </button>
          )}
        </div>
      )}

      {/* Chapter list drawer */}
      {renderChapterListModal()}
    </>
  );
}