import Head from 'next/head';
import { useRouter } from 'next/router';

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  keywords?: string;
  author?: string;
};

export default function SEO({
  title = 'Baca Novel Indo - Baca Novel Indonesia Online',
  description = 'Baca novel Indonesia dan terjemahan secara online. Temukan novel favorit Anda dengan berbagai genre seperti romance, fantasy, action, dan lainnya.',
  image = '/images/og-image.jpg',
  article = false,
  keywords = 'novel indonesia, baca novel online, novel terjemahan, novel romance, novel fantasy',
  author = 'Baca Novel Indo',
}: SEOProps) {
  const router = useRouter();
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}${router.asPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}${image}`} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}${image}`} />
    </Head>
  );
} 