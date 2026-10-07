import React, { useState } from 'react';
import { Sparkles, Images, ShieldCheck, Users, Award } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { resolveSiteImages } from '../data/siteImages';

/**
 * "Life at American FutureTech" — the homepage photo showcase.
 *
 * Every photo here comes from Admin → Content → Website Images (paste a link or
 * upload a file), so the client can plaster the site with pictures without a
 * code change: three feature photos in the mosaic and as many wall photos as
 * they add. With nothing configured yet the shipped classroom photos render, so
 * the section is never an empty band.
 *
 * A broken link must never leave a grey tile, so every tile removes itself when
 * its image fails to load.
 */
function Tile({ src, alt, containerClassName = '', imgClassName = '', overlay, children }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return (
    <div className={`relative ${containerClassName}`}>
      <img
        src={src}
        alt={alt || 'American FutureTech'}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className={imgClassName}
      />
      {overlay}
      {children}
    </div>
  );
}

const leadOverlay = (
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
);

export default function SiteImagesSection() {
  const { settings } = useSiteSettings();
  const images = resolveSiteImages(settings);
  const visibility = settings?.sectionVisibility || {};

  if (visibility.siteImages === false || images.enabled === false) return null;

  const [lead, ...stacked] = images.feature;
  const wall = images.gallery;
  if (!lead && stacked.length === 0 && wall.length === 0) return null;

  const stats = [
    { icon: Users, label: 'Live cohort labs', value: '1:12 mentor ratio' },
    { icon: ShieldCheck, label: 'Capstone defense', value: 'Industry panel reviewed' },
    { icon: Award, label: 'On graduation', value: 'US Fellowship diploma' },
  ];

  return (
    <section
      id="campus-life"
      className="relative py-14 sm:py-20 bg-[#F7F7F5] border-t border-slate-200/80 overflow-hidden"
    >
      {/* Ambient brand glow — same visual language as the rest of the homepage */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#F00000]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#1D4ED8]/10 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002060] text-white text-xs font-bold uppercase tracking-wider mb-4">
            <Images className="w-3.5 h-3.5 text-[#FF6B6B]" />
            {images.eyebrow}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#002060] tracking-tight">
            {images.heading}
          </h2>
          {images.subheading && (
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">{images.subheading}</p>
          )}
        </div>

        {/* Mosaic — one tall lead photo with up to two stacked beside it */}
        {(lead || stacked.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <Tile
              src={lead?.image}
              alt={lead?.alt || lead?.caption}
              containerClassName="lg:col-span-2 lg:row-span-2 overflow-hidden rounded-3xl bg-[#002060] min-h-[280px] sm:min-h-[380px] lg:min-h-[520px] shadow-xl ring-1 ring-black/5 group aft-lift"
              imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              overlay={leadOverlay}
            >
              {lead?.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#FF6B6B]" />
                    {lead.caption}
                  </span>
                </div>
              )}
            </Tile>

            {stacked.slice(0, 2).map((photo, idx) => (
              <Tile
                key={`feature-${idx}`}
                src={photo.image}
                alt={photo.alt || photo.caption}
                containerClassName="overflow-hidden rounded-3xl bg-slate-900 min-h-[200px] lg:min-h-[250px] shadow-lg ring-1 ring-black/5 group aft-lift"
                imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                overlay={
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                }
              >
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-bold leading-snug drop-shadow">{photo.caption}</p>
                  </div>
                )}
              </Tile>
            ))}
          </div>
        )}

        {/* Photo wall — every extra image the admin adds */}
        {wall.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {wall.map((photo, idx) => (
              <Tile
                key={`wall-${idx}`}
                src={photo.image}
                alt={photo.alt || photo.caption}
                containerClassName="overflow-hidden rounded-2xl bg-slate-200 h-36 sm:h-44 shadow-sm ring-1 ring-black/5 group aft-lift"
                imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                overlay={
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                }
              >
                {photo.caption && (
                  <figcaption className="absolute bottom-0 left-0 right-0 p-2.5 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption}
                  </figcaption>
                )}
              </Tile>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-xs"
            >
              <span className="w-9 h-9 rounded-xl bg-[#002060]/5 border border-[#002060]/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#002060]" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
                <div className="text-sm font-bold text-[#002060] truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
