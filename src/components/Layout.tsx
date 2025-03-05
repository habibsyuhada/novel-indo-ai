import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserSettings from './UserSettings';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { toggleSettings, setTheme } from '../store/settingsSlice';
import { Moon, Sun } from 'lucide-react';
// import InstallPWA from './InstallPWA';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { isSettingsOpen, theme } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    setMounted(true);
    // Initialize theme
    const initializeTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        dispatch(setTheme(storedTheme as 'light' | 'dark'));
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemDark ? 'dark' : 'light';
        dispatch(setTheme(newTheme));
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }
    };
    
    initializeTheme();
  }, [dispatch]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`bg-primary shadow-lg ${theme === 'light' ? 'text-white' : 'text-[#e5e7eb]'}`}>
        <div className="navbar container mx-auto px-2 md:px-4">
          <div className="flex-1">
            <Link 
              href="/" 
              className={`btn btn-ghost text-lg md:text-xl p-1 md:p-2 ${
                theme === 'light' 
                  ? 'text-white hover:text-white/90' 
                  : 'text-[#e5e7eb] hover:text-[#e5e7eb]/90'
              }`}
            >
              Baca Novel Indo
            </Link>
          </div>
          
          <div className="flex-none">
            {/* Theme toggle */}
            <button 
              onClick={handleToggleTheme}
              className={`btn btn-ghost btn-circle ${
                theme === 'light' 
                  ? 'text-white hover:text-white/90' 
                  : 'text-[#e5e7eb] hover:text-[#e5e7eb]/90'
              }`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main 
        className="flex-grow container mx-auto px-2 md:px-4 py-4 md:py-8"
        role="main"
      >
        {children}
      </main>

      <footer className="footer footer-center p-2 md:p-4 bg-base-300 text-base-content text-xs md:text-sm">
        <div>
          <p>Copyright © 2024 - Baca Novel Indo</p>
        </div>
      </footer>

      <UserSettings 
        isOpen={isSettingsOpen} 
        onClose={() => dispatch(toggleSettings())} 
      />
      {/* <InstallPWA /> */}
    </div>
  );
};

export default Layout; 