import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PanelTop,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

const authHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  return { Authorization: `Bearer ${token}` };
};

const uid = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

// Mirrors the defaults in server/models/SiteSettings.js. Used until the server
// returns a saved `headerMenu` (fresh install or a database that predates it),
// so the editor always opens with a real menu instead of an empty screen.
const DEFAULT_HEADER_MENU = [
  { label: 'HOME', path: '/', placement: 'main', order: 1, active: true },
  { label: 'LIVE JOBS', path: '/jobs', placement: 'main', order: 2, active: true },
  { label: 'CAREER PROGRAMS', path: '/courses', placement: 'main', order: 3, active: true, hasDropdown: true },
  { label: 'SUCCESS STORIES', path: '/success-stories', placement: 'main', order: 4, active: true },
  { label: 'ABOUT US', path: '/about', placement: 'main', order: 5, active: true },
  { label: 'Privacy Policy', path: '/privacy', placement: 'more', order: 1, active: true },
  { label: 'Refund & Return Policy', path: '/refund-policy', placement: 'more', order: 2, active: true },
  { label: 'Cookie Policy', path: '/cookie-policy', placement: 'more', order: 3, active: true },
  { label: 'Terms & Conditions', path: '/terms', placement: 'more', order: 4, active: true },
  { label: 'Insights & Blog', path: '/blog', placement: 'more', order: 5, active: true },
  { label: 'Admissions FAQ', path: '/faq', placement: 'more', order: 6, active: true },
];

const normalizeItem = (item) => ({
  _key: item._id || uid(),
  label: item.label || '',
  path: item.path || '/',
  placement: item.placement === 'more' ? 'more' : 'main',
  order: Number(item.order) || 1,
  active: item.active !== false,
  hasDropdown: item.hasDropdown === true,
});

const sortByOrder = (list) =>
  [...list].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

const nextOrder = (list) =>
  list.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0) + 1;

const stripKeys = ({ _key, ...rest }) => rest;

export default function HeaderManager() {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings');
      const incoming = res.data?.settings?.headerMenu;
      setMenu(
        Array.isArray(incoming) && incoming.length > 0
          ? incoming.map(normalizeItem)
          : DEFAULT_HEADER_MENU.map(normalizeItem),
      );
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load the header menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateItem = (key, changes) => {
    setMenu((prev) => prev.map((item) => (item._key === key ? { ...item, ...changes } : item)));
  };

  const addItem = (placement) => {
    setMenu((prev) => [
      ...prev,
      normalizeItem({
        label: placement === 'main' ? 'NEW LINK' : 'New link',
        path: '/',
        placement,
        order: nextOrder(prev.filter((item) => item.placement === placement)),
        active: true,
      }),
    ]);
  };

  const removeItem = (key) => {
    setMenu((prev) => prev.filter((item) => item._key !== key));
  };

  // Reorder inside one section only — top-bar and MORE orders are independent,
  // exactly like the footer's per-column link order.
  const moveItem = (key, direction) => {
    setMenu((prev) => {
      const item = prev.find((entry) => entry._key === key);
      if (!item) return prev;
      const section = sortByOrder(prev.filter((entry) => entry.placement === item.placement));
      const index = section.findIndex((entry) => entry._key === key);
      const target = index + direction;
      if (target < 0 || target >= section.length) return prev;
      const reordered = [...section];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return [
        ...prev.filter((entry) => entry.placement !== item.placement),
        ...reordered.map((entry, i) => ({ ...entry, order: i + 1 })),
      ];
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const headerMenu = ['main', 'more'].flatMap((placement) =>
        sortByOrder(menu.filter((item) => item.placement === placement)).map((item, i) => ({
          ...stripKeys(item),
          placement,
          order: i + 1,
          hasDropdown: placement === 'main' ? item.hasDropdown === true : false,
        })),
      );
      await axios.put('/api/settings', { headerMenu }, { headers: authHeaders() });
      notify('success', 'Header menu saved. Refresh any public page to see it live.');
      load();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the header menu.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

  if (loading || !menu) {
    return <div className="p-10 text-center text-slate-400 font-mono text-xs">Loading header menu…</div>;
  }

  const mainItems = sortByOrder(menu.filter((item) => item.placement === 'main'));
  const moreItems = sortByOrder(menu.filter((item) => item.placement === 'more'));

  const renderRow = (item, index, sectionLength, isMain) => (
    <div key={item._key} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-950/70 border border-slate-800 p-2.5">
      <input
        aria-label={`${isMain ? 'Top bar' : 'More menu'} item ${index + 1} label`}
        value={item.label}
        onChange={(e) => updateItem(item._key, { label: e.target.value })}
        placeholder={isMain ? 'ABOUT US' : 'Privacy Policy'}
        className={`${inputClass} flex-1 min-w-[150px] font-bold`}
      />
      <input
        aria-label={`${isMain ? 'Top bar' : 'More menu'} item ${index + 1} link`}
        value={item.path}
        onChange={(e) => updateItem(item._key, { path: e.target.value })}
        placeholder="/about or https://…"
        className={`${inputClass} flex-1 min-w-[150px] font-mono text-slate-300`}
      />

      {/* Move between the top bar and the MORE dropdown */}
      <select
        aria-label={`${isMain ? 'Top bar' : 'More menu'} item ${index + 1} placement`}
        value={item.placement}
        onChange={(e) => updateItem(item._key, { placement: e.target.value })}
        className={`${inputClass} cursor-pointer`}
      >
        <option value="main">Top bar</option>
        <option value="more">More menu</option>
      </select>

      {isMain && (
        <button
          type="button"
          onClick={() => updateItem(item._key, { hasDropdown: !item.hasDropdown })}
          title={item.hasDropdown ? 'Programs dropdown ON (click to turn off)' : 'Turn the programs dropdown on'}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
            item.hasDropdown ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <ChevronDown className="w-3 h-3" />
          Dropdown
        </button>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <button
          type="button"
          onClick={() => moveItem(item._key, -1)}
          disabled={index === 0}
          title="Move up"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveItem(item._key, 1)}
          disabled={index === sectionLength - 1}
          title="Move down"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => updateItem(item._key, { active: !item.active })}
          title={item.active ? 'Hide without deleting' : 'Show this item'}
          className={`p-1.5 rounded-lg cursor-pointer ${
            item.active ? 'bg-blue-500/15 text-blue-300' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => removeItem(item._key)}
          title="Delete item"
          className="p-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono uppercase tracking-widest mb-2">
            <PanelTop className="w-3.5 h-3.5" />
            Header Menu CMS
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Header Navigation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Change the labels, links, order and visibility of the website's top menu — no code, no deploy.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Header Menu'}
        </button>
      </div>

      {feedback.message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs ${
          feedback.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-200'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Live preview of the saved order (hidden items shown struck through) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-white font-heading">Live preview</h2>
        <div className="flex flex-wrap items-center gap-2">
          {mainItems.map((item) => (
            <span
              key={item._key}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                item.active
                  ? 'bg-[#F7F7F5] text-[#002060] border border-slate-200'
                  : 'bg-slate-950 text-slate-500 border border-slate-800 line-through'
              }`}
            >
              {item.label || 'Untitled'}
              {item.hasDropdown && <ChevronDown className="w-3 h-3 inline ml-1 -mt-0.5" />}
            </span>
          ))}
          {moreItems.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300">
              MORE ▾ ({moreItems.filter((item) => item.active).length})
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-sans">
          Yehi order website ke top bar (aur mobile drawer) mein lagega. Line-through wale items save ke baad chhupe rahenge — delete karne ki zaroorat nahi.
        </p>
        <p className="text-[10px] text-slate-400 font-sans">
          <strong className="text-slate-300">Top bar ki limit:</strong> bade screens par pehle 5 links top bar mein dikhte hain,
          laptop/iPad width (1024–1279px) par pehle 3. Uske baad wale links apne aap "MORE" menu mein chale jate hain
          (gayab nahi hote) — order upar-neeche karke decide karo ki kaun top bar mein rahe. Mobile drawer mein saare links
          poore dikhte hain.
        </p>
      </div>

      {/* Top bar menu */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-heading">
            Top bar menu <span className="text-slate-400 font-normal">({mainItems.length})</span>
          </h2>
          <button
            onClick={() => addItem('main')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-bold hover:bg-blue-500/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Desktop navigation ki links — mobile drawer mein bhi yehi order chalta hai. "Dropdown" wale item ke saamne
          programs ka mega-panel khulta hai (CAREER PROGRAMS).
        </p>
        <div className="space-y-2">
          {mainItems.map((item, index) => renderRow(item, index, mainItems.length, true))}
          {mainItems.length === 0 && (
            <p className="text-[11px] text-slate-400">No top-bar items. Add one above.</p>
          )}
        </div>
      </div>

      {/* MORE menu */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-heading">
            "MORE" dropdown <span className="text-slate-400 font-normal">({moreItems.length})</span>
          </h2>
          <button
            onClick={() => addItem('more')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-bold hover:bg-blue-500/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Policies, blog aur FAQ jaise links yahan rehte hain. Saare items hide kar do to poora "MORE" button hi
          website se gayab ho jayega.
        </p>
        <div className="space-y-2">
          {moreItems.map((item, index) => renderRow(item, index, moreItems.length, false))}
          {moreItems.length === 0 && (
            <p className="text-[11px] text-slate-400">No MORE items. Add one above.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Header Menu'}
        </button>
      </div>
    </div>
  );
}
