import Link from 'next/link';
import Image from 'next/image';
import { Novel, getStorageUrl } from '../lib/supabase';

type NovelCardProps = {
  novel: Novel;
};

export default function NovelCard({ novel }: NovelCardProps) {
  // Format genre list
  const genres = novel.genre.split(';').filter(g => g.trim() !== '');
  const coverUrl = novel.cover ? getStorageUrl(novel.cover) : null;
  
  // Use URL if available, otherwise fallback to ID
  const novelLink = novel.url ? `/novel/${novel.url}` : `/novel/${novel.id}`;

  return (
    <Link href={novelLink} className="card bg-base-100 hover:shadow-xl transition-shadow duration-200">
      <figure className="relative aspect-[3/4]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover of ${novel.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
          />
        ) : (
          <div className="w-full h-full bg-base-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`badge ${novel.status === 1 ? 'badge-warning' : 'badge-success'}`}>
            {novel.status === 1 ? 'Ongoing' : 'Completed'}
          </span>
        </div>
      </figure>
      
      <div className="card-body p-3">
        <h2 className="card-title text-base line-clamp-2">{novel.name}</h2>
        <p className="text-sm text-base-content/70 line-clamp-1">{novel.author}</p>
        
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 2).map((genre) => (
              <span key={genre} className="badge badge-sm badge-primary">{genre}</span>
            ))}
            {genres.length > 2 && (
              <span className="badge badge-sm">+{genres.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
} 