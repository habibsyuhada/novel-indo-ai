import { Play, Pause, StopCircle } from 'lucide-react';
import { useVisualViewportOffset } from '../../hooks/useVisualViewportOffset';

interface TtsControlsProps {
  ttsEnabled: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
}

const TtsControls = ({
  ttsEnabled,
  isPlaying,
  onPlayPause,
  onStop
}: TtsControlsProps) => {
  const ref = useVisualViewportOffset<HTMLDivElement>();

  if (!ttsEnabled) return null;

  return (
    <div
      ref={ref}
      style={{ transform: 'translateX(-50%) translateY(var(--vvo-offset, 0px))' }}
      className="fixed bottom-20 left-1/2 z-40"
    >
      <div className="bg-base-300 rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
        <button
          onClick={onPlayPause}
          className="btn btn-circle btn-sm"
          aria-label={isPlaying ? "Jeda" : "Putar"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={onStop}
          className="btn btn-circle btn-sm"
          aria-label="Berhenti"
        >
          <StopCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TtsControls; 