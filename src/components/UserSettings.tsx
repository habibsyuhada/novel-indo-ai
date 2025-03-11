import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  setFontSize, 
  setTheme, 
  setTtsEnabled, 
  setTtsRate,
  setTtsPitch,
  setTtsVoice,
  setTtsAutoScroll,
  setTtsScrollPosition,
  setTtsScrollBehavior,
  setTtsAutoPlay,
  setTtsAutoPlayDelay
} from '../store/settingsSlice';
import { X } from 'lucide-react';

type UserSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const dispatch = useDispatch();
  const { 
    fontSize, 
    theme, 
    ttsEnabled,
    ttsRate,
    ttsPitch,
    ttsVoice,
    ttsAutoScroll,
    ttsScrollPosition,
    ttsScrollBehavior,
    ttsAutoPlay,
    ttsAutoPlayDelay
  } = useSelector((state: RootState) => state.settings);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load font size
      const savedFontSize = localStorage.getItem('fontSize');
      if (savedFontSize) {
        dispatch(setFontSize(parseInt(savedFontSize)));
      }
      
      // Load theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        dispatch(setTheme(savedTheme as 'light' | 'dark'));
      }

      // Load TTS settings
      const savedTts = localStorage.getItem('ttsEnabled');
      if (savedTts) {
        dispatch(setTtsEnabled(savedTts === 'true'));
      }
      
      const savedTtsRate = localStorage.getItem('ttsRate');
      if (savedTtsRate) {
        dispatch(setTtsRate(parseFloat(savedTtsRate)));
      }
      
      const savedTtsPitch = localStorage.getItem('ttsPitch');
      if (savedTtsPitch) {
        dispatch(setTtsPitch(parseFloat(savedTtsPitch)));
      }
      
      const savedTtsVoice = localStorage.getItem('ttsVoice');
      if (savedTtsVoice) {
        dispatch(setTtsVoice(savedTtsVoice));
      }
      
      const savedTtsAutoScroll = localStorage.getItem('ttsAutoScroll');
      if (savedTtsAutoScroll) {
        dispatch(setTtsAutoScroll(savedTtsAutoScroll === 'true'));
      }
      
      const savedTtsScrollPosition = localStorage.getItem('ttsScrollPosition');
      if (savedTtsScrollPosition && (savedTtsScrollPosition === 'start' || savedTtsScrollPosition === 'center')) {
        dispatch(setTtsScrollPosition(savedTtsScrollPosition));
      }
      
      const savedTtsScrollBehavior = localStorage.getItem('ttsScrollBehavior');
      if (savedTtsScrollBehavior && (savedTtsScrollBehavior === 'smooth' || savedTtsScrollBehavior === 'auto')) {
        dispatch(setTtsScrollBehavior(savedTtsScrollBehavior));
      }
      
      const savedTtsAutoPlay = localStorage.getItem('ttsAutoPlay');
      if (savedTtsAutoPlay) {
        dispatch(setTtsAutoPlay(savedTtsAutoPlay === 'true'));
      }
      
      const savedTtsAutoPlayDelay = localStorage.getItem('ttsAutoPlayDelay');
      if (savedTtsAutoPlayDelay) {
        dispatch(setTtsAutoPlayDelay(parseInt(savedTtsAutoPlayDelay)));
      }
    }
  }, [dispatch]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    // Load voices immediately if available
    loadVoices();

    // Also handle async loading of voices
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Font size handlers
  const increaseFontSize = () => {
    if (fontSize < 24) {
      const newSize = fontSize + 1;
      dispatch(setFontSize(newSize));
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 14) {
      const newSize = fontSize - 1;
      dispatch(setFontSize(newSize));
      localStorage.setItem('fontSize', newSize.toString());
    }
  };
  
  // Theme handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // TTS handlers
  const toggleTts = () => {
    const newTtsEnabled = !ttsEnabled;
    dispatch(setTtsEnabled(newTtsEnabled));
    localStorage.setItem('ttsEnabled', newTtsEnabled.toString());
  };

  const handleTtsRateChange = (value: number) => {
    dispatch(setTtsRate(value));
    localStorage.setItem('ttsRate', value.toString());
  };

  const handleTtsPitchChange = (value: number) => {
    dispatch(setTtsPitch(value));
    localStorage.setItem('ttsPitch', value.toString());
  };

  const handleTtsVoiceChange = (voiceUri: string) => {
    dispatch(setTtsVoice(voiceUri));
    localStorage.setItem('ttsVoice', voiceUri);
  };

  // Auto-scroll handlers
  const toggleTtsAutoScroll = () => {
    const newValue = !ttsAutoScroll;
    dispatch(setTtsAutoScroll(newValue));
    localStorage.setItem('ttsAutoScroll', newValue.toString());
  };

  const handleTtsScrollPositionChange = (position: 'start' | 'center') => {
    dispatch(setTtsScrollPosition(position));
    localStorage.setItem('ttsScrollPosition', position);
  };

  const handleTtsScrollBehaviorChange = (behavior: 'smooth' | 'auto') => {
    dispatch(setTtsScrollBehavior(behavior));
    localStorage.setItem('ttsScrollBehavior', behavior);
  };

  // Auto-play handlers
  const toggleTtsAutoPlay = () => {
    const newValue = !ttsAutoPlay;
    dispatch(setTtsAutoPlay(newValue));
    localStorage.setItem('ttsAutoPlay', newValue.toString());
  };

  const handleTtsAutoPlayDelayChange = (value: number) => {
    dispatch(setTtsAutoPlayDelay(value));
    localStorage.setItem('ttsAutoPlayDelay', value.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="drawer drawer-end fixed inset-0 z-50">
      <input id="settings-drawer" type="checkbox" className="drawer-toggle" checked={isOpen} readOnly />
      <div className="drawer-side">
        <label htmlFor="settings-drawer" className="drawer-overlay" onClick={onClose}></label>
        <div className={`bg-base-100 h-full flex flex-col ${isMobile ? 'w-full' : 'w-[320px] shadow-xl'}`}>
          <div className="p-4 border-b border-base-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Pengaturan Pengguna</h2>
              <button 
                onClick={onClose} 
                className="btn btn-sm btn-circle"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Theme Setting */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Theme</span>
              </label>
              <div className="flex items-center gap-2">
                <span>Light</span>
                <input 
                  type="checkbox" 
                  className="toggle toggle-primary" 
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  aria-label="Toggle dark mode"
                />
                <span>Dark</span>
              </div>
            </div>
            
            {/* Font Size Setting */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Font Size: {fontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={decreaseFontSize} 
                  className="btn btn-sm btn-outline"
                  disabled={fontSize <= 14}
                  aria-label="Decrease font size"
                >
                  A-
                </button>
                <input 
                  type="range" 
                  min="14" 
                  max="24" 
                  value={fontSize} 
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    dispatch(setFontSize(newSize));
                    localStorage.setItem('fontSize', newSize.toString());
                  }}
                  className="range range-primary range-sm flex-1" 
                  aria-label="Font size slider"
                />
                <button 
                  onClick={increaseFontSize} 
                  className="btn btn-sm btn-outline"
                  disabled={fontSize >= 24}
                  aria-label="Increase font size"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Text-to-Speech Settings */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Text-to-Speech</span>
              </label>
              <div className="flex items-center gap-2">
                <span>Nonaktif</span>
                <input 
                  type="checkbox" 
                  className="toggle toggle-primary" 
                  checked={ttsEnabled}
                  onChange={toggleTts}
                  aria-label="Toggle text-to-speech"
                />
                <span>Aktif</span>
              </div>
            </div>

            {/* TTS Additional Settings - Only show when enabled */}
            {ttsEnabled && (
              <div className="space-y-4 mt-2 pl-4 border-l-2 border-primary">
                {/* Voice Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Voice</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={ttsVoice}
                    onChange={(e) => handleTtsVoiceChange(e.target.value)}
                    aria-label="Select voice"
                  >
                    <option value="">Default Voice</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speech Rate */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Speed: {ttsRate}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => handleTtsRateChange(parseFloat(e.target.value))}
                    className="range range-primary range-sm" 
                    aria-label="Speech rate"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>

                {/* Pitch */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Pitch: {ttsPitch}</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => handleTtsPitchChange(parseFloat(e.target.value))}
                    className="range range-primary range-sm" 
                    aria-label="Speech pitch"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>Low</span>
                    <span>Normal</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Auto-Scroll Settings */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Auto-scroll Text</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span>Nonaktif</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={ttsAutoScroll}
                      onChange={toggleTtsAutoScroll}
                      aria-label="Toggle auto-scroll"
                    />
                    <span>Aktif</span>
                  </div>
                </div>

                {/* Scroll Position - Only show when auto-scroll is enabled */}
                {ttsAutoScroll && (
                  <div className="space-y-2 mt-2 pl-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Scroll Position</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary" 
                            checked={ttsScrollPosition === 'start'}
                            onChange={() => handleTtsScrollPositionChange('start')}
                            name="scroll-position"
                          />
                          <span>Start</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary" 
                            checked={ttsScrollPosition === 'center'}
                            onChange={() => handleTtsScrollPositionChange('center')}
                            name="scroll-position"
                          />
                          <span>Center</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Scroll Behavior</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary" 
                            checked={ttsScrollBehavior === 'smooth'}
                            onChange={() => handleTtsScrollBehaviorChange('smooth')}
                            name="scroll-behavior"
                          />
                          <span>Smooth</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary" 
                            checked={ttsScrollBehavior === 'auto'}
                            onChange={() => handleTtsScrollBehaviorChange('auto')}
                            name="scroll-behavior"
                          />
                          <span>Auto</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* After auto-scroll settings */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Auto-Play Chapter Berikutnya</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span>Nonaktif</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={ttsAutoPlay}
                      onChange={toggleTtsAutoPlay}
                      aria-label="Toggle auto-play next chapter"
                    />
                    <span>Aktif</span>
                  </div>
                </div>

                {/* Auto-play delay - Only show when auto-play is enabled */}
                {ttsAutoPlay && (
                  <div className="form-control mt-2 pl-2">
                    <label className="label">
                      <span className="label-text font-medium">Delay sebelum pindah: {ttsAutoPlayDelay} detik</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={ttsAutoPlayDelay}
                      onChange={(e) => handleTtsAutoPlayDelayChange(parseInt(e.target.value))}
                      className="range range-primary range-sm" 
                      aria-label="Auto-play delay"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>1s</span>
                      <span>5s</span>
                      <span>10s</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-base-300 flex justify-end">
            <button 
              onClick={onClose} 
              className="btn btn-primary"
              aria-label="Save and close settings"
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings; 