import { useState, useEffect, useCallback } from "react";
import type { Novel, NovelChapter } from "../lib/supabase";
import { trackChapterView } from "../lib/gtm";

interface UseChapterDataProps {
  id: string | string[] | undefined;        // route param: id atau url slug
  chapter: string | string[] | undefined;   // route param chapter number
  chaptersPerPage: number;
}

interface UseChapterDataReturn {
  novel: Novel | null;
  chapterData: NovelChapter | null;
  prevChapter: number | null;
  nextChapter: number | null;
  loading: boolean;
  chapterList: { chapter: number; title: string }[];
  totalChapters: number;
  currentPage: number;
  fetchChapterPage: (page: number) => Promise<void>;
}

type ChaptersPageApiResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: { chapter: number; title: string }[];
};

type ChapterDetailApiResponse = {
  chapterData: NovelChapter;
  prevChapter: number | null;
  nextChapter: number | null;
};

const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export const useChapterData = ({
  id,
  chapter,
  chaptersPerPage,
}: UseChapterDataProps): UseChapterDataReturn => {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapterData, setChapterData] = useState<NovelChapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<number | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [chapterList, setChapterList] = useState<{ chapter: number; title: string }[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchChapterPage = useCallback(
    async (page: number) => {
      if (!novel?.id) return;

      const r = await fetch(
        `/api/novels/${novel.id}/chapters?page=${page}&limit=${chaptersPerPage}`
      );
      if (!r.ok) throw new Error(`Chapters page API error: ${r.status}`);

      const json = (await r.json()) as ChaptersPageApiResponse;

      setChapterList(json.data);
      setTotalChapters(json.total);
      setCurrentPage(json.page);
    },
    [novel?.id, chaptersPerPage]
  );

  useEffect(() => {
    const run = async () => {
      const idParam = asString(id);
      const chapterParam = asString(chapter);
      if (!idParam || !chapterParam) return;

      try {
        setLoading(true);

        // 1) fetch novel detail (endpoint ini harus support numeric id atau url)
        const novelRes = await fetch(`/api/novels/${encodeURIComponent(idParam)}`);
        if (!novelRes.ok) throw new Error(`Novel API error: ${novelRes.status}`);
        const novelData = (await novelRes.json()) as Novel;
        setNovel(novelData);

        // 2) fetch chapter detail + prev/next (pakai numeric novel id)
        const chapRes = await fetch(
          `/api/novels/${novelData.id}/chapters/${encodeURIComponent(chapterParam)}`
        );
        if (!chapRes.ok) throw new Error(`Chapter API error: ${chapRes.status}`);
        const chapJson = (await chapRes.json()) as ChapterDetailApiResponse;

        setChapterData(chapJson.chapterData);
        setPrevChapter(chapJson.prevChapter);
        setNextChapter(chapJson.nextChapter);

        // track
        trackChapterView({
          id: chapJson.chapterData.id,
          novel_id: novelData.id,
          chapter: chapJson.chapterData.chapter,
          title: chapJson.chapterData.title,
        });

        // 3) hitung page dari nomor chapter (asumsi chapter mulai dari 1 dan kontigu)
        const chapNum = parseInt(chapterParam, 10);
        const page = Math.max(Math.ceil(chapNum / chaptersPerPage), 1);
        setCurrentPage(page);

        // 4) fetch list untuk page itu (juga sekalian dapat totalChapters)
        await fetchChapterPage(page);
      } catch (e) {
        console.error("Error fetching chapter data:", e);
        setNovel(null);
        setChapterData(null);
        setPrevChapter(null);
        setNextChapter(null);
        setChapterList([]);
        setTotalChapters(0);
        setCurrentPage(1);
      } finally {
        setLoading(false);
      }
    };

    run();
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
    fetchChapterPage,
  };
};

export default useChapterData;
