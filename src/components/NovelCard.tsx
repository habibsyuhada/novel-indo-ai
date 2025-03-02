import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Novel } from '../lib/supabase';

type NovelCardProps = {
  novel: Novel;
};

const NovelCard: React.FC<NovelCardProps> = ({ novel }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl h-full">
      <div className="card-body p-3 md:p-6">
        <h2 className="card-title text-lg md:text-xl">{novel.name}</h2>
        <div className="flex flex-wrap gap-1 md:gap-2">
          <p className="text-xs md:text-sm badge badge-outline">{novel.author}</p>
          <p className="text-xs md:text-sm badge badge-outline">{novel.genre}</p>
          <p className="text-xs md:text-sm badge badge-outline">{novel.status === 1 ? 'Ongoing' : 'Completed'}</p>
        </div>
        <p className="text-xs md:text-sm line-clamp-2 md:line-clamp-3 mt-2">{novel.description}</p>
        <div className="card-actions justify-end mt-2 md:mt-4">
          <Link href={`/novel/${novel.id}`} className="btn btn-primary btn-sm md:btn-md">
            {isMobile ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            ) : (
              "Read Now"
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NovelCard; 