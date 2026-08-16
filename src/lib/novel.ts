const storage_url = process.env.NEXT_PUBLIC_STORAGE_URL!;

// Helper function to get public URL for cover images
export function getCoverUrl(cover?: string | null) {
  const base = storage_url ?? "https://storage.bacanovelindo.click";
  const cleanBase = base.replace(/\/$/, "");

  if (!cover) return "/images/placeholder-cover.png"; // taruh file ini di /public/images/
  const cleanCover = cover.replace(/^\//, "");

  return `${cleanBase}/novel-covers/${cleanCover}`;
}

export function getIllustrationUrl(novelId?: number | null, chapterNumber?: number | null, filename?: string | null) {
  const base = storage_url ?? "https://storage.bacanovelindo.click";
  const cleanBase = base.replace(/\/$/, "");

  if (!filename) return "/images/placeholder-cover.png"; // taruh file ini di /public/images/
  const cleanFilename = filename.replace(/^\//, "");

  return `${cleanBase}/novel-illustration/${novelId}/${chapterNumber}/${cleanFilename}`;
}

export type Novel = {
  id: number;
  name: string;
  author: string;
  description: string | null;
  genre: string;
  tag: string | null;
  status: number;
  year: string;
  publishers: string | null;
  cover: string | null;
  url: string | null;
  created_at: string;
  updated_date: string;
};

export type NovelChapter = {
  id: number;
  novel: number;
  chapter: number;
  title: string;
  text: string;
};
