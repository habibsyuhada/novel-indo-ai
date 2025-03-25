import Link from 'next/link';
import Image from 'next/image';
import { Novel, getStorageUrl } from '../lib/supabase';
import { formatDistanceToNow, parseISO } from 'date-fns';

type NovelCardProps = {
  novel: Novel;
  totalChapters?: number;
};

export default function NovelCard({ novel, totalChapters = 0 }: NovelCardProps) {
  const coverUrl = novel.cover ? getStorageUrl(novel.cover) : null;
  
  // Use URL if available, otherwise fallback to ID
  const novelLink = novel.url ? `/novel/${novel.url}` : `/novel/${novel.id}`;

	const getRelativeTime = (dateString: string) => {  
    const date = parseISO(dateString); // Mengonversi string tanggal ke objek Date  
    return formatDistanceToNow(date, { addSuffix: true }); // Menghitung waktu relatif  
	};



  return (
    <Link href={novelLink} className="card bg-base-100 hover:shadow-xl transition-shadow duration-200">
      <div className="flex">
        {/* Cover Image - Left Side */}
        <div className="w-32 relative aspect-[3/4]">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Cover of ${novel.name}`}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full bg-base-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-base-content/30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
          )}
        </div>

        {/* Text Content - Right Side */}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${novel.status === 0 ? 'badge-warning' : 'badge-success'}`}>
              {novel.status === 0 ? 'Ongoing' : 'Completed'}
            </span>
          </div>
          
          <h2 className="card-title text-lg line-clamp-2 mb-2">{novel.name}</h2>
          
          <p className="text-sm text-primary mb-3">
            {totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}
          </p>
					
					<p className="text-sm text-primary">
            Last Updated:<br/>{getRelativeTime(novel.updated_date)}
          </p>
        </div>
      </div>
    </Link>
  );
} 