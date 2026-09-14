'use client';

import { useState } from 'react';
import Image from 'next/image';

export function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const [activeImage, setActiveImage] = useState(images[0] || '');

  if (!images || images.length === 0) {
    return (
      <div className="h-64 sm:h-96 w-full rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-800">
        No images available for this property
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hero Active Image */}
      <div className="relative h-72 sm:h-[420px] w-full overflow-hidden rounded-2xl glass-card border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md">
        <Image
          src={activeImage}
          alt={`Featured photo of ${name}`}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((imgUrl, idx) => {
            const isActive = imgUrl === activeImage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(imgUrl)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-95' : 'border-slate-300 dark:border-slate-800 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View photo ${idx + 1} for ${name}`}
              >
                <Image
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1} for ${name}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
