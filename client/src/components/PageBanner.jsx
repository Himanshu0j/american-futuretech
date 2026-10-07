import React, { useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { bannerFor } from '../data/siteImages';

/**
 * Optional banner photo for an inner page.
 *
 * Which pages can carry one is the SITE_IMAGE_BANNERS list in
 * client/src/data/siteImages.js; the photo itself is dropped in from
 * Admin → Content → Website Images. A page with no photo configured renders
 * exactly as before — nothing is added to the DOM until the client picks one.
 *
 * It is a photo strip, not a second hero: the pages keep their own headline and
 * copy, so no page ends up with two competing titles.
 *
 * The strip sits BETWEEN <Navbar /> and <main>, not inside main: adding it there
 * leaves every key the inline website editor saved on those pages untouched (the
 * editor addresses elements by position, and a new sibling of a different tag
 * does not move any sibling index), so no published wording or photo is lost the
 * first time a banner is switched on.
 */
export default function PageBanner({ pageKey }) {
  const { settings } = useSiteSettings();
  const [broken, setBroken] = useState(false);
  const banner = bannerFor(settings, pageKey);

  if (!banner?.image || broken) return null;

  return (
    /* `pt-24` clears the fixed navbar and the negative bottom margin eats most
       of the top padding the page's own <main> already carries, so the strip
       does not leave a hollow band above the page heading. */
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-2 -mb-12 sm:-mb-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#1D4ED8]/30 bg-[#002060] shadow-xl h-40 sm:h-56 lg:h-64">
        <img
          src={banner.image}
          alt={banner.alt || banner.caption || 'American FutureTech'}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#002060]/70 via-transparent to-transparent" />
        {banner.caption && (
          <p className="absolute bottom-4 left-5 right-5 text-white text-sm sm:text-base font-bold drop-shadow">
            {banner.caption}
          </p>
        )}
      </div>
    </section>
  );
}
