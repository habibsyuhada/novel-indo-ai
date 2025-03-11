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
        setNoSleep(new NoSleepModule.default());
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

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && !isPaused) {
        if (noSleep) {
          noSleep.enable();
        }
      } else if (document.visibilityState === 'hidden' || !isPlaying || isPaused) {
        if (noSleep) {
          noSleep.disable();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (noSleep) {
        noSleep.disable();
      }
    };
  }, [isPlaying, isPaused, noSleep]);

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
    
    // Clear any existing timer
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      setAutoPlayTimer(null);
    }
    
    // Only proceed if autoplay is enabled and there is a next chapter
    if (ttsAutoPlay && hasNextChapter && onChapterEnd) {
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
    if (!speechSynthesisRef.current || !enabled) return;

    // Enable NoSleep when starting speech
    if (noSleep) {
      noSleep.enable();
    }

    // Cancel any ongoing speech
    speechSynthesisRef.current?.cancel();
    
    // Split long text into smaller chunks (around 200 characters each)
    const chunks = text.match(/.{1,200}(?=\\s|$)/g) || [text];
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
            updateCurrentParagraph(index);
          }
        };

        utterance.onend = () => {
          currentChunkIndex++;
          if (currentChunkIndex < chunks.length) {
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
              handleChapterEnd();
              
              // Disable NoSleep when TTS finishes
              if (noSleep) {
                noSleep.disable();
              }
            }
          }
        };

        utterance.onpause = () => {
          setIsPaused(true);
          setIsPlaying(false);
          // Disable NoSleep when TTS is paused
          if (noSleep) {
            noSleep.disable();
          }
        };

        utterance.onresume = () => {
          setIsPaused(false);
          setIsPlaying(true);
          // Enable NoSleep when TTS is resumed
          if (noSleep) {
            noSleep.enable();
          }
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsPaused(false);
          setIsPlaying(false);
          setCurrentText('');
          // Disable NoSleep on error
          if (noSleep) {
            noSleep.disable();
          }
        };

        speechSynthesisRef.current?.speak(utterance);
      }
    };

    speakNextChunk();
    setCurrentParagraphIndex(index);
  }, [enabled, noSleep, paragraphs, updateCurrentParagraph, handleChapterEnd]);

  const pauseSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      
      // Disable NoSleep when paused
      if (noSleep) {
        noSleep.disable();
      }
    }
  }, [noSleep]);

  const resumeSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      
      // Enable NoSleep when resumed
      if (noSleep) {
        noSleep.enable();
      }
    }
  }, [noSleep]);

  // Cancel auto-play when manually stopping
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsPaused(false);
      setIsPlaying(false);
      setCurrentText('');
      
      // Cancel auto-play if active
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        setAutoPlayTimer(null);
        setIsAutoPlaying(false);
      }
      
      // Disable NoSleep when stopped
      if (noSleep) {
        noSleep.disable();
      }
    }
  }, [noSleep, autoPlayTimer]);

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