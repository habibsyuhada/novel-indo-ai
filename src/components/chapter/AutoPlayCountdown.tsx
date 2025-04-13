import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { NovelChapter } from '../../lib/supabase';

interface AutoPlayCountdownProps {
  isActive: boolean;
  onCancel: () => void;
	chapterData: NovelChapter;
}

const AutoPlayCountdown: React.FC<AutoPlayCountdownProps> = ({ isActive, onCancel, chapterData }) => {
  const { ttsAutoPlayDelay } = useSelector((state: RootState) => state.settings);
  const [countdown, setCountdown] = useState(ttsAutoPlayDelay);

  useEffect(() => {
    if (!isActive) {
      setCountdown(ttsAutoPlayDelay);
      return;
    }

    // Reset countdown when active changes
    setCountdown(ttsAutoPlayDelay);
		console.log("set fromchapter", chapterData.chapter.toString())
		localStorage.setItem('fromchapter', chapterData.chapter.toString());
    // Set up the countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, ttsAutoPlayDelay, chapterData.chapter]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 bg-base-300 rounded-lg shadow-lg px-4 py-3 flex flex-col items-center gap-2">
      <div className="text-sm text-center">
        <p className="font-medium">TTS berhenti sementara</p>
        <p>Berpindah ke chapter berikutnya dalam <span className="font-bold">{countdown}</span> detik</p>
      </div>
      <button 
        onClick={onCancel}
        className="btn btn-sm btn-outline mt-1"
        aria-label="Batalkan auto-play"
      >
        Batalkan Auto-Play
      </button>
    </div>
  );
};

export default AutoPlayCountdown; 