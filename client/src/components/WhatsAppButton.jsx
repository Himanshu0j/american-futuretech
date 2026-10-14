import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import useCompanyInfo from '../hooks/useCompanyInfo';

export default function WhatsAppButton() {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const company = useCompanyInfo();

  const phoneNumber = company.phone;
  const whatsappUrl = `https://wa.me/${company.phoneDigits}?text=${encodeURIComponent(
    `Hello ${company.siteName}, I would like to learn more about your fellowship programs and admissions.`,
  )}`;

  // NOTE: this early return must stay *after* every hook — returning before a
  // hook changes the hook order between routes and crashes React.
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanding Tooltip Pill on Hover */}
      <div
        className={`mr-3 px-3.5 py-2 rounded-2xl bg-[rgb(var(--tw-ink-900))] text-[#FFD9D9] border border-[rgb(var(--tw-blue-700))] shadow-xl text-xs font-medium transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-2 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat on WhatsApp: <strong className="text-white">{phoneNumber}</strong></span>
        <ArrowUpRight className="w-3.5 h-3.5 text-[color:rgb(var(--tw-gold-400))]" />
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Admissions on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group relative"
      >
        {/* Pulse Ripple Effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        {/* The real WhatsApp mark (the white handset inside the solid bubble),
            not a generic chat glyph: the client asked for the actual logo on the
            floating button. Drawn inline rather than fetched — the live CSP is
            `img-src 'self' data:`, so an icon URL would simply be blocked. */}
        <svg
          className="w-7 h-7 fill-current transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.115-.198.058-.372-.029-.52-.086-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
