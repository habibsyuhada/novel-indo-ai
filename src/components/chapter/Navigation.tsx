import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  List, 
  Settings,
  ArrowLeft,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Novel } from '../../lib/supabase';

interface NavProps {
  prevChapter: number | null;
  nextChapter: number | null;
  novel: Novel;
  onListClick: () => void;
  onSettingsClick: () => void;
}

interface NavigationProps extends NavProps {
  isMobile: boolean;
}

const DesktopNavigation = ({
  prevChapter,
  nextChapter,
  novel,
  onListClick,
  onSettingsClick
}: NavProps) => {
  return (
    <div className="w-12 flex-none">
      <div className="fixed flex flex-col gap-2 p-2 bg-base-200 rounded-l-xl shadow-lg right-0">
        <div className="space-y-2">
          {prevChapter ? (
            <Link 
              href={`/novel/${novel.url || novel.id}/chapter/${prevChapter}`}
              className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
              aria-label="Chapter sebelumnya"
              title="Chapter Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          ) : (
            <button 
              className="btn btn-circle btn-sm btn-ghost opacity-50" 
              disabled 
              title="Tidak ada chapter sebelumnya"
            >
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
              aria-label="Kembali ke novel"
              title="Kembali ke Novel"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={onListClick}
              className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
              aria-label="Tampilkan daftar chapter"
              title="Daftar Chapter"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={onSettingsClick}
              className="btn btn-circle btn-sm btn-ghost hover:bg-base-100"
              aria-label="Buka pengaturan"
              title="Pengaturan"
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
              aria-label="Chapter berikutnya"
              title="Chapter Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <button 
              className="btn btn-circle btn-sm btn-ghost opacity-50" 
              disabled 
              title="Tidak ada chapter berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MobileNavigation = ({
  prevChapter,
  nextChapter,
  novel,
  onListClick,
  onSettingsClick
}: NavProps) => {
  return (
    <div className="btm-nav btm-nav-sm fixed bottom-0 z-50 bg-base-100 border-t border-base-300 shadow-lg">
      {prevChapter ? (
        <Link 
          href={`/novel/${novel.url || novel.id}/chapter/${prevChapter}`}
          className="text-base-content"
          aria-label="Chapter sebelumnya"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span className="btm-nav-label text-xs">Prev</span>
        </Link>
      ) : (
        <button 
          className="text-base-content opacity-50" 
          disabled 
          aria-label="Tidak ada chapter sebelumnya"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span className="btm-nav-label text-xs">Prev</span>
        </button>
      )}
      
      <Link 
        href={`/novel/${novel.url || novel.id}`}
        className="text-base-content"
        aria-label="Kembali ke novel"
      >
        <BookOpen className="w-5 h-5" aria-hidden="true" />
        <span className="btm-nav-label text-xs">Novel</span>
      </Link>
      
      <button 
        onClick={onListClick}
        className="text-base-content"
        aria-label="Tampilkan daftar chapter"
      >
        <List className="w-5 h-5" aria-hidden="true" />
        <span className="btm-nav-label text-xs">Chapters</span>
      </button>
      
      <button 
        onClick={onSettingsClick}
        className="text-base-content"
        aria-label="Buka pengaturan"
      >
        <Settings className="w-5 h-5" aria-hidden="true" />
        <span className="btm-nav-label text-xs">Settings</span>
      </button>
      
      {nextChapter ? (
        <Link 
          href={`/novel/${novel.url || novel.id}/chapter/${nextChapter}`}
          className="text-base-content"
          aria-label="Chapter berikutnya"
        >
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
          <span className="btm-nav-label text-xs">Next</span>
        </Link>
      ) : (
        <button 
          className="text-base-content opacity-50" 
          disabled 
          aria-label="Tidak ada chapter berikutnya"
        >
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
          <span className="btm-nav-label text-xs">Next</span>
        </button>
      )}
    </div>
  );
};

const Navigation = ({
  prevChapter,
  nextChapter,
  novel,
  isMobile,
  onListClick,
  onSettingsClick
}: NavigationProps) => {
  if (isMobile) {
    return (
      <MobileNavigation
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        novel={novel}
        onListClick={onListClick}
        onSettingsClick={onSettingsClick}
      />
    );
  }

  return (
    <DesktopNavigation
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      novel={novel}
      onListClick={onListClick}
      onSettingsClick={onSettingsClick}
    />
  );
};

export default Navigation; 