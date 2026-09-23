import React, { useState } from 'react';
import { Building2, Sparkles, Image as ImageIcon } from 'lucide-react';

/**
 * SafeImage Component
 * 
 * Guarantees zero broken image icons on public & admin pages.
 * Handles fallback cascading:
 * 1. src (uploaded or URL)
 * 2. fallbackSrc (if provided)
 * 3. Clean branded monogram / SVG fallback
 */
export default function SafeImage({
  src,
  alt = 'American FutureTech Asset',
  fallbackSrc,
  fallbackText,
  className = '',
  imageClassName = 'w-full h-full object-contain',
  fallbackClassName = 'w-full h-full rounded-2xl bg-gradient-to-br from-[#0B1220] to-[#4338CA] text-[#E5C275] font-bold text-sm flex items-center justify-center',
  placeholderIcon: PlaceholderIcon = Building2,
}) {
  const [hasError, setHasError] = useState(false);
  const [triedFallbackSrc, setTriedFallbackSrc] = useState(false);

  const initialSrc = src && typeof src === 'string' ? src.trim() : '';

  if (!initialSrc || (hasError && (!fallbackSrc || triedFallbackSrc))) {
    // Render clean branded monogram or placeholder icon
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className={fallbackClassName}>
          {fallbackText ? (
            <span className="font-heading tracking-wider uppercase select-none">
              {fallbackText.slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <PlaceholderIcon className="w-5 h-5 text-current opacity-80" />
          )}
        </div>
      </div>
    );
  }

  const currentSource = hasError && fallbackSrc && !triedFallbackSrc ? fallbackSrc : initialSrc;

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${className}`}>
      <img
        src={currentSource}
        alt={alt}
        loading="lazy"
        onError={() => {
          if (!hasError && fallbackSrc) {
            setHasError(true);
          } else {
            setTriedFallbackSrc(true);
            setHasError(true);
          }
        }}
        className={imageClassName}
      />
    </div>
  );
}
