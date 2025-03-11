import { useState, useEffect, useCallback } from 'react';
import { supabase, Novel, NovelChapter } from '../lib/supabase';
import { trackChapterView } from '../lib/gtm';

interface UseChapterDataProps {
  id: string | string[] | undefined;
  chapter: string | string[] | undefined;
  chaptersPerPage: number;
}

interface UseChapterDataReturn {
  novel: Novel | null;
  chapterData: NovelChapter | null;
  prevChapter: number | null;
  nextChapter: number | null;
  loading: boolean;
  chapterList: {chapter: number, title: string}[];
  totalChapters: number;
  currentPage: number;
  fetchChapterPage: (page: number) => Promise<void>;
}

export const useChapterData = ({ 
  id, 
  chapter, 
  chaptersPerPage 
}: UseChapterDataProps): UseChapterDataReturn => {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapterData, setChapterData] = useState<NovelChapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<number | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapterList, setChapterList] = useState<{chapter: number, title: string}[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchChapterPage = useCallback(async (page: number) => {
    if (!novel?.id) return;
    
    try {
      const from = (page - 1) * chaptersPerPage;
      const to = from + chaptersPerPage - 1;
      
      const { data } = await supabase
        .from('novel_chapter')
        .select('chapter, title') // Only select needed columns, not the text content
        .eq('novel', novel.id)
        .order('chapter', { ascending: true })
        .range(from, to);
      
      if (data) {
        setChapterList(data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching chapter page:', error);
    }
  }, [novel?.id, chaptersPerPage]);

  useEffect(() => {
    const fetchChapterData = async () => {
      if (!id || !chapter) return;
      
      try {
        setLoading(true);
        
        // Fetch novel details - check if id is numeric (old ID) or string (new URL)
        let query = supabase.from('novel').select('*');
        
        // Check if id is numeric (old ID) or string (new URL)
        if (!isNaN(Number(id))) {
          query = query.eq('id', id);
        } else {
          query = query.eq('url', id);
        }
        
        const { data: novelData, error: novelError } = await query.single();

        if (novelError) throw novelError;
        
        if (novelData) {
          setNovel(novelData);
          
          // Fetch current chapter
          const { data: currentChapter, error: chapterError } = await supabase
            .from('novel_chapter')
            .select('*')
            .eq('novel', novelData.id)  // Always use the numeric ID for chapter queries
            .eq('chapter', chapter)
            .single();

          if (chapterError) throw chapterError;
          
          if (currentChapter) {
            setChapterData(currentChapter);
            
            // Track chapter view
            trackChapterView({
              id: currentChapter.id,
              novel_id: novelData.id,
              chapter: currentChapter.chapter,
              title: currentChapter.title
            });
            
            // Check for previous chapter
            const { data: prevChapterData } = await supabase
              .from('novel_chapter')
              .select('chapter')
              .eq('novel', novelData.id)
              .lt('chapter', chapter)
              .order('chapter', { ascending: false })
              .limit(1)
              .single();
            
            if (prevChapterData) {
              setPrevChapter(prevChapterData.chapter);
            }
            
            // Check for next chapter
            const { data: nextChapterData } = await supabase
              .from('novel_chapter')
              .select('chapter')
              .eq('novel', novelData.id)
              .gt('chapter', chapter)
              .order('chapter', { ascending: true })
              .limit(1)
              .single();
            
            if (nextChapterData) {
              setNextChapter(nextChapterData.chapter);
            }

            // Get total chapter count
            const { count } = await supabase
              .from('novel_chapter')
              .select('id', { count: 'exact', head: true })
              .eq('novel', novelData.id);
            
            if (count !== null) {
              setTotalChapters(count);
            }

            // Calculate which page the current chapter is on
            const chapterNum = parseInt(chapter as string);
            const calculatedPage = Math.ceil(chapterNum / chaptersPerPage);
            setCurrentPage(calculatedPage);

            // Fetch chapters for the current page
            await fetchChapterPage(calculatedPage);
          }
        }
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [id, chapter, chaptersPerPage, fetchChapterPage]);

  return {
    novel,
    chapterData,
    prevChapter,
    nextChapter,
    loading,
    chapterList,
    totalChapters,
    currentPage,
    fetchChapterPage
  };
}

export default useChapterData; 