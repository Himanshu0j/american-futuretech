import { useEffect } from 'react';

/**
 * Gives every form control in the admin panel an accessible name.
 *
 * Why this exists: the panel routinely renders the visible <label> as a SIBLING
 * of the control instead of nesting the control inside the label or wiring
 * htmlFor/id. That looks fine on screen but leaves the control nameless for
 * screen readers (axe "label" / "select-name" — critical), including the fields
 * inside modals and tabs that only mount after the admin clicks something.
 *
 * Rather than hand-editing hundreds of fields (and re-editing every new one),
 * this derives the name from the label the admin already sees. Controls that
 * name themselves (aria-label / aria-labelledby / title / wrapping <label> /
 * label[for]) are never touched, and nothing is ever removed — worst case a
 * control keeps the name it already had.
 *
 * A MutationObserver is used because admin content mounts asynchronously
 * (data fetches, tab switches, modals). Only childList is observed, so writing
 * aria-label cannot re-trigger the observer.
 */

const alreadyNamed = (field) => {
  if (field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby') || field.hasAttribute('title')) {
    return true;
  }
  if (field.closest('label')) return true;
  const id = field.getAttribute('id');
  if (id) {
    try {
      if (document.querySelector(`label[for="${CSS.escape(id)}"]`)) return true;
    } catch (error) {
      /* ignore selector edge cases */
    }
  }
  return false;
};

const nameFromVisibleLabel = (field) => {
  const isText = (node) => node && node.tagName === 'LABEL' && (node.textContent || '').trim().length > 0;

  // 1. The label immediately above the field (up to a couple of siblings back,
  //    which covers label → input → hint → range-slider groups).
  let sibling = field.previousElementSibling;
  for (let hops = 0; hops < 3 && sibling; hops += 1) {
    if (isText(sibling)) return sibling.textContent.trim();
    sibling = sibling.previousElementSibling;
  }

  // 2. The first label inside the same wrapper (e.g. <div><label/><input/><input/></div>).
  const wrapperLabel = field.parentElement?.querySelector(':scope > label');
  if (isText(wrapperLabel)) return wrapperLabel.textContent.trim();

  // 3. A table header for the column the control sits in.
  const cell = field.closest('td');
  if (cell) {
    const index = Array.prototype.indexOf.call(cell.parentElement?.children || [], cell);
    const header = cell.closest('table')?.querySelectorAll('thead th')[index];
    if (header && (header.textContent || '').trim()) return header.textContent.trim();
  }

  return '';
};

export default function useAutoFieldLabels(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const apply = () => {
      root.querySelectorAll('input, select, textarea').forEach((field) => {
        if (field.type === 'hidden' || alreadyNamed(field)) return;
        const name = nameFromVisibleLabel(field) || field.getAttribute('placeholder')?.trim() || '';
        if (name) field.setAttribute('aria-label', name);
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootRef]);
}
