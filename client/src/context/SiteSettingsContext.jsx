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
 *
 * The cache is BOUNDED, and that bound is the whole point of the timestamp.
 *
 * The admin reported that on his own laptop the site showed every update while
 * his visitors kept seeing the old content. One of the ways that happens is
 * right here: the cached copy is painted first, and if the API call then fails
 * — a dropped request, or the hosting CDN's intermittent "checking your
 * browser" interstitial answering HTML instead of JSON — the stale copy simply
 * STAYED on screen, forever, for that visitor. A returning visitor could keep
 * seeing month-old wording with no way to clear it.
 *
 * So the warm start is now a short-lived one: inside the window it still removes
 * the flash of default content, and outside it the browser waits for the API
 * instead of trusting a copy that may be arbitrarily old.
 */
const CACHE_KEY = 'aft_site_settings_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

const readCachedSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    // Only the timestamped shape written below is trusted. A plain copy left by
    // an earlier build has no timestamp, so it reads as expired — the safe
    // direction: the page waits for the API instead of trusting it.
    const at = Number(parsed.at) || 0;
    if (!at || Date.now() - at > CACHE_TTL_MS) return null;

    const settings = parsed.settings;
    return settings && typeof settings === 'object' ? settings : null;
  } catch (err) {
    return null;
  }
};

const writeCachedSettings = (value) => {
  if (typeof window === 'undefined' || !value) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), settings: value }));
  } catch (err) {
    /* storage full or blocked — the site still works, just without the warm start */
  }
};

/** The API answered with JSON settings, not an HTML error/interstitial page. */
const isSettingsReply = (data) => Boolean(data && typeof data === 'object' && data.success && data.settings);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readCachedSettings);
  const [loading, setLoading] = useState(() => !readCachedSettings());

  /*
   * The settings document is the site's content, so a failed fetch must not be
   * accepted as "nothing to change". Two things guard that:
   *   • a couple of quick retries, because the failure we actually see in
   *     production is intermittent (the host's bot-protection page answering an
   *     HTML document for one request in a burst)
   *   • the reply must look like settings; an HTML body is treated as a failure
   *     rather than parsed into the state
   */
  const fetchSettings = async () => {
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const res = await axios.get('/api/settings', { params: { t: Date.now() } });
        if (isSettingsReply(res.data)) {
          setSettings(res.data.settings);
          writeCachedSettings(res.data.settings);
          break;
        }
        console.warn('Site settings reply was not JSON settings — retrying.');
      } catch (err) {
        if (attempt === attempts) console.error('Failed to load site settings:', err);
      }
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 400 * attempt));
    }
    setLoading(false);
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
