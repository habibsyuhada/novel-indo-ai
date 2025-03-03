import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get public URL for cover images
export const getStorageUrl = (path: string | null): string => {
  if (!path) return ''; // Return empty string or you could return a default cover image URL
  
  // If the path already contains the full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // For relative paths, just use the path as is since Supabase will handle the bucket path
  return supabase.storage.from('novel').getPublicUrl(path).data.publicUrl;
};

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
  created_at: string;
  updated_at: string;
};

export type NovelChapter = {
  id: number;
  novel: number;
  chapter: number;
  title: string;
  text: string;
}; 