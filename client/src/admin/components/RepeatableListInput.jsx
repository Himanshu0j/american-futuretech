import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Clipboard, X, Check, Sparkles } from 'lucide-react';
import { parseBulletPoints } from '../../components/common/BulletContent';

export default function RepeatableListInput({
  label,
  description,
  items = [],
  onChange,
  placeholder = 'Enter item...',
  minItems = 0,
  maxItems = 50,
  allowImport = true,
  badgeColor = 'cyan',
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleItemChange = (index, value) => {
    // If admin pastes multiple lines into an individual field, auto-split!
    if (value.includes('\n') || value.includes(';') || /[•*–—]/.test(value)) {
      const parsed = parseBulletPoints(value);
      if (parsed.length > 1) {
        const next = [...items];
        next.splice(index, 1, ...parsed);
        onChange(next);
        return;
      }
    }

    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleAddItem = () => {
    if (items.length >= maxItems) return;
    onChange([...items, '']);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= minItems) return;
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleMoveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  const handleExecuteImport = () => {
    if (!pasteText.trim()) return;
    const parsed = parseBulletPoints(pasteText);
    if (parsed.length > 0) {
      // Append parsed items to existing items
      const cleaned = items.filter(Boolean);
      onChange([...cleaned, ...parsed]);
      setPasteText('');
      setImportOpen(false);
    }
  };

  return (
    <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-heading uppercase text-white tracking-wider">
              {label}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
              {items.length} items
            </span>
          </div>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowImport && (
            <button
              type="button"
              onClick={() => setImportOpen(!importOpen)}
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              title="Paste a multi-line list to auto-split into individual items"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste Multi-Line Block</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Multi-Line Import Dropdown / Drawer */}
      {importOpen && (
        <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Multi-Line Paste Splitter
            </span>
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste multiple lines with bullets (•, -, *), numbers (1., 2.), or semicolons. They will be automatically split into individual fields.
          </p>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Example paste:\n• Build scalable applications\n• Work with APIs\n• Collaborate with team\n• Maintain production systems`}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-cyan-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Convert & Add to List</span>
            </button>
          </div>
        </div>
      )}

      {/* Item List */}
      {items.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
          No items yet. Click &quot;Add Item&quot; or &quot;Paste Multi-Line Block&quot; to insert entries.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 group bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <span className="w-6 text-center text-[10px] font-mono text-slate-500 shrink-0 select-none">
                #{idx + 1}
              </span>

              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(idx, e.target.value)}
                placeholder={`${placeholder} #${idx + 1}`}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveItem(idx, -1)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMoveItem(idx, 1)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer ml-1"
                  title="Remove Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
