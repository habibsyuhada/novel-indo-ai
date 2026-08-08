import { GetServerSideProps } from 'next';
import { pool } from '@/lib/db';

const Sitemap = () => {
  // This component doesn't need to render anything
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const novelsResult = await pool.query<{ id: number; url: string | null; updated_date: string }>(
      'SELECT id, url, updated_date FROM novel'
    );
    const novels = novelsResult.rows;

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
