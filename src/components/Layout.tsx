import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserSettings from './UserSettings';
import InstallPWA from './InstallPWA';

type LayoutProps = {
  children: React.ReactNode;
  isSettingsOpen?: boolean;
  setIsSettingsOpen?: (isOpen: boolean) => void;
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isSettingsOpen: externalIsSettingsOpen, 
  setIsSettingsOpen: externalSetIsSettingsOpen 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [internalIsSettingsOpen, setInternalIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Use either external or internal state for settings modal
  const isSettingsOpen = externalIsSettingsOpen !== undefined ? externalIsSettingsOpen : internalIsSettingsOpen;
  const setIsSettingsOpen = externalSetIsSettingsOpen || setInternalIsSettingsOpen;

  useEffect(() => {
    setMounted(true);
    // Initialize theme
    const initializeTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        setTheme(storedTheme as 'light' | 'dark');
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newTheme = systemDark ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }
    };

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    initializeTheme();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-content shadow-lg">
        <div className="navbar container mx-auto px-2 md:px-4">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-lg md:text-xl p-1 md:p-2">
              Novel Indo
            </Link>
          </div>
          
          <div className="flex-none">
            {/* Theme toggle */}
            <div className="flex items-center mr-2 md:mr-4">
              <label className="swap swap-rotate">
                <input 
                  type="checkbox" 
                  className="theme-controller" 
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
                <svg className="swap-on fill-current w-4 h-4 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
                <svg className="swap-off fill-current w-4 h-4 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
              </label>
            </div>
            
            <ul className="menu menu-horizontal px-0 md:px-1">
              <li>
                <Link href="/" className="px-2 md:px-4">
                  {isMobile ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  ) : (
                    "Home"
                  )}
                </Link>
              </li>
              <li>
                <Link href="/novels" className="px-2 md:px-4">
                  {isMobile ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ) : (
                    "Novels"
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-2 md:px-4 py-4 md:py-8">
        {children}
      </main>

      <footer className="footer footer-center p-2 md:p-4 bg-base-300 text-base-content text-xs md:text-sm">
        <div>
          <p>Copyright © 2024 - Novel Indo</p>
        </div>
      </footer>

      <UserSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <InstallPWA />
    </div>
  );
};

export default Layout; 