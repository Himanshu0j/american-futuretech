import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ThemeModeContext = createContext();

export function ThemeModeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize theme: default to 'standard' (warm beige/ivory, forest green)
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'cyber') {
        return 'cyber';
      }
      const path = window.location.pathname.toLowerCase();
      if (path.includes('cyber')) {
        return 'cyber';
      }
      const saved = localStorage.getItem('ui_theme');
      if (saved === 'cyber') {
        return 'cyber';
      }
    } catch (e) {
      // fallback
    }
    return 'standard'; // Default to premium standard EdTech design
  });

  // Keep in sync with URL search params and pathname
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'cyber' || urlTheme === 'apple') {
        if (urlTheme !== themeMode) {
          setThemeModeState(urlTheme);
          localStorage.setItem('ui_theme', urlTheme);
        }
        return;
      }
      const path = location.pathname.toLowerCase();
      if ((path.includes('old') || path.includes('cyber')) && themeMode !== 'cyber') {
        setThemeModeState('cyber');
        localStorage.setItem('ui_theme', 'cyber');
      } else if ((path.includes('apple') || path.includes('new-ui')) && themeMode !== 'apple') {
        setThemeModeState('apple');
        localStorage.setItem('ui_theme', 'apple');
      }
    } catch (e) {}
  }, [location.search, location.pathname]);

  const setThemeMode = (newMode) => {
    setThemeModeState(newMode);
    try {
      localStorage.setItem('ui_theme', newMode);
      const params = new URLSearchParams(location.search);
      params.set('theme', newMode);
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    } catch (e) {}
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'apple' ? 'cyber' : 'apple');
  };

  return (
    <ThemeModeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        isApple: themeMode === 'apple',
        isCyber: themeMode === 'cyber',
      }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    return {
      themeMode: 'apple',
      setThemeMode: () => {},
      toggleTheme: () => {},
      isApple: true,
      isCyber: false,
    };
  }
  return context;
}
