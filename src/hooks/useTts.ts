import { useState, useEffect, useRef, useCallback } from 'react';
import { store } from '../store/store';

export interface TtsHookProps {
  enabled: boolean;
  paragraphs: string[];
  onParagraphChange?: () => void;
  onChapterEnd?: () => void;
  hasNextChapter?: boolean;
}

export interface TtsHookReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentParagraphIndex: number;
  currentText: string;
  startSpeaking: (text: string, index: number) => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  isAutoPlaying: boolean;
}

export const useTts = ({ 
  enabled, 
  paragraphs, 
  onParagraphChange,
  onChapterEnd,
  hasNextChapter = false
}: TtsHookProps): TtsHookReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentText, setCurrentText] = useState<string>('');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [noSleep, setNoSleep] = useState<any>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize NoSleep
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('nosleep.js').then((NoSleepModule) => {
        const noSleepInstance = new NoSleepModule.default();
        setNoSleep(noSleepInstance);
        
        // Langsung cek pengaturan ttsNoSleep begitu NoSleep terinisialisasi
        const { ttsNoSleep } = store.getState().settings;
        if (ttsNoSleep) {
          noSleepInstance.enable();
        }
      }).catch(err => {
        console.error('Failed to load NoSleep module:', err);
      });
    }
    
    return () => {
      if (noSleep) {
        noSleep.disable();
      }
    };
  }, []);

  // Fungsi untuk memperbarui status NoSleep berdasarkan pengaturan saja
  const updateNoSleepState = useCallback(() => {
    const { ttsNoSleep } = store.getState().settings;
    
    if (noSleep) {
      if (ttsNoSleep) {
        noSleep.enable();
      } else {
        noSleep.disable();
      }
    }
  }, [noSleep]);

  // Tambahkan subscriber ke store untuk memantau perubahan pengaturan ttsNoSleep
  useEffect(() => {
    let currentNoSleepValue = store.getState().settings.ttsNoSleep;
    
    const unsubscribe = store.subscribe(() => {
      const newNoSleepValue = store.getState().settings.ttsNoSleep;
      
      // Hanya update jika nilai berubah
      if (newNoSleepValue !== currentNoSleepValue) {
        currentNoSleepValue = newNoSleepValue;
        updateNoSleepState();
      }
    });
    
    // Initial update
    updateNoSleepState();
    
    return () => {
      unsubscribe();
      if (noSleep) {
        noSleep.disable();
      }
    };
  }, [noSleep, updateNoSleepState]);

  // Clean up autoplay timer on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
      }
    };
  }, [autoPlayTimer]);

  // Function to update current paragraph index and notify parent component
  const updateCurrentParagraph = useCallback((index: number) => {
    // Update current paragraph index
    setCurrentParagraphIndex(index);
    
    // Notify parent component if callback is provided
    // We just call the callback without arguments since Component handles the auto-scroll
    if (onParagraphChange) {
      onParagraphChange();
    }
  }, [onParagraphChange]);

  // Function to handle chapter end with autoplay
  const handleChapterEnd = useCallback(() => {
    const { ttsAutoPlay, ttsAutoPlayDelay } = store.getState().settings;
    
    // Selalu bersihkan TTS saat akhir chapter
    // Stop TTS completely
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText('');
      setCurrentParagraphIndex(0);
    }
    
    // Clear any existing timer
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      setAutoPlayTimer(null);
    }
    
    // Only proceed with auto-play if enabled and there is a next chapter
    if (ttsAutoPlay && hasNextChapter && onChapterEnd) {
      // Aktifkan status autoplay (untuk menampilkan countdown)
      setIsAutoPlaying(true);
      
      // Ensure the flag is set before navigation
      localStorage.setItem('fromAutoPlay', 'true');
      
      // Set timer to navigate after delay
      const timer = setTimeout(() => {
        setIsAutoPlaying(false);
        
        // Add small delay to ensure flag is set before navigation
        setTimeout(() => {
          onChapterEnd();
        }, 50);
      }, ttsAutoPlayDelay * 1000);
      
      setAutoPlayTimer(timer);
    }
  }, [autoPlayTimer, hasNextChapter, onChapterEnd]);

  // Function for starting speech
  const startSpeaking = useCallback((text: string, index: number) => {
    // Jangan mulai TTS jika sedang dalam status auto-play (countdown)
    if (!speechSynthesisRef.current || !enabled || isAutoPlaying) return;

    // Cancel any ongoing speech
    speechSynthesisRef.current?.cancel();
    
    // Pecah teks menjadi kalimat-kalimat terlebih dahulu
    // Menggunakan regex untuk memecah berdasarkan tanda baca akhir kalimat (., !, ?)
    // dengan mempertahankan tanda bacanya
    const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
    
    // Array untuk menyimpan semua chunk dari semua kalimat
    const allChunks: string[] = [];
    
    // Proses setiap kalimat
    sentences.forEach(sentence => {
      // Jika panjang kalimat lebih dari 200, coba pecah berdasarkan koma dulu
      if (sentence.length > 200) {
        // Pecah berdasarkan koma terlebih dahulu
        const commaChunks = sentence.split(/,(?=\s)/).filter(Boolean);
        
        // Proses setiap bagian yang sudah dipecah berdasarkan koma
        commaChunks.forEach(commaChunk => {
          // Jika bagian masih lebih dari 200 karakter, pecah lagi
          if (commaChunk.length > 200) {
            const sentenceChunks = commaChunk.match(/.{1,200}(?=\\s|$|\b)/g) || [commaChunk];
            allChunks.push(...sentenceChunks);
          } else {
            allChunks.push(commaChunk);
          }
        });
      } else {
        // Jika kalimat pendek, tambahkan langsung
        allChunks.push(sentence);
      }
    });
    
    // Jika tidak ada kalimat yang terdeteksi, gunakan teks asli
    if (allChunks.length === 0) {
      allChunks.push(text);
    }
    
    let currentChunkIndex = 0;

    const speakNextChunk = () => {
      if (currentChunkIndex < allChunks.length) {
        const utterance = new SpeechSynthesisUtterance(allChunks[currentChunkIndex].trim());
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
            updateCurrentParagraph(index);
          }
        };

        utterance.onend = () => {
          currentChunkIndex++;
          if (currentChunkIndex < allChunks.length) {
            speakNextChunk();
          } else {
            // Move to next paragraph
            const nextIndex = index + 1;
            
            if (nextIndex < paragraphs.length) {
              // Scroll to next paragraph with settings
              updateCurrentParagraph(nextIndex);
              // Speak next paragraph
              startSpeaking(paragraphs[nextIndex], nextIndex);
            } else {
              // End of chapter
              setIsPlaying(false);
              setIsPaused(false);
              setCurrentParagraphIndex(0);
              setCurrentText('');
              
              // Handle auto-play to next chapter
              // Pastikan TTS tidak dimulai ulang saat auto-play countdown sedang berjalan
              if (hasNextChapter) {
                handleChapterEnd();
              }
            }
          }
        };

        utterance.onpause = () => {
          setIsPaused(true);
          setIsPlaying(false);
        };

        utterance.onresume = () => {
          setIsPaused(false);
          setIsPlaying(true);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsPaused(false);
          setIsPlaying(false);
          setCurrentText('');
        };

        speechSynthesisRef.current?.speak(utterance);
      }
    };

    speakNextChunk();
    setCurrentParagraphIndex(index);
  }, [enabled, paragraphs, updateCurrentParagraph, handleChapterEnd, isAutoPlaying]);

  const pauseSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  }, []);

  // Cancel auto-play when manually stopping
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      // Batalkan speech synthesis yang sedang berjalan
      speechSynthesisRef.current.cancel();
      
      // Reset semua state
      setIsPaused(false);
      setIsPlaying(false);
      setCurrentText('');
      
      // Reset ke paragraf pertama
      setCurrentParagraphIndex(0);
      
      // Cancel auto-play if active
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        setAutoPlayTimer(null);
        setIsAutoPlaying(false);
      }
    }
  }, [autoPlayTimer]);

  return {
    isPlaying,
    isPaused,
    currentParagraphIndex,
    currentText,
    startSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    isAutoPlaying
  };
};

export default useTts; 