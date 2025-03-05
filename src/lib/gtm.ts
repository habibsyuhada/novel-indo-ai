// GTM Event Types
type GTMEvent = {
  event: string;
  [key: string]: any;
};

// Initialize GTM
export const initGTM = (gtmId: string) => {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // Add noscript iframe
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    document.body.insertBefore(noscript, document.body.firstChild);
  }
};

// Push event to GTM
export const pushGTMEvent = (event: GTMEvent) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(event);
  }
};

// Common event tracking functions
export const trackPageView = (page: string) => {
  pushGTMEvent({
    event: 'page_view',
    page: page,
  });
};

export const trackNovelView = (novel: { id: number; name: string; author: string }) => {
  pushGTMEvent({
    event: 'novel_view',
    novel_id: novel.id,
    novel_name: novel.name,
    novel_author: novel.author,
  });
};

export const trackChapterView = (chapter: { id: number; novel_id: number; chapter: number; title: string }) => {
  pushGTMEvent({
    event: 'chapter_view',
    chapter_id: chapter.id,
    novel_id: chapter.novel_id,
    chapter_number: chapter.chapter,
    chapter_title: chapter.title,
  });
};

export const trackSearch = (searchTerm: string) => {
  pushGTMEvent({
    event: 'search',
    search_term: searchTerm,
  });
}; 