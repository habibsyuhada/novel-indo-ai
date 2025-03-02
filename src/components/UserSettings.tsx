import React, { useEffect, useState } from 'react';

type UserSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<string>('light');
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

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
        setFontSize(parseInt(savedFontSize));
      }

      // Load theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }

      // Load speech rate
      const savedSpeechRate = localStorage.getItem('speechRate');
      if (savedSpeechRate) {
        setSpeechRate(parseFloat(savedSpeechRate));
      }

      // Load voices
      if (window.speechSynthesis) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
          
          // Load selected voice index
          const savedVoiceIndex = localStorage.getItem('selectedVoiceIndex');
          if (savedVoiceIndex && voices.length > 0) {
            const index = parseInt(savedVoiceIndex);
            if (index < voices.length) {
              setSelectedVoiceIndex(index);
            }
          }
        };
        
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // For Firefox
      }
    }
  }, []);

  // Font size handlers
  const increaseFontSize = () => {
    if (fontSize < 24) {
      const newSize = fontSize + 1;
      setFontSize(newSize);
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 14) {
      const newSize = fontSize - 1;
      setFontSize(newSize);
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  // Theme handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Speech rate handler
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(e.target.value);
    setSpeechRate(newRate);
    localStorage.setItem('speechRate', newRate.toString());
  };

  // Voice handler
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    setSelectedVoiceIndex(index);
    localStorage.setItem('selectedVoiceIndex', index.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-base-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">User Settings</h2>
            <button onClick={onClose} className="btn btn-sm btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
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
                  setFontSize(newSize);
                  localStorage.setItem('fontSize', newSize.toString());
                }}
                className="range range-primary range-sm flex-1" 
              />
              <button 
                onClick={increaseFontSize} 
                className="btn btn-sm btn-outline"
                disabled={fontSize >= 24}
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
            
            {/* Voice Selection */}
            {availableVoices.length > 0 && (
              <div className="mb-2">
                <label className="label py-0">
                  <span className="label-text text-sm">Voice</span>
                </label>
                <select 
                  className="select select-bordered select-sm w-full" 
                  value={selectedVoiceIndex}
                  onChange={handleVoiceChange}
                >
                  {availableVoices.map((voice, index) => (
                    <option key={index} value={index}>
                      {isMobile ? voice.name : `${voice.name} (${voice.lang})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Speech Rate */}
            <div>
              <label className="label py-0">
                <span className="label-text text-sm">Speech Rate: {speechRate}x</span>
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={speechRate} 
                onChange={handleRateChange}
                className="range range-primary range-sm w-full" 
              />
            </div>

            {/* Text-to-Speech Controls Info */}
            <div className="mt-2 text-xs text-base-content/70">
              <p>While reading, you can:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Pause/Resume reading at any time</li>
                <li>Stop reading to reset to the beginning</li>
                <li>See highlighted text that&apos;s currently being read</li>
                <li>Click any paragraph to start reading from that point</li>
                <li>Lock your screen and continue listening (screen will stay awake)</li>
                <li>Adjust voice and speed in these settings</li>
              </ul>
              
              <div className="mt-2 p-2 bg-info bg-opacity-20 rounded">
                <p className="font-medium">Android Users:</p>
                <p>For best results, keep your screen on while using text-to-speech. Android may restrict background audio in some cases.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-base-300 flex justify-end">
          <button onClick={onClose} className="btn btn-primary">
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings; 