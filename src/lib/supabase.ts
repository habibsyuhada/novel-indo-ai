import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const storage_url = process.env.NEXT_PUBLIC_STORAGE_URL!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get public URL for cover images
export function getCoverUrl(cover?: string | null) {
  const base = storage_url ?? "https://storage.bacanovelindo.click";
  const cleanBase = base.replace(/\/$/, "");

  if (!cover) return "/images/placeholder-cover.png"; // taruh file ini di /public/images/
  const cleanCover = cover.replace(/^\//, "");

  return `${cleanBase}/novel-covers/${cleanCover}`;
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