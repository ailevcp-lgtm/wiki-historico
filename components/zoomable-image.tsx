"use client";

import { useEffect, useState } from "react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="block w-full cursor-zoom-in"
        onClick={() => setIsOpen(true)}
        aria-label={`Abrir imagen: ${alt}`}
      >
        <img src={src} alt={alt} className={className} />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-sm border border-white/40 bg-black/50 px-3 py-1 text-sm font-semibold text-white"
            onClick={() => setIsOpen(false)}
          >
            Cerrar
          </button>
          <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
            <img src={src} alt={alt} className="max-h-[90vh] max-w-[92vw] object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
