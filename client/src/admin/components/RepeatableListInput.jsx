import React, { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown, ClipboardPaste } from 'lucide-react';
import { parseBulletPoints } from '../../components/common/BulletContent';

/**
 * RepeatableListInput with Multi-Line Paste Auto-Split
 * 
 * Allows admins to:
 * - Enter individual items with Enter
 * - Paste multi-line bullet blocks (e.g. from job descriptions or syllabus)
 *   and automatically split them into distinct list items
 * - Reorder items up/down
 * - Remove individual items
 */
export default function RepeatableListInput({
  label,
  values = [],
  onChange,
  placeholder = 'Add an item and press Enter or paste a list...',
  helperText,
}) {
  const [inputValue, setInputValue] = useState('');

  const list = Array.isArray(values) ? values : [];

  const addItem = (item) => {
    const trimmed = item.trim();
    if (trimmed && !list.includes(trimmed)) {
      onChange([...list, trimmed]);
    }
  };

  const addMultiple = (items) => {
    const next = [...list];
    items.forEach((it) => {
      const trimmed = it.trim();
      if (trimmed && !next.includes(trimmed)) {
        next.push(trimmed);
      }
    });
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addItem(inputValue);
        setInputValue('');
      }
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text');
    if (!pastedText) return;

    const parsed = parseBulletPoints(pastedText);
    if (parsed.length > 1) {
      e.preventDefault();
      addMultiple(parsed);
      setInputValue('');
    }
  };

  const removeItem = (idx) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  const moveItem = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const next = [...list];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label} ({list.length})
        </label>
        {helperText && (
          <span className="text-[11px] text-slate-400">{helperText}</span>
        )}
      </div>

      {/* Input row with paste hint */}
      <div className="relative flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => {
            if (inputValue.trim()) {
              addItem(inputValue);
              setInputValue('');
            }
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <ClipboardPaste className="w-3 h-3 text-indigo-400" />
        <span>Tip: Paste multi-line text to auto-split into individual bullet items.</span>
      </p>

      {/* Item List */}
      {list.length > 0 && (
        <ul className="space-y-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
          {list.map((item, idx) => (
            <li
              key={idx}
              className="group flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="break-words leading-relaxed">{item}</span>
              </div>
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, -1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === list.length - 1}
                  onClick={() => moveItem(idx, 1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors ml-1"
                  title="Remove item"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
