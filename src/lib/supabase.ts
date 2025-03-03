import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Novel = {
  id: number;
  name: string;
  description: string;
  author: string;
  genre: string;
  tag: string;
  status: number;
  publishers: string;
  year: string;
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