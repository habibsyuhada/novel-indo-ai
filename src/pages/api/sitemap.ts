import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const novelsResult = await pool.query<{ id: number; url: string | null; updated_date: string }>(
      'SELECT id, url, updated_date FROM novel'
    );
    const chaptersResult = await pool.query<{ novel: number; chapter: number; created_date: string }>(
      'SELECT novel, chapter, created_date FROM novel_chapter'
    );

    const novels = novelsResult.rows;
    const chapters = chaptersResult.rows;

    // Set the appropriate header
    res.setHeader('Content-Type', 'text/xml');

    // Create sitemap XML
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bacanovelindo.click';

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
    <lastmod>${novel.updated_date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Chapter pages -->
  ${chapters.map(chapter => `
  <url>
    <loc>${baseUrl}/novel/${chapter.novel}/chapter/${chapter.chapter}</loc>
    <lastmod>${chapter.created_date}</lastmod>
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