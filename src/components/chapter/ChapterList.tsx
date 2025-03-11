import Link from 'next/link';
import { X } from 'lucide-react';

interface ChapterItem {
  chapter: number;
  title: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface ChapterListProps {
  showChapterList: boolean;
  onClose: () => void;
  chapterList: ChapterItem[];
  currentChapter: string | string[] | undefined;
  novelId: string | number;
  novelUrl?: string;
  isMobile: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // First page
  if (startPage > 1) {
    pages.push(
      <button 
        key="first" 
        className="btn btn-sm" 
        onClick={() => onPageChange(1)}
        aria-label="Halaman pertama"
      >
        1
      </button>
    );
    
    if (startPage > 2) {
      pages.push(<span key="ellipsis1" className="px-2">...</span>);
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button 
        key={i} 
        className={`btn btn-sm ${currentPage === i ? 'btn-primary' : ''}`} 
        onClick={() => onPageChange(i)}
        aria-label={`Halaman ${i}`}
        aria-current={currentPage === i ? "page" : undefined}
      >
        {i}
      </button>
    );
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(<span key="ellipsis2" className="px-2">...</span>);
    }
    
    pages.push(
      <button 
        key="last" 
        className="btn btn-sm" 
        onClick={() => onPageChange(totalPages)}
        aria-label="Halaman terakhir"
      >
        {totalPages}
      </button>
    );
  }
  
  return (
    <div className="flex flex-wrap justify-center gap-1 my-4">
      <button 
        className="btn btn-sm" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
      >
        «
      </button>
      {pages}
      <button 
        className="btn btn-sm" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Halaman berikutnya"
      >
        »
      </button>
    </div>
  );
};

const ChapterList = ({ 
  showChapterList, 
  onClose, 
  chapterList, 
  currentChapter,
  novelId, 
  novelUrl,
  isMobile,
  currentPage,
  totalPages,
  onPageChange
}: ChapterListProps) => {
  if (!showChapterList) return null;

  return (
    <div className="drawer drawer-end fixed inset-0 z-50">
      <input 
        id="chapter-drawer" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={showChapterList} 
        readOnly 
      />
      <div className="drawer-side">
        <label 
          htmlFor="chapter-drawer" 
          className="drawer-overlay" 
          onClick={onClose}
        ></label>
        <div className={`bg-base-100 h-full flex flex-col ${isMobile ? 'w-full' : 'w-[480px] shadow-xl'}`}>
          <div className="p-4 border-b border-base-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Daftar Chapter</h2>
              <button 
                onClick={onClose} 
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="Tutup daftar chapter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            <ul className="menu menu-compact w-full">
              {chapterList.map((item) => (
                <li key={item.chapter}>
                  <Link 
                    href={`/novel/${novelUrl || novelId}/chapter/${item.chapter}`}
                    className={parseInt(currentChapter as string) === item.chapter ? "active" : ""}
                    onClick={onClose}
                  >
                    <span className="font-medium">Chapter {item.chapter}</span>
                    <span className="text-sm truncate">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-2 border-t border-base-300">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={onPageChange} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterList; 