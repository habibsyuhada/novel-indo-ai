import { useState, useEffect } from 'react';

interface UseReadingProgressProps {
  contentElement: HTMLDivElement | null;
}

export const useReadingProgress = ({ contentElement }: UseReadingProgressProps): number => {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (!contentElement) return;
    
    const handleScroll = () => {
      const element = contentElement;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const windowScrollTop = window.scrollY - element.offsetTop;
      
      if (windowScrollTop >= 0) {
        const scrolled = Math.min(100, Math.max(0, (windowScrollTop / totalHeight) * 100));
        setReadingProgress(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentElement]);

  return readingProgress;
};

export default useReadingProgress; 