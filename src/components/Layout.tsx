import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserSettings from './UserSettings';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { toggleSettings, setTheme } from '../store/settingsSlice';
import { Moon, Sun, History, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// import InstallPWA from './InstallPWA';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const { isSettingsOpen, theme } = useSelector((state: RootState) => state.settings);
  const { user, signOut } = useAuth();

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

  const textColorClass = theme === 'light'
    ? 'text-white hover:text-white/90'
    : 'text-[#e5e7eb] hover:text-[#e5e7eb]/90';

  const displayName = user?.name || user?.email || '';

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`bg-primary shadow-lg ${theme === 'light' ? 'text-white' : 'text-[#e5e7eb]'}`}>
        <div className="navbar container mx-auto px-2 md:px-4 gap-1">
          <div className="flex-1 min-w-0">
            <Link
              href="/"
              className={`btn btn-ghost text-sm sm:text-lg md:text-xl px-1 sm:px-2 max-w-full truncate ${textColorClass}`}
            >
              Baca Novel Indo
            </Link>
          </div>

          <div className="flex-none flex items-center gap-0.5 sm:gap-2">
            {user ? (
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className={`btn btn-ghost btn-circle btn-sm sm:btn-md ${textColorClass}`}
                  aria-label="Menu akun"
                >
                  <div className="bg-base-100 text-base-content rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-semibold text-xs sm:text-sm">
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </div>
                </label>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[60] p-2 shadow-lg bg-base-100 text-base-content rounded-box w-56"
                >
                  <li className="menu-title px-2">
                    <span className="truncate block">{displayName}</span>
                  </li>
                  <li>
                    <Link href="/riwayat">
                      <History className="w-4 h-4" />
                      Riwayat Baca
                    </Link>
                  </li>
                  {user.isAdmin && (
                    <li>
                      <Link href="/admin/comments">
                        <ShieldCheck className="w-4 h-4" />
                        Admin
                      </Link>
                    </li>
                  )}
                  <li>
                    <button onClick={() => signOut()}>Keluar</button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`btn btn-ghost btn-xs sm:btn-sm md:btn-md px-2 ${textColorClass}`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`btn btn-ghost btn-xs sm:btn-sm md:btn-md px-2 ${textColorClass}`}
                >
                  Daftar
                </Link>
              </>
            )}

            {/* Theme toggle */}
            <button
              onClick={handleToggleTheme}
              className={`btn btn-ghost btn-circle btn-sm sm:btn-md ${textColorClass}`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
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
