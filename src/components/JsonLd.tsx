import { Novel } from '../lib/supabase';
import { useEffect, useState } from 'react';
import Script from 'next/script';

type JsonLdProps = {
  type: 'website' | 'article' | 'book' | 'breadcrumb';
  data: any;
  id?: string; // Optional ID prop
};

export default function JsonLd({ type, data, id }: JsonLdProps) {
  // Use state to ensure the component only renders on client-side
  const [jsonLdText, setJsonLdText] = useState<string>('');
  
  // Use the provided id or generate a stable one
  const scriptId = id || `json-ld-${type}-${typeof data.url === 'string' ? data.url.replace(/[^\w]/g, '-') : ''}`;
  
  useEffect(() => {
    // Generate the JSON-LD object based on the type
    let jsonLd = {};

    switch (type) {
      case 'website':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: data.url,
          name: data.name,
          description: data.description,
        };
        break;
      case 'book':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: data.name,
          author: {
            '@type': 'Person',
            name: data.author,
          },
          description: data.description,
          genre: data.genre,
          publisher: data.publisher,
          url: data.url,
          image: data.image,
        };
        break;
      case 'article':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title,
          description: data.description,
          author: {
            '@type': 'Person',
            name: data.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Novel Indo',
            logo: {
              '@type': 'ImageObject',
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}/icons/icon-192x192.png`,
            },
          },
          datePublished: data.datePublished,
          dateModified: data.dateModified,
          image: data.image,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
          },
        };
        break;
      case 'breadcrumb':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        };
        break;
      default:
        break;
    }

    // Set the JSON-LD text
    setJsonLdText(JSON.stringify(jsonLd));
  }, [type, data]);

  // Only render the script tag on the client side
  if (!jsonLdText) {
    return null;
  }

  // Use next/script with strategy="afterInteractive" to avoid hydration issues
  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: jsonLdText }}
    />
  );
}

// Helper function to generate breadcrumb data
export const generateBreadcrumbData = (items: { name: string; url: string }[]) => {
  return {
    items,
  };
};

// Helper function to generate book data from novel
export const generateBookData = (novel: Novel, url: string) => {
  return {
    name: novel.name,
    author: novel.author,
    description: novel.description || `Novel ${novel.name} by ${novel.author}`,
    genre: novel.genre.split(';').filter(g => g.trim() !== '').join(', '),
    publisher: novel.publishers || 'Novel Indo',
    url,
    image: novel.cover || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}/images/default-cover.jpg`,
  };
};

// Helper function to generate article data for chapter
export const generateArticleData = (
  novel: Novel,
  chapterTitle: string,
  chapterNumber: number,
  url: string,
  datePublished: string,
  dateModified: string
) => {
  return {
    title: `${novel.name} - Chapter ${chapterNumber}: ${chapterTitle}`,
    description: `Baca ${novel.name} Chapter ${chapterNumber}: ${chapterTitle} by ${novel.author}`,
    author: novel.author,
    datePublished,
    dateModified,
    image: novel.cover || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bacanovelindo.click'}/images/default-cover.jpg`,
    url,
  };
}; 