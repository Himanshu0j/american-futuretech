import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import ImageUploadInput from './components/ImageUploadInput';
import {
  Images,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layout,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Boxes,
} from 'lucide-react';
import {
  SITE_IMAGE_BANNERS,
  ILLUSTRATION_SLOTS,
  resolveSiteImages,
} from '../data/siteImages';

/**
 * Admin → Content → Website Images.
 *
 * ONE place to put a photo on the site: paste a link or upload a file, and it
 * appears — three feature photos + an unlimited photo wall on the homepage, plus
 * a banner on each inner page. Saved on `SiteSettings.siteImages` through the
 * normal settings endpoint, so the public site picks it up on the next load.
 *
 * The three shipped classroom photos are preloaded as the starting point, so the
 * client can simply replace them instead of staring at empty boxes.
 */

const rowFrom = (image = '') => ({
  image,
  caption: '',
  alt: '',
  active: true,
});

/** One editable photo row (image + caption + show/hide + order controls). */
function PhotoRow({ label, hint, value, onChange, onRemove, onMove, canMove, lines = 1 }) {
  return (
    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-300 font-bold truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {canMove && (
            <>
              <button
                type="button"
                onClick={() => onMove(-1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Move up"
                aria-label={`Move ${label} up`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Move down"
                aria-label={`Move ${label} down`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onChange({ ...value, active: value.active === false })}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer ${
              value.active === false
                ? 'bg-slate-800 text-slate-400'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
            title={value.active === false ? 'Hidden on the site — click to show' : 'Visible on the site — click to hide'}
          >
            {value.active === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {value.active === false ? 'Hidden' : 'Shown'}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-900 cursor-pointer"
              title="Remove this photo"
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {hint && <p className="text-[10px] text-slate-500 font-mono">{hint}</p>}

      <ImageUploadInput
        label=""
        value={value.image}
        onChange={(url) => onChange({ ...value, image: url })}
        placeholder="Image link (https://…) ya computer se upload karo"
        previewSize="w-24 h-16"
      />

      <input
        type="text"
        value={value.caption}
        onChange={(e) => onChange({ ...value, caption: e.target.value })}
        placeholder="Caption (optional) — image ke niche dikhta hai"
        aria-label={`${label} caption`}
        className="w-full p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
      />

      {lines > 1 && (
        <input
          type="text"
          value={value.alt}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Alt text for accessibility / Google (optional)"
          aria-label={`${label} alt text`}
          className="w-full p-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
        />
      )}
    </div>
  );
}

export default function SiteImagesCMS() {
  const [form, setForm] = useState(() => {
    const resolved = resolveSiteImages(null);
    return {
      enabled: resolved.enabled,
      eyebrow: resolved.eyebrow,
      heading: resolved.heading,
      subheading: resolved.subheading,
      feature: resolved.feature.map((row) => ({ ...row })),
      gallery: resolved.gallery.map((row) => ({ ...row })),
      banners: SITE_IMAGE_BANNERS.map((slot) => ({ key: slot.key, image: '', caption: '', alt: '', active: true })),
    };
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [artCount, setArtCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        const saved = res.data?.settings?.siteImages || {};
        if (cancelled) return;

        const resolved = resolveSiteImages({ siteImages: saved });
        const savedBanners = Array.isArray(saved.banners) ? saved.banners : [];
        const savedArt = Array.isArray(saved.illustrations) ? saved.illustrations : [];
        const anySaved = Boolean(
          saved.heading || saved.subheading || saved.eyebrow
          || (Array.isArray(saved.feature) && saved.feature.length)
          || (Array.isArray(saved.gallery) && saved.gallery.length),
        );

        setForm({
          enabled: saved.enabled !== false,
          eyebrow: resolved.eyebrow,
          heading: resolved.heading,
          subheading: resolved.subheading,
          feature: resolved.feature.length
            ? resolved.feature.map((row) => ({ ...row }))
            : ['', '', ''].map((image) => rowFrom(image)),
          gallery: anySaved
            ? (Array.isArray(saved.gallery) ? saved.gallery.map((row) => ({ ...row })) : [])
            : resolved.gallery.map((row) => ({ ...row })),
          banners: SITE_IMAGE_BANNERS.map((slot) => {
            const found = savedBanners.find((b) => b.key === slot.key) || {};
            return {
              key: slot.key,
              image: found.image || '',
              caption: found.caption || '',
              alt: found.alt || '',
              active: found.active !== false,
            };
          }),
          // Artwork inside the page sections (journey steps, CTA banner, About…).
          // A blank row means "keep the drawing the site ships with".
          illustrations: ILLUSTRATION_SLOTS.map((slot) => {
            const found = savedArt.find((b) => b.key === slot.key) || {};
            return {
              key: slot.key,
              image: found.image || '',
              alt: found.alt || '',
              active: found.active !== false,
            };
          }),
        });
      } catch (err) {
        if (!cancelled) {
          setFeedback({ type: 'error', text: err.response?.data?.message || 'Website images load nahi ho paayi.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  /*
   * Live preview count so the client can see how many photos are actually on the
   * site. The homepage mosaic + photo wall were retired when the sliding brand
   * band took that space, so only the page banners count as live photos now.
   */
  useEffect(() => {
    const count = form.banners.filter((row) => row.image && row.active !== false).length;
    setPhotoCount(count);

    const art = Array.isArray(form.illustrations)
      ? form.illustrations.filter((row) => row.image && row.active !== false).length
      : 0;
    setArtCount(art);
  }, [form]);

  const updateList = (listKey, idx, next) =>
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((row, i) => (i === idx ? next : row)),
    }));

  const updateIllustration = (idx, patch) =>
    setForm((prev) => ({
      ...prev,
      illustrations: (prev.illustrations || []).map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        siteImages: {
          enabled: form.enabled !== false,
          eyebrow: String(form.eyebrow || '').trim(),
          heading: String(form.heading || '').trim(),
          subheading: String(form.subheading || '').trim(),
          feature: form.feature
            .map((row, idx) => ({
              image: String(row.image || '').trim(),
              caption: String(row.caption || '').trim(),
              alt: String(row.alt || '').trim(),
              order: idx + 1,
              active: row.active !== false,
            }))
            .filter((row) => row.image),
          gallery: form.gallery
            .map((row, idx) => ({
              image: String(row.image || '').trim(),
              caption: String(row.caption || '').trim(),
              alt: String(row.alt || '').trim(),
              order: idx + 1,
              active: row.active !== false,
            }))
            .filter((row) => row.image),
          banners: form.banners
            .map((row, idx) => ({
              key: String(row.key || '').trim(),
              image: String(row.image || '').trim(),
              caption: String(row.caption || '').trim(),
              alt: String(row.alt || '').trim(),
              order: idx + 1,
              active: row.active !== false,
            }))
            .filter((row) => row.key && row.image),
          illustrations: (form.illustrations || [])
            .map((row, idx) => ({
              key: String(row.key || '').trim(),
              image: String(row.image || '').trim(),
              caption: '',
              alt: String(row.alt || '').trim(),
              order: idx + 1,
              active: row.active !== false,
            }))
            .filter((row) => row.key && row.image),
        },
      };

      const res = await api.put('/settings', payload);
      const ignored = res.data?.ignoredPaths || [];
      setFeedback({
        type: ignored.length ? 'warning' : 'success',
        text: ignored.length
          ? `Save ho gaya, lekin ye fields schema me nahi thi aur skip ho gayi: ${ignored.join(', ')}`
          : 'Website images live ho gayi hain — site reload karke dekh lo.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Save nahi ho paaya. Dobara koshish karo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">
            <Images className="w-3.5 h-3.5" />
            Website Images & Photo Showcase
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Put photos &amp; 3D artwork anywhere on the site</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Image ka link paste karo ya computer se upload karo — inner-page banners aur section ke andar wali
            illustrations (journey steps, CTA banner, Careers aur About artwork) turant update ho jaate hain. Koi bhi
            slot khaali chhodo to waha pehle wali built-in photo/drawing dikhti rehti hai.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            {photoCount} banners · {artCount} artwork live
          </span>

          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, enabled: prev.enabled === false }))}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              form.enabled === false
                ? 'bg-slate-800 text-slate-400'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {form.enabled === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {form.enabled === false ? 'Band Hidden' : 'Band Visible'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-mono ${
            feedback.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : feedback.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
      ) : (
        <>
          {/* The homepage mosaic + photo wall were retired when the sliding
              brand band took that space on the homepage. Leaving these photo
              pickers here would let the client fill pictures that never render,
              so they are gone — the saved rows are still in the database and the
              slots below (banners) plus 3D artwork are what the site reads. */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Images className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400">
              Homepage par ab photos ka mosaic/wall nahi hai — waha <span className="text-slate-200 font-semibold">sliding brand band</span>
              chalta hai (American FutureTech ka naam + disciplines). Isliye photo pickers hata diye gaye hain. Neeche
              <span className="text-slate-200 font-semibold"> page banners</span> aur <span className="text-slate-200 font-semibold">3D artwork</span> dono
              waise hi kaam karte hain.
            </p>
          </div>

          {/* Inner page banners */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-white font-heading">Page banners (5 pages)</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Har inner page ke top par ek wide banner photo + heading. Khaali chhodne par us page par banner nahi
              dikhta (page pehle jaisa hi rehta hai).
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {form.banners.map((row, idx) => (
                <PhotoRow
                  key={`banner-${row.key}`}
                  label={SITE_IMAGE_BANNERS[idx]?.label || row.key}
                  hint={`Page key: ${row.key}`}
                  value={row}
                  onChange={(next) => updateList('banners', idx, next)}
                  lines={2}
                />
              ))}
            </div>
          </div>

          {/* Section artwork: the client's own PNG/SVG inside the page sections */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white font-heading">3D artwork inside the sections</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-3xl">
                  Ye woh drawings hain jo page ke andar dikhti hain — home ka 5-step journey rail, navy CTA banner,
                  Careers ka partner-network card + form art, aur About page ki illustrations. Link paste karo ya PNG
                  upload karo: upload ki gayi image 3D me float karti hai, mouse le jaane par tilt hoti hai aur scroll par
                  halke se ukhad kar aati hai. Slot khaali chhodne par pehle wali built-in drawing hi dikhti rehti hai.
                </p>
              </div>
              <span className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shrink-0">
                {artCount}/{ILLUSTRATION_SLOTS.length} replaced
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ILLUSTRATION_SLOTS.map((slot, idx) => {
                const row = (form.illustrations || [])[idx] || { key: slot.key, image: '', alt: '', active: true };
                const custom = Boolean(row.image);
                return (
                  <div key={slot.key} className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-slate-200 font-bold truncate">{slot.label}</div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {slot.page} · slot {slot.key} · default: {slot.default}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            custom ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {custom ? 'Your image' : 'Shipped'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateIllustration(idx, { active: row.active === false })}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
                            row.active === false
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-blue-600/80 text-white hover:bg-blue-500'
                          }`}
                          title={row.active === false ? 'Hidden — shipped drawing dikhegi' : 'Live'}
                        >
                          {row.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <ImageUploadInput
                      label="Artwork — PNG / JPG / SVG / WebP"
                      value={row.image}
                      onChange={(url) => updateIllustration(idx, { image: url })}
                      previewSize="w-14 h-14"
                    />

                    <input
                      type="text"
                      value={row.alt}
                      onChange={(e) => updateIllustration(idx, { alt: e.target.value })}
                      placeholder={`Alt text (SEO) — default: ${slot.default}`}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-white/10 text-white text-[11px]"
                    />

                    {custom && (
                      <button
                        type="button"
                        onClick={() => updateIllustration(idx, { image: '', alt: '' })}
                        className="text-[10px] font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Apni image hatao — shipped drawing wapas
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
