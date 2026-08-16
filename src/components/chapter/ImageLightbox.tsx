import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

const ImageLightbox = ({ src, alt, caption, onClose }: ImageLightboxProps) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="btn btn-circle btn-sm absolute top-4 right-4"
        onClick={onClose}
        aria-label="Tutup gambar"
      >
        <X size={18} />
      </button>

      <div
        className="relative max-h-[85vh] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          className="max-h-[85vh] w-auto h-auto max-w-full rounded object-contain"
          sizes="100vw"
        />
      </div>

      {caption && (
        <p className="mt-3 max-w-2xl text-center text-sm text-white/80">
          {caption}
        </p>
      )}
    </div>
  );
};

export default ImageLightbox;
