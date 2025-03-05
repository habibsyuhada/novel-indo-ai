import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch all novels
    const { data: novels, error: novelsError } = await supabase
      .from('novel')
      .select('id, url, updated_at');

    if (novelsError) throw novelsError;

    // Fetch all chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('novel_chapter')
      .select('novel, chapter, updated_at');

    if (chaptersError) throw chaptersError;

    // Set the appropriate header
    res.setHeader('Content-Type', 'text/xml');
    
    // Create sitemap XML
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click';
    
    // Generate sitemap content
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home page -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Novel pages -->
  ${novels.map(novel => `
  <url>
    <loc>${baseUrl}/novel/${novel.url || novel.id}</loc>
    <lastmod>${novel.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Chapter pages -->
  ${chapters.map(chapter => `
  <url>
    <loc>${baseUrl}/novel/${chapter.novel}/chapter/${chapter.chapter}</loc>
    <lastmod>${chapter.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

    // Send the sitemap
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
} 