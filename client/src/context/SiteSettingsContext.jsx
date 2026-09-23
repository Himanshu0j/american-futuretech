import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SiteSettingsContext = createContext(null);

/**
 * The last known settings are cached locally and used for the FIRST paint.
 *
 * Without this the app rendered the coded defaults, then swapped to the CMS
 * values as soon as /api/settings answered — which showed up as "refresh karne
 * par pehle purani screen, phir nayi screen". Now the first paint already uses
 * the saved content and the network response only corrects it in the background.
 */
const CACHE_KEY = 'aft_site_settings_v1';

const readCachedSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    return null;
  }
};

const writeCachedSettings = (value) => {
  if (typeof window === 'undefined' || !value) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch (err) {
    /* storage full or blocked — the site still works, just without the warm start */
  }
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readCachedSettings);
  const [loading, setLoading] = useState(() => !readCachedSettings());

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
        writeCachedSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      settings: null,
      loading: false,
      refreshSettings: () => {},
    };
  }
  return context;
}
