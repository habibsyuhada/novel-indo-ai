import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserSettings from './UserSettings';

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
  const [theme, setTheme] = useState<string>('light');
  const [isMobile, setIsMobile] = useState(false);
  const [internalIsSettingsOpen, setInternalIsSettingsOpen] = useState(false);

  // Use either external or internal state for settings modal
  const isSettingsOpen = externalIsSettingsOpen !== undefined ? externalIsSettingsOpen : internalIsSettingsOpen;
  const setIsSettingsOpen = externalSetIsSettingsOpen || setInternalIsSettingsOpen;

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      localStorage.setItem('theme', systemTheme); // Save the initial theme
    }
    
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
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
    </div>
  );
};

export default Layout; 