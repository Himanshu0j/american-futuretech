import React, { useEffect, useState } from 'react';
import { Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ImageUploadInput from './ImageUploadInput';
import MenuLogoTile, { programMonogram } from '../../components/MenuLogoTile';

/**
 * Admin → Courses → "Menu Logo", with a live preview of what the header draws.
 *
 * Why the preview exists: this field used to be a URL box with a small
 * thumbnail of the raw file. An admin could upload a 16:9 banner, save, and only
 * discover from the live site that the header tile is a 36 px SQUARE — the
 * artwork ends up letterboxed into a thin strip, whole but tiny. Nothing about
 * the old field said that.
 *
 * So the panel below renders the real tile (client/src/components/MenuLogoTile)
 * in both header themes and at both header sizes, states which image the
 * dropdown is actually using — the menu logo, the card-image fallback, or the
 * title monogram — and flags artwork whose proportions do not match the tile.
 * The answer is on screen before the course is saved, not after.
 */

// The site's header has a light and a dark theme (see ThemeModeContext), and the
// tile takes a different background in each. Previewing one would hide half the
// answer: a logo with a white plate behind it looks right in one, wrong in the
// other. `wrap: 'dark'` is Tailwind's class strategy (tailwind.config.js), so it
// turns on the `dark:` variants for that subtree only.
const THEMES = [
  { key: 'light', label: 'Light header', wrap: '' },
  { key: 'dark', label: 'Dark header', wrap: 'dark' },
];

const SOURCE_STYLE = {
  logo: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  card: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  monogram: 'text-slate-300 border-slate-600/40 bg-slate-500/10',
};

export default function MenuLogoField({
  value,
  onChange,
  cardImage = '',
  title = '',
  duration = '',
}) {
  const logo = String(value || '').trim();
  const card = String(cardImage || '').trim();
  // The dropdown's own fallback chain (Navbar.jsx): menuLogo → card image →
  // monogram. The preview must walk the same chain or it would show a tile the
  // header never draws.
  const shown = logo || card;
  const source = logo ? 'logo' : card ? 'card' : 'monogram';

  const sourceLabel = source === 'logo'
    ? 'menu logo'
    : source === 'card'
      ? 'card image (fallback)'
      : `monogram ${programMonogram(title)} (fallback)`;

  // The artwork's real proportions. A non-square upload is the mistake this
  // field keeps inviting, so it is called out here rather than left for the
  // client to spot on the live site.
  const [ratio, setRatio] = useState(null);
  useEffect(() => {
    if (!logo) {
      setRatio(null);
      return undefined;
    }
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      setRatio(probe.naturalWidth && probe.naturalHeight ? probe.naturalWidth / probe.naturalHeight : null);
    };
    // A URL that does not load is reported by ImageUploadInput's own thumbnail;
    // the tile falls back to the monogram, so there is no ratio to warn about.
    probe.onerror = () => { if (!cancelled) setRatio(null); };
    probe.src = logo;
    return () => { cancelled = true; };
  }, [logo]);

  const offSquare = ratio !== null && (ratio > 1.15 || ratio < 0.87);
  const square = logo && ratio !== null && !offSquare;

  return (
    <div className="space-y-3">
      <ImageUploadInput
        label="Menu Logo — header ke CAREER PROGRAMS dropdown me dikhta hai"
        value={value}
        onChange={onChange}
        placeholder="Square logo (about 200×200) — URL or upload. Khaali chhodne par card image dikhegi."
        previewSize="w-14 h-14"
      />

      <div className="rounded-2xl border border-white/[0.08] bg-slate-950/70 p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Header preview — menu me aise dikhega</span>
          </h4>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${SOURCE_STYLE[source]}`}>
            tile: {sourceLabel}
          </span>
        </div>

        {/* Both header themes, both with the tile the header really renders. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <div
              key={theme.key}
              className={`${theme.wrap} rounded-xl overflow-hidden border border-white/[0.08]`}
            >
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-900 border-b border-white/[0.08]">
                {theme.label}
              </div>
              <div className="bg-white dark:bg-slate-900 p-2">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <MenuLogoTile src={shown} title={title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[color:rgb(var(--tw-ink-900))] dark:text-slate-100">
                      <span className="truncate pr-2">{String(title || '').trim() || 'Program title'}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono font-normal">
                        {String(duration || '').trim() || '6 Months'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
                      tile: {sourceLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The two sizes the header uses. */}
        <div className="rounded-xl bg-white p-2.5 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2">
            <MenuLogoTile src={shown} title={title} />
            <span className="text-[10px] font-mono text-slate-500">36 px — desktop dropdown</span>
          </span>
          <span className="flex items-center gap-2">
            <MenuLogoTile src={shown} title={title} size="sm" />
            <span className="text-[10px] font-mono text-slate-500">28 px — mobile menu</span>
          </span>
        </div>

        {square && (
          <p className="flex items-start gap-2 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Square artwork ({ratio.toFixed(2)}:1) — tile ko poora bhar raha hai.</span>
          </p>
        )}

        {offSquare && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Yeh artwork {ratio.toFixed(2)}:1 hai, tile square (1:1) hai — isliye yeh tile ke andar
              {ratio > 1 ? ' ek chhoti patti' : ' patli'} ki tarah fit hoga (kuch crop nahi hota, bas chhota dikhega).
              Square version tile ko poora bhar dega.
            </span>
          </p>
        )}

        <ul className="space-y-1 text-[11px] text-slate-400 list-none">
          <li>
            <span className="text-slate-300">Square (1:1) artwork</span> is what this tile wants — about 200×200
            ya zyada, PNG / WebP / SVG.
          </li>
          <li>Square na ho to bhi chalega: kuch crop nahi hota, tile ke andar poora fit hota hai — upar preview me turant dikh jayega.</li>
          <li>Transparent PNG theek hai — peeche tile ka apna background (light: halka grey, dark: slate) dikhta hai.</li>
          <li>Khaali chhodne par: pehle course card image, phir title ka monogram (jaise DS) — tile khaali nahi rehta.</li>
        </ul>

        <p className="text-[10px] font-mono text-slate-500">
          Yeh preview header ke asli tile component se banta hai (desktop 36 px), isliye jo yahan dikh raha hai
          wahi website par lagega.
        </p>
      </div>
    </div>
  );
}
