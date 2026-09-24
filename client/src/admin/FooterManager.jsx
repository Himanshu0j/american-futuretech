import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PanelBottom,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import ImageUploadInput from './components/ImageUploadInput';

const authHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  return { Authorization: `Bearer ${token}` };
};

const uid = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

const normalizeLink = (link) => ({
  _key: link._id || uid(),
  label: link.label || '',
  url: link.url || '',
  order: Number(link.order) || 1,
  active: link.active !== false,
});

const normalizeColumn = (column) => ({
  _key: column._id || uid(),
  title: column.title || 'New Column',
  order: Number(column.order) || 1,
  active: column.active !== false,
  links: (column.links || []).map(normalizeLink),
});

const sortByOrder = (list) =>
  [...list].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

const nextOrder = (list) =>
  list.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0) + 1;

const stripKeys = (item) => {
  const { _key, links, ...rest } = item;
  return {
    ...rest,
    ...(links ? { links: links.map(stripKeys) } : {}),
  };
};

export default function FooterManager() {
  const [footer, setFooter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [expanded, setExpanded] = useState({});

  const notify = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings');
      const incoming = res.data?.settings?.footer || {};
      setFooter({
        enabled: incoming.enabled !== false,
        logo: incoming.logo || '/images/logo-horizontal-white.webp',
        logoWidth: Number(incoming.logoWidth) || 160,
        description: incoming.description || '',
        badgeText: incoming.badgeText || '',
        copyrightText: incoming.copyrightText || '',
        hiringStrip: {
          enabled: incoming.hiringStrip?.enabled !== false,
          text: incoming.hiringStrip?.text || '',
        },
        cta: {
          enabled: incoming.cta?.enabled !== false,
          label: incoming.cta?.label || '',
          url: incoming.cta?.url || '',
        },
        columns: (incoming.columns || []).map(normalizeColumn),
        legalLinks: (incoming.legalLinks || []).map(normalizeLink),
      });
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not load the footer settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (changes) => setFooter((prev) => ({ ...prev, ...changes }));

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        footer: {
          enabled: footer.enabled,
          logo: footer.logo,
          logoWidth: Number(footer.logoWidth) || 160,
          description: footer.description,
          badgeText: footer.badgeText,
          copyrightText: footer.copyrightText,
          hiringStrip: footer.hiringStrip,
          cta: footer.cta,
          columns: sortByOrder(footer.columns).map(stripKeys),
          legalLinks: sortByOrder(footer.legalLinks).map(stripKeys),
        },
      };
      await axios.put('/api/settings', payload, { headers: authHeaders() });
      notify('success', 'Footer saved. Refresh any public page to see it live.');
      load();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Could not save the footer.');
    } finally {
      setSaving(false);
    }
  };

  const moveColumn = (index, direction) => {
    setFooter((prev) => {
      const sorted = sortByOrder(prev.columns);
      const target = index + direction;
      if (target < 0 || target >= sorted.length) return prev;
      const reordered = [...sorted];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return { ...prev, columns: reordered.map((col, i) => ({ ...col, order: i + 1 })) };
    });
  };

  const moveLink = (columnKey, linkIndex, direction) => {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column._key !== columnKey) return column;
        const sorted = sortByOrder(column.links);
        const target = linkIndex + direction;
        if (target < 0 || target >= sorted.length) return column;
        const reordered = [...sorted];
        [reordered[linkIndex], reordered[target]] = [reordered[target], reordered[linkIndex]];
        return { ...column, links: reordered.map((link, i) => ({ ...link, order: i + 1 })) };
      }),
    }));
  };

  const updateColumn = (key, changes) => {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => (column._key === key ? { ...column, ...changes } : column)),
    }));
  };

  const updateLink = (columnKey, linkKey, changes) => {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => (
        column._key === columnKey
          ? { ...column, links: column.links.map((l) => (l._key === linkKey ? { ...l, ...changes } : l)) }
          : column
      )),
    }));
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1';

  if (loading || !footer) {
    return <div className="p-10 text-center text-slate-500 font-mono text-xs">Loading footer CMS…</div>;
  }

  const sortedColumns = sortByOrder(footer.columns);
  const sortedLegal = sortByOrder(footer.legalLinks);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-2">
            <PanelBottom className="w-3.5 h-3.5" />
            Footer CMS
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Footer Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Add or remove columns and links, reorder them, hide any item without deleting it, and resize the
            footer logo. Saved changes appear on every public page.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Footer'}
        </button>
      </div>

      {feedback.message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs ${
          feedback.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Brand block */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-heading">Brand &amp; identity</h2>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={footer.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
              className="accent-indigo-500"
            />
            Footer visible on the website
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ImageUploadInput
              label="Footer logo"
              value={footer.logo}
              onChange={(url) => patch({ logo: url })}
              placeholder="Upload a PNG/SVG or paste a URL…"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Logo width (px)</label>
              <input
                type="number"
                min="40"
                max="400"
                value={footer.logoWidth}
                onChange={(e) => patch({ logoWidth: Number(e.target.value) || 160 })}
                className={inputClass}
              />
              <input
                type="range"
                min="40"
                max="320"
                value={footer.logoWidth}
                onChange={(e) => patch({ logoWidth: Number(e.target.value) })}
                className="w-full mt-2 accent-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-sans">Height scales automatically — the logo never stretches.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[64px]">
              {footer.logo ? (
                <img
                  src={footer.logo}
                  alt="Footer logo preview"
                  style={{ width: `${footer.logoWidth}px`, height: 'auto' }}
                  className="max-w-full object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-500">No logo selected</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              value={footer.description}
              onChange={(e) => patch({ description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Credential badge text</label>
              <input
                value={footer.badgeText}
                onChange={(e) => patch({ badgeText: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Copyright line</label>
              <input
                value={footer.copyrightText}
                onChange={(e) => patch({ copyrightText: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div className="lg:col-span-2">
            <label className={labelClass}>Hiring strip text</label>
            <input
              value={footer.hiringStrip.text}
              onChange={(e) => patch({ hiringStrip: { ...footer.hiringStrip, text: e.target.value } })}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={footer.hiringStrip.enabled}
                onChange={(e) => patch({ hiringStrip: { ...footer.hiringStrip, enabled: e.target.checked } })}
                className="accent-indigo-500"
              />
              Show partner-logo strip
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className={labelClass}>CTA button label</label>
            <input
              value={footer.cta.label}
              onChange={(e) => patch({ cta: { ...footer.cta, label: e.target.value } })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>CTA link (blank = open the enquiry form)</label>
            <input
              value={footer.cta.url}
              onChange={(e) => patch({ cta: { ...footer.cta, url: e.target.value } })}
              placeholder="/contact or https://…"
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={footer.cta.enabled}
                onChange={(e) => patch({ cta: { ...footer.cta, enabled: e.target.checked } })}
                className="accent-indigo-500"
              />
              Show CTA button
            </label>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-heading">
            Footer columns <span className="text-slate-500 font-normal">({sortedColumns.length})</span>
          </h2>
          <button
            onClick={() => {
              const key = uid();
              patch({
                columns: [
                  ...footer.columns,
                  { _key: key, title: 'New Column', order: nextOrder(footer.columns), active: true, links: [] },
                ],
              });
              setExpanded((prev) => ({ ...prev, [key]: true }));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-bold hover:bg-indigo-500/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add column
          </button>
        </div>

        <div className="space-y-3">
          {sortedColumns.map((column, index) => {
            const isOpen = expanded[column._key];
            const links = sortByOrder(column.links);
            return (
              <div key={column._key} className="rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <GripVertical className="w-4 h-4 text-slate-600" />
                  <input
                    value={column.title}
                    onChange={(e) => updateColumn(column._key, { title: e.target.value })}
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] font-mono text-slate-500">{links.length} link(s)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveColumn(index, -1)}
                      disabled={index === 0}
                      title="Move up"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveColumn(index, 1)}
                      disabled={index === sortedColumns.length - 1}
                      title="Move down"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateColumn(column._key, { active: !column.active })}
                      title={column.active ? 'Hide column' : 'Show column'}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        column.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {column.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [column._key]: !prev[column._key] }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold hover:text-white cursor-pointer"
                    >
                      {isOpen ? 'Close' : 'Edit links'}
                    </button>
                    <button
                      onClick={() => patch({ columns: footer.columns.filter((c) => c._key !== column._key) })}
                      title="Delete column"
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-800 p-3 space-y-2">
                    {links.length === 0 && (
                      <p className="text-[11px] text-slate-500">No links yet. Add one below.</p>
                    )}
                    {links.map((link, linkIndex) => (
                      <div key={link._key} className="flex flex-wrap items-center gap-2">
                        <input
                          value={link.label}
                          onChange={(e) => updateLink(column._key, link._key, { label: e.target.value })}
                          placeholder="Link label"
                          className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          value={link.url}
                          onChange={(e) => updateLink(column._key, link._key, { url: e.target.value })}
                          placeholder="/courses or https://…"
                          className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveLink(column._key, linkIndex, -1)}
                            disabled={linkIndex === 0}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveLink(column._key, linkIndex, 1)}
                            disabled={linkIndex === links.length - 1}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateLink(column._key, link._key, { active: !link.active })}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              link.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
                            }`}
                            title={link.active ? 'Hide link' : 'Show link'}
                          >
                            {link.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => updateColumn(column._key, {
                              links: column.links.filter((l) => l._key !== link._key),
                            })}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                            title="Delete link"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => updateColumn(column._key, {
                        links: [
                          ...column.links,
                          { _key: uid(), label: 'New link', url: '/', order: nextOrder(column.links), active: true },
                        ],
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add link
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal links */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-heading">Bottom legal links</h2>
          <button
            onClick={() => patch({
              legalLinks: [...footer.legalLinks, normalizeLink({ label: 'New link', url: '/' })],
            })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-bold hover:bg-indigo-500/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add link
          </button>
        </div>

        <div className="space-y-2">
          {sortedLegal.map((link, index) => (
            <div key={link._key} className="flex flex-wrap items-center gap-2">
              <input
                value={link.label}
                onChange={(e) => setFooter((prev) => ({
                  ...prev,
                  legalLinks: prev.legalLinks.map((l) => (l._key === link._key ? { ...l, label: e.target.value } : l)),
                }))}
                className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <input
                value={link.url}
                onChange={(e) => setFooter((prev) => ({
                  ...prev,
                  legalLinks: prev.legalLinks.map((l) => (l._key === link._key ? { ...l, url: e.target.value } : l)),
                }))}
                className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setFooter((prev) => ({
                  ...prev,
                  legalLinks: prev.legalLinks.map((l) => (l._key === link._key ? { ...l, active: !l.active } : l)),
                }))}
                className={`p-1.5 rounded-lg cursor-pointer ${link.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}
                title={link.active ? 'Hide' : 'Show'}
              >
                {link.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[10px] font-mono text-slate-500">#{index + 1}</span>
              <button
                onClick={() => setFooter((prev) => ({
                  ...prev,
                  legalLinks: prev.legalLinks.filter((l) => l._key !== link._key),
                }))}
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Footer'}
        </button>
      </div>
    </div>
  );
}
