import Link from 'next/link';
import Image from 'next/image';
import { Novel } from '../lib/supabase';

interface NovelCardProps {
  novel: Novel;
}

const NovelCard: React.FC<NovelCardProps> = ({ novel }) => {
  // Format genre list
  const genres = novel.genre ? novel.genre.split(';').filter(g => g.trim()) : [];

  return (
    <Link href={`/novel/${novel.id}`} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <figure className="relative aspect-[3/4] w-full">
        {novel.cover ? (
          <Image
            src={novel.cover}
            alt={`Cover of ${novel.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-base-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`badge ${novel.status === 1 ? 'badge-warning' : 'badge-success'}`}>
            {novel.status === 1 ? 'Ongoing' : 'Completed'}
          </span>
        </div>
      </figure>
      
      <div className="card-body p-4">
        <h2 className="card-title text-lg leading-tight line-clamp-2">{novel.name}</h2>
        
        <div className="flex items-center gap-1 text-sm text-base-content/70">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>{novel.author || 'Unknown'}</span>
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 3).map((genre, index) => (
              <span key={index} className="badge badge-sm badge-primary">{genre}</span>
            ))}
            {genres.length > 3 && (
              <span className="badge badge-sm">+{genres.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default NovelCard; 