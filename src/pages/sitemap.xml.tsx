import { GetServerSideProps } from 'next';
import { supabase } from '../lib/supabase';

const Sitemap = () => {
  // This component doesn't need to render anything
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Fetch all novels
    const { data: novels, error: novelsError } = await supabase
      .from('novel')
      .select('id, url, updated_date');

    if (novelsError) throw novelsError;

    // Fetch all chapters with novel URL information
    const { data: chapters, error: chaptersError } = await supabase
      .from('novel_chapter')
      .select(`
        novel,
        chapter,
        created_date
      `);

    if (chaptersError) throw chaptersError;

    // Create a lookup map for novel URLs
    const novelUrlMap = new Map();
    if (novels) {
      novels.forEach(novel => {
        novelUrlMap.set(novel.id, novel.url || novel.id);
      });
    }

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
    <lastmod>${novel.updated_date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
</urlset>`;

    // Send the sitemap
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return {
      props: {},
    };
  }
};

export default Sitemap; 