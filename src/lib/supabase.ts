import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Novel = {
  id: number;
  name: string;
  author: string;
  genre: string;
  status: number;
  publishers: string;
  tag: string;
  year: number;
  description: string;
};

export type NovelChapter = {
  id: number;
  novel: number;
  chapter: number;
  title: string;
  text: string;
}; 