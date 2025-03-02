import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import NovelCard from '../components/NovelCard';
import { supabase, Novel } from '../lib/supabase';

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('novel')
          .select('*')
          .order('id', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        if (data) {
          console.log(data);
          setNovels(data);
          setFilteredNovels(data);
        }
      } catch (error) {
        console.error('Error fetching novels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNovels(novels);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = novels.filter(
        novel => 
          novel.name.toLowerCase().includes(term) || 
          novel.author.toLowerCase().includes(term) || 
          novel.genre.toLowerCase().includes(term) ||
          (novel.tag && novel.tag.toLowerCase().includes(term))
      );
      setFilteredNovels(filtered);
    }
  }, [searchTerm, novels]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Layout>
      <Head>
        <title>Novel Indo - Read Your Favorite Novels</title>
        <meta name="description" content="Read your favorite novels online" />
      </Head>

      <div className="text-center mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Welcome to Novel Indo</h1>
        <p className="text-base md:text-xl">Discover and read your favorite novels online</p>
      </div>

      <div className="mb-6 md:mb-8">
        <div className="form-control mb-4 md:mb-6">
          <div className="input-group w-full">
            <input 
              type="text" 
              placeholder={isMobile ? "Search novels..." : "Search novels by title, author, genre..."} 
              className="input input-bordered input-sm md:input-md w-full" 
              value={searchTerm}
              onChange={handleSearch}
            />
            <button className="btn btn-square btn-sm md:btn-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
          {searchTerm ? 'Search Results' : 'Latest Novels'}
        </h2>
        
        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-md md:loading-lg"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredNovels.length > 0 ? (
              filteredNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))
            ) : (
              <p className="col-span-3 text-center">
                {searchTerm ? 'No novels found matching your search.' : 'No novels found.'}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
