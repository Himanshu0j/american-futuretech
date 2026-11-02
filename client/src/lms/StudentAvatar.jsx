import React, { useEffect, useState } from 'react';

const initialsOf = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'ST';

/**
 * Student photo with a real fallback.
 *
 * The `<img onError>` fallback used to point at the default avatar; when that
 * request also failed the browser painted a broken-image icon with the alt text
 * inside the circle. The portal now drops to initials instead, so a missing or
 * not-yet-deployed photo can never leave a broken image on the dashboard or in
 * the admin access panel.
 */
export default function StudentAvatar({
  src,
  name,
  className = 'h-10 w-10',
  textClassName = 'text-xs',
  rounded = 'rounded-full',
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const image = String(src || '').trim();
  if (!image || failed) {
    return (
      <span
        aria-label={name ? `${name}'s profile photo` : 'Student profile photo'}
        className={`${className} ${rounded} inline-flex shrink-0 items-center justify-center overflow-hidden border-2 border-[rgb(var(--tw-gold-500))] bg-[rgb(var(--tw-blue-700))] font-bold text-white ${textClassName}`}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={name ? `${name}'s profile photo` : 'Student profile photo'}
      onError={() => setFailed(true)}
      className={`${className} ${rounded} shrink-0 border-2 border-[rgb(var(--tw-gold-500))] object-cover`}
    />
  );
}
