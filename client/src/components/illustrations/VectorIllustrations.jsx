import React from 'react';

// Common Brand Gradient Definitions for Illustrations
export const IllustrationDefs = () => (
  <defs>
    <linearGradient id="aft-forest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1a361d" />
      <stop offset="100%" stopColor="#2d5c36" />
    </linearGradient>
    <linearGradient id="aft-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#76ff8a" />
      <stop offset="100%" stopColor="#10b981" />
    </linearGradient>
    <linearGradient id="aft-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fde047" />
      <stop offset="100%" stopColor="#d97706" />
    </linearGradient>
    <linearGradient id="aft-berry-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#c084fc" />
      <stop offset="100%" stopColor="#9e4f8f" />
    </linearGradient>
    <linearGradient id="aft-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
    </linearGradient>
    <filter id="aft-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1a361d" floodOpacity="0.12" />
    </filter>
  </defs>
);

// 1. HERO ILLUSTRATION: Technologist in Flow State with Floating Code & Telemetry
export const HeroEducationIllustration = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    {/* Ambient Backdrop Circle */}
    <circle cx="260" cy="210" r="160" fill="url(#aft-emerald-grad)" fillOpacity="0.08" />
    <circle cx="260" cy="210" r="120" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="6 6" />

    {/* Desk Surface */}
    <rect x="70" y="320" width="380" height="12" rx="6" fill="#e2e8f0" />
    
    {/* Central Laptop Station */}
    <rect x="170" y="190" width="180" height="115" rx="10" fill="#0f172a" filter="url(#aft-soft-shadow)" />
    <rect x="178" y="198" width="164" height="92" rx="6" fill="#1e293b" />
    {/* Screen Terminal Code Lines */}
    <circle cx="190" cy="207" r="3" fill="#f43f5e" />
    <circle cx="200" cy="207" r="3" fill="#fbbf24" />
    <circle cx="210" cy="207" r="3" fill="#10b981" />
    <rect x="190" y="220" width="70" height="4" rx="2" fill="#76ff8a" />
    <rect x="190" y="230" width="120" height="4" rx="2" fill="#38bdf8" />
    <rect x="190" y="240" width="95" height="4" rx="2" fill="#94a3b8" />
    <rect x="190" y="250" width="130" height="4" rx="2" fill="#c084fc" />
    <rect x="190" y="260" width="80" height="4" rx="2" fill="#76ff8a" />
    <rect x="190" y="272" width="60" height="6" rx="3" fill="#10b981" />
    
    {/* Laptop Base */}
    <path d="M140 305 L380 305 L360 318 L160 318 Z" fill="#94a3b8" />
    <rect x="235" y="306" width="50" height="4" rx="2" fill="#cbd5e1" />

    {/* Floating Card Left: Neural Model Graph */}
    <g className="animate-float-slow">
      <rect x="40" y="120" width="120" height="85" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter="url(#aft-soft-shadow)" />
      <rect x="52" y="132" width="40" height="6" rx="3" fill="#1a361d" />
      <circle cx="65" cy="165" r="8" fill="#d8ffd2" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="100" cy="150" r="8" fill="#ffe6fa" stroke="#9e4f8f" strokeWidth="1.5" />
      <circle cx="135" cy="170" r="8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
      <line x1="73" y1="165" x2="92" y2="150" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="108" y1="150" x2="127" y2="170" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="52" y="188" width="60" height="4" rx="2" fill="#94a3b8" />
    </g>

    {/* Floating Card Right: Accreditation Seal */}
    <g className="animate-float-delayed">
      <rect x="360" y="110" width="130" height="90" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter="url(#aft-soft-shadow)" />
      <circle cx="425" cy="145" r="18" fill="url(#aft-gold-grad)" />
      <path d="M425 133 L428 141 L436 142 L430 148 L432 156 L425 152 L418 156 L420 148 L414 142 L422 141 Z" fill="#ffffff" />
      <rect x="380" y="172" width="90" height="5" rx="2.5" fill="#1a361d" />
      <rect x="395" y="182" width="60" height="4" rx="2" fill="#10b981" />
    </g>

    {/* Floating Element: Graduation Cap Crest */}
    <g className="animate-float-drift">
      <circle cx="260" cy="90" r="28" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" filter="url(#aft-soft-shadow)" />
      <path d="M260 76 L278 84 L260 92 L242 84 Z" fill="#1a361d" />
      <path d="M248 88 L248 97 C248 102 272 102 272 97 L272 88" fill="#2d5c36" />
      <line x1="272" y1="84" x2="276" y2="98" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="276" cy="99" r="2" fill="#f59e0b" />
    </g>
  </svg>
);

// 2. ASSESS ILLUSTRATION (Diagnostic & Skill Radar)
export const AssessIllustration = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <circle cx="60" cy="60" r="48" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="32" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="60" cy="60" r="16" stroke="#4ade80" strokeWidth="1" />
    {/* Radar Polygon */}
    <polygon points="60,26 86,50 78,82 42,78 36,46" fill="#10b981" fillOpacity="0.25" stroke="#059669" strokeWidth="2" />
    <circle cx="60" cy="26" r="3.5" fill="#059669" />
    <circle cx="86" cy="50" r="3.5" fill="#059669" />
    <circle cx="78" cy="82" r="3.5" fill="#059669" />
    <circle cx="42" cy="78" r="3.5" fill="#059669" />
    <circle cx="36" cy="46" r="3.5" fill="#059669" />
  </svg>
);

// 3. LEARN ILLUSTRATION (Interactive Modules & Code)
export const LearnIllustration = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <rect x="20" y="24" width="80" height="72" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" filter="url(#aft-soft-shadow)" />
    <rect x="20" y="24" width="80" height="20" rx="10" fill="#1a361d" />
    <circle cx="30" cy="34" r="2.5" fill="#76ff8a" />
    <circle cx="38" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.6" />
    <rect x="28" y="52" width="40" height="4" rx="2" fill="#0284c7" />
    <rect x="28" y="62" width="55" height="4" rx="2" fill="#64748b" />
    <rect x="28" y="72" width="30" height="4" rx="2" fill="#10b981" />
    <rect x="28" y="82" width="48" height="4" rx="2" fill="#94a3b8" />
    {/* Floating Play Indicator */}
    <circle cx="84" cy="74" r="12" fill="#10b981" />
    <polygon points="81,68 89,74 81,80" fill="#ffffff" />
  </svg>
);

// 4. PRACTICE ILLUSTRATION (Hands-On Lab & Git Pipeline)
export const PracticeIllustration = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <circle cx="60" cy="60" r="46" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Git Branch Flow */}
    <circle cx="40" cy="60" r="8" fill="#1a361d" stroke="#76ff8a" strokeWidth="2" />
    <circle cx="60" cy="40" r="7" fill="#0284c7" />
    <circle cx="60" cy="80" r="7" fill="#9e4f8f" />
    <circle cx="82" cy="60" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
    <path d="M48 60 L73 60" stroke="#64748b" strokeWidth="2" />
    <path d="M45 54 C48 42 54 40 60 40 C66 40 74 46 76 54" stroke="#0284c7" strokeWidth="2" fill="none" strokeDasharray="3 3" />
    <path d="M45 66 C48 78 54 80 60 80 C66 80 74 74 76 66" stroke="#9e4f8f" strokeWidth="2" fill="none" strokeDasharray="3 3" />
  </svg>
);

// 5. CERTIFY ILLUSTRATION (Official Verifiable Credential)
export const CertifyIllustration = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    {/* Parchment Diploma */}
    <rect x="25" y="20" width="70" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#aft-soft-shadow)" />
    <rect x="35" y="32" width="50" height="5" rx="2.5" fill="#1a361d" />
    <rect x="42" y="42" width="36" height="3" rx="1.5" fill="#94a3b8" />
    <line x1="35" y1="52" x2="85" y2="52" stroke="#e2e8f0" strokeWidth="1" />
    <line x1="35" y1="60" x2="75" y2="60" stroke="#e2e8f0" strokeWidth="1" />
    {/* Gold Ribbon Seal */}
    <circle cx="60" cy="78" r="12" fill="url(#aft-gold-grad)" />
    <path d="M54 86 L50 98 L56 94 L62 98 L58 86 Z" fill="#d97706" />
    <path d="M66 86 L70 98 L64 94 L58 98 L62 86 Z" fill="#b45309" />
    <circle cx="60" cy="78" r="7" fill="#ffffff" fillOpacity="0.9" />
    <path d="M57 78 L59 80 L63 76" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 6. CAREER READY ILLUSTRATION (Interview & Global Offer)
export const CareerReadyIllustration = ({ className = "w-24 h-24" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <circle cx="60" cy="60" r="46" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
    {/* Briefcase Base */}
    <rect x="32" y="44" width="56" height="42" rx="7" fill="#1a361d" />
    <path d="M46 44 L46 36 C46 32 74 32 74 36 L74 44" stroke="#1a361d" strokeWidth="3" fill="none" />
    <line x1="32" y1="58" x2="88" y2="58" stroke="#2d5c36" strokeWidth="2" />
    {/* Success Badge */}
    <circle cx="60" cy="64" r="8" fill="#76ff8a" />
    <path d="M57 64 L59 66 L63 62" stroke="#1a361d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 7. JOBS BOARD BANNER ILLUSTRATION
export const JobsIllustration = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <rect x="20" y="20" width="420" height="220" rx="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter="url(#aft-soft-shadow)" />
    {/* Header */}
    <rect x="40" y="40" width="160" height="12" rx="6" fill="#1a361d" />
    <rect x="40" y="60" width="220" height="6" rx="3" fill="#64748b" />
    
    {/* 3 Job Rows */}
    <g>
      <rect x="40" y="86" width="380" height="38" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <circle cx="60" cy="105" r="10" fill="#0284c7" fillOpacity="0.15" />
      <rect x="80" y="98" width="110" height="6" rx="3" fill="#1e293b" />
      <rect x="80" y="108" width="60" height="4" rx="2" fill="#94a3b8" />
      <rect x="330" y="96" width="75" height="18" rx="9" fill="#d8ffd2" />
    </g>
    <g>
      <rect x="40" y="134" width="380" height="38" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <circle cx="60" cy="153" r="10" fill="#10b981" fillOpacity="0.15" />
      <rect x="80" y="146" width="130" height="6" rx="3" fill="#1e293b" />
      <rect x="80" y="156" width="70" height="4" rx="2" fill="#94a3b8" />
      <rect x="330" y="144" width="75" height="18" rx="9" fill="#d8ffd2" />
    </g>
    <g>
      <rect x="40" y="182" width="380" height="38" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <circle cx="60" cy="201" r="10" fill="#9e4f8f" fillOpacity="0.15" />
      <rect x="80" y="194" width="100" height="6" rx="3" fill="#1e293b" />
      <rect x="80" y="204" width="50" height="4" rx="2" fill="#94a3b8" />
      <rect x="330" y="192" width="75" height="18" rx="9" fill="#d8ffd2" />
    </g>
  </svg>
);

// 8. MISSION & TRANSFORMATION ILLUSTRATION
export const MissionIllustration = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <circle cx="190" cy="140" r="110" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
    {/* Central Pillar */}
    <rect x="155" y="80" width="70" height="120" rx="12" fill="#1a361d" />
    <rect x="165" y="92" width="50" height="6" rx="3" fill="#76ff8a" />
    {/* Upward Growth Arrow */}
    <path d="M190 190 L190 115" stroke="#76ff8a" strokeWidth="4" strokeLinecap="round" />
    <polygon points="182,122 190,105 198,122" fill="#76ff8a" />
    {/* Orbiting Milestone Nodes */}
    <circle cx="100" cy="110" r="16" fill="#ffffff" stroke="#10b981" strokeWidth="2" filter="url(#aft-soft-shadow)" />
    <circle cx="280" cy="110" r="16" fill="#ffffff" stroke="#9e4f8f" strokeWidth="2" filter="url(#aft-soft-shadow)" />
    <circle cx="190" cy="230" r="16" fill="#ffffff" stroke="#0284c7" strokeWidth="2" filter="url(#aft-soft-shadow)" />
  </svg>
);

// 9. VISION & GLOBAL WORKFORCE ILLUSTRATION
export const VisionIllustration = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    {/* Global Meridian Globe */}
    <circle cx="210" cy="140" r="100" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
    <ellipse cx="210" cy="140" rx="100" ry="45" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <ellipse cx="210" cy="140" rx="45" ry="100" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    
    {/* Connected Global Hubs */}
    <circle cx="210" cy="140" r="14" fill="#1a361d" stroke="#76ff8a" strokeWidth="2" />
    <circle cx="140" cy="110" r="10" fill="#10b981" />
    <circle cx="280" cy="120" r="10" fill="#0284c7" />
    <circle cx="170" cy="180" r="9" fill="#9e4f8f" />
    <circle cx="260" cy="185" r="9" fill="#f59e0b" />
    {/* Connection Beams */}
    <line x1="210" y1="140" x2="140" y2="110" stroke="#10b981" strokeWidth="1.5" />
    <line x1="210" y1="140" x2="280" y2="120" stroke="#0284c7" strokeWidth="1.5" />
    <line x1="210" y1="140" x2="170" y2="180" stroke="#9e4f8f" strokeWidth="1.5" />
    <line x1="210" y1="140" x2="260" y2="185" stroke="#f59e0b" strokeWidth="1.5" />
  </svg>
);

// 10. CLOSING CTA ILLUSTRATION
export const CTAIllustration = ({ className = "w-full h-auto" }) => (
  <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <IllustrationDefs />
    <circle cx="180" cy="130" r="100" fill="#76ff8a" fillOpacity="0.12" />
    {/* Rocket Propulsion Body */}
    <path d="M180 50 C195 90 205 130 198 160 L162 160 C155 130 165 90 180 50 Z" fill="#ffffff" stroke="#1a361d" strokeWidth="2.5" />
    <circle cx="180" cy="95" r="10" fill="#10b981" />
    {/* Wings */}
    <path d="M162 140 L140 165 L164 165 Z" fill="#9e4f8f" />
    <path d="M198 140 L220 165 L196 165 Z" fill="#9e4f8f" />
    {/* Exhaust Flames */}
    <path d="M172 164 Q180 195 180 195 Q180 195 188 164 Z" fill="url(#aft-gold-grad)" />
    <circle cx="180" cy="180" r="3" fill="#ffffff" />
  </svg>
);
