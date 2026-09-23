import React from 'react';
import { useThemeMode } from '../context/ThemeModeContext';
import { Sparkles, Zap, Laptop } from 'lucide-react';

export default function ThemeSwitcher() {
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn select-none">
      <div className="flex items-center p-1.5 rounded-full bg-[#121214]/90 backdrop-blur-2xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
        {/* Apple Pro Button */}
        <button
          onClick={() => setThemeMode('apple')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
            themeMode === 'apple'
              ? 'bg-white text-black font-semibold shadow-md scale-102'
              : 'text-[#86868b] hover:text-white'
          }`}
          title="Switch to Apple Human Interface Guidelines Design"
        >
          <span>🍏</span>
          <span>Apple Pro</span>
        </button>

        {/* Cyberpunk Neon Button */}
        <button
          onClick={() => setThemeMode('cyber')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
            themeMode === 'cyber'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-400 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.5)] scale-102'
              : 'text-[#86868b] hover:text-white'
          }`}
          title="Switch to Cyberpunk Neon 3D Laptop Design"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cyber Neon</span>
        </button>
      </div>
    </div>
  );
}
