import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Soft warm ambient light fields */}
      <div className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(118,255,138,0.07)_0%,rgba(64,132,78,0.03)_45%,transparent_70%)] blur-3xl" />
      <div className="absolute top-1/3 -left-48 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(45,92,54,0.04)_0%,rgba(26,54,29,0.01)_50%,transparent_75%)] blur-3xl" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(158,79,143,0.03)_0%,transparent_65%)] blur-2xl" />

      {/* Architectural Micro-Grid (Ultra subtle, 48px grid) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1a361d" strokeWidth="1" />
            <circle cx="48" cy="48" r="1" fill="#1a361d" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arch-grid)" />
      </svg>

      {/* Delicate horizontal accent lines */}
      <div className="absolute top-96 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1a361d]/[0.05] to-transparent" />
      <div className="absolute top-[1200px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1a361d]/[0.04] to-transparent" />
    </div>
  );
}
