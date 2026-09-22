import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Phone, ArrowUpRight } from 'lucide-react';

export default function WhatsAppButton() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const [isHovered, setIsHovered] = useState(false);
  const phoneNumber = '+1 (307) 201-9494';
  const whatsappUrl = 'https://wa.me/13072019494?text=Hello%20American%20FutureTech%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20fellowship%20programs%20and%20admissions.';

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanding Tooltip Pill on Hover */}
      <div
        className={`mr-3 px-3.5 py-2 rounded-2xl bg-[#1a361d] text-[#d8ffd2] border border-[#2d5c36] shadow-xl text-xs font-medium transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-2 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat on WhatsApp: <strong className="text-white">{phoneNumber}</strong></span>
        <ArrowUpRight className="w-3.5 h-3.5 text-[#76ff8a]" />
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

        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 fill-current transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.077-1.11-.059-.395-.129-.91-.295-1.564-.582-2.766-1.213-4.571-4.041-4.71-4.225-.138-.184-1.12-1.488-1.12-2.839 0-1.351.708-2.015.962-2.287.254-.271.554-.339.739-.339.185 0 .37.002.531.01.173.008.406-.065.635.485.238.572.81 1.975.88 2.119.071.145.118.314.024.502-.093.188-.141.306-.279.471-.138.165-.292.368-.417.494-.139.139-.283.29-.122.568.162.278.718 1.186 1.54 1.917 1.057.942 1.948 1.234 2.226 1.373.277.139.439.116.602-.07.162-.186.694-.808.879-1.086.185-.278.37-.231.624-.139.254.093 1.618.763 1.896.902.277.139.462.208.531.324.069.116.069.671-.075 1.076zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.168L2 22l4.981-1.308C8.423 21.536 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      </a>
    </div>
  );
}
