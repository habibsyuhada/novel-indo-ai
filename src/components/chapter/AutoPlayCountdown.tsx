import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { X } from 'lucide-react';

interface AutoPlayCountdownProps {
  isActive: boolean;
  onCancel: () => void;
}

const AutoPlayCountdown: React.FC<AutoPlayCountdownProps> = ({ isActive, onCancel }) => {
  const { ttsAutoPlayDelay } = useSelector((state: RootState) => state.settings);
  const [countdown, setCountdown] = useState(ttsAutoPlayDelay);

  useEffect(() => {
    if (!isActive) {
      setCountdown(ttsAutoPlayDelay);
      return;
    }

    // Reset countdown when active changes
    setCountdown(ttsAutoPlayDelay);

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
  }, [isActive, ttsAutoPlayDelay]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 bg-base-300 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
      <div className="text-sm">
        <p>Berpindah ke chapter berikutnya dalam <span className="font-bold">{countdown}</span> detik</p>
      </div>
      <button 
        onClick={onCancel}
        className="btn btn-circle btn-sm btn-ghost"
        aria-label="Batalkan auto-play"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AutoPlayCountdown; 