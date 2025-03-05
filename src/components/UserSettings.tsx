import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setFontSize, setTheme } from '../store/settingsSlice';
import { X } from 'lucide-react';

type UserSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const dispatch = useDispatch();
  const { fontSize, theme } = useSelector((state: RootState) => state.settings);

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
    }
  }, [dispatch]);

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

  if (!isOpen) return null;

  return (
    <div className="drawer drawer-end fixed inset-0 z-50">
      <input id="settings-drawer" type="checkbox" className="drawer-toggle" checked={isOpen} readOnly />
      <div className="drawer-side">
        <label htmlFor="settings-drawer" className="drawer-overlay" onClick={onClose}></label>
        <div className={`bg-base-100 h-full flex flex-col ${isMobile ? 'w-full' : 'w-[320px] shadow-xl'}`}>
          <div className="p-4 border-b border-base-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">User Settings</h2>
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
            
            {/* Reading Tips */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Reading Tips</span>
              </label>
              <div className="text-xs text-base-content/70 p-2 bg-info bg-opacity-20 rounded">
                <p className="font-medium mb-1">Chrome Mobile Users:</p>
                <p>To listen to any page, tap the three dots menu, then select &ldquo;Listen to this page&rdquo;.</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-base-300 flex justify-end">
            <button 
              onClick={onClose} 
              className="btn btn-primary"
              aria-label="Save and close settings"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings; 