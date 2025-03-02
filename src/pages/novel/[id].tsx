import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase, Novel } from '../../lib/supabase';

// Buat tipe baru untuk daftar chapter yang tidak memerlukan semua properti NovelChapter
type ChapterListItem = {
  id: number;
  chapter: number;
  title: string;
};

export default function NovelDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovelAndChapters = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch novel details
        const { data: novelData, error: novelError } = await supabase
          .from('novel')
          .select('*')
          .eq('id', id)
          .single();

        if (novelError) throw novelError;
        
        if (novelData) {
          setNovel(novelData);
          
          // Fetch chapters
          const { data: chaptersData, error: chaptersError } = await supabase
            .from('novel_chapter')
            .select('id, chapter, title')
            .eq('novel', id)
            .order('chapter', { ascending: true });

          if (chaptersError) throw chaptersError;
          
          if (chaptersData) {
            setChapters(chaptersData as ChapterListItem[]);
          }
        }
      } catch (error) {
        console.error('Error fetching novel details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovelAndChapters();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  if (!novel) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Novel not found</h1>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{novel.name} - Novel Indo</title>
        <meta name="description" content={novel.description} />
      </Head>

      <div className="mb-8">
        <Link href="/" className="btn btn-ghost mb-4">
          ← Back to Home
        </Link>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl">{novel.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p><span className="font-bold">Author:</span> {novel.author}</p>
                <p><span className="font-bold">Genre:</span> {novel.genre}</p>
                <p><span className="font-bold">Status:</span> {novel.status === 1 ? 'Ongoing' : 'Completed'}</p>
                <p><span className="font-bold">Publisher:</span> {novel.publishers}</p>
                <p><span className="font-bold">Year:</span> {novel.year}</p>
                <p><span className="font-bold">Tags:</span> {novel.tag}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Description</h3>
                <p className="whitespace-pre-line">{novel.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Chapters</h2>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {chapters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {chapters.map((chapter) => (
                  <Link 
                    key={chapter.id} 
                    href={`/novel/${novel.id}/chapter/${chapter.chapter}`}
                    className="btn btn-outline"
                  >
                    Chapter {chapter.chapter}: {chapter.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center">No chapters available yet.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 