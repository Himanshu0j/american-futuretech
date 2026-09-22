import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardPaste,
  Check,
  X,
  ListPlus,
  Sparkles,
  Layers
} from 'lucide-react';
import { parseContentPoints } from '../../components/common/ContentParser';

export default function ListItemsEditor({
  label = 'Key Points / Responsibilities',
  items = [],
  onChange,
  placeholder = 'Enter item detail...',
  outputFormat = 'array', // 'array' | 'newline'
  helperText = 'Add individual pointers or click "Paste Multiple Lines" to auto-split text into bullet points.',
  className = '',
}) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [appendMode, setAppendMode] = useState(true);

  // Normalize current items to an array of strings
  const currentItems = Array.isArray(items)
    ? items
    : typeof items === 'string'
    ? parseContentPoints(items)
    : [];

  const emitChange = (newItems) => {
    if (outputFormat === 'newline') {
      onChange(newItems.join('\n'));
    } else {
      onChange(newItems);
    }
  };

  const handleAddItem = () => {
    emitChange([...currentItems, '']);
  };

  const handleUpdateItem = (index, value) => {
    const updated = [...currentItems];
    updated[index] = value;
    emitChange(updated);
  };

  const handleDeleteItem = (index) => {
    const updated = currentItems.filter((_, i) => i !== index);
    emitChange(updated);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...currentItems];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    emitChange(updated);
  };

  const handleMoveDown = (index) => {
    if (index >= currentItems.length - 1) return;
    const updated = [...currentItems];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    emitChange(updated);
  };

  const handleApplyPasted = () => {
    const parsed = parseContentPoints(pasteContent);
    if (parsed.length === 0) {
      setShowPasteModal(false);
      return;
    }

    if (appendMode) {
      emitChange([...currentItems, ...parsed]);
    } else {
      emitChange(parsed);
    }

    setPasteContent('');
    setShowPasteModal(false);
  };

  return (
    <div className={`space-y-3 text-left font-sans ${className}`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{label}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
              {currentItems.length} {currentItems.length === 1 ? 'item' : 'items'}
            </span>
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Paste Multiple Lines Action */}
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Paste multiple lines of text to automatically split into bullet points"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paste Multiple Lines</span>
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pointer</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      {currentItems.length === 0 ? (
        <div
          onClick={handleAddItem}
          className="p-5 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 hover:border-sky-500/40 text-center cursor-pointer transition-colors group"
        >
          <div className="text-xs text-slate-500 group-hover:text-sky-400 flex items-center justify-center gap-2">
            <ListPlus className="w-4 h-4" />
            <span>No points added yet. Click to add the first pointer or use "Paste Multiple Lines".</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800/90 focus-within:border-sky-500/50 transition-colors shadow-inner"
            >
              {/* Order Indicator */}
              <span className="w-6 text-center text-[10px] font-mono font-bold text-slate-500 shrink-0">
                {idx + 1}.
              </span>

              {/* Input */}
              <input
                type="text"
                value={item}
                onChange={(e) => handleUpdateItem(idx, e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
              />

              {/* Reorder Buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === currentItems.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteItem(idx)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0"
                title="Remove Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paste Multiple Lines Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-white/[0.12] p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Paste Multiple Lines</h3>
                  <p className="text-[11px] text-slate-400">
                    Paste raw text. Newlines, bullets (•, -), or numbers (1.) will automatically become separate items.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              rows={7}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Build React applications&#10;Work with REST APIs&#10;Create reusable components&#10;Deploy to production on AWS"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed"
            />

            {/* Mode selection & submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pasteMode"
                    checked={appendMode}
                    onChange={() => setAppendMode(true)}
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>Append to existing</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pasteMode"
                    checked={!appendMode}
                    onChange={() => setAppendMode(false)}
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>Replace current items</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyPasted}
                  disabled={!pasteContent.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Convert into Pointers</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
