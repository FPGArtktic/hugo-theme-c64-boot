/**
 * palette.js — the switcher, and the POKE colours behind it.
 *
 * The flash-free part of this job is not here: a two-line inline script in
 * head.html sets data-palette from storage before the first stylesheet, which
 * is the only way to beat the first paint. This module adds the UI, keeps
 * theme-color in step, and exposes the setters prompt.js needs for
 * POKE 53280 / 53281 / 646.
 */

export const KEY = 'palette';
export const POKE_KEY = 'poke';

const html = document.documentElement;

export function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

/** The browser chrome takes the border colour, so the frame leaves the page. */
function syncThemeColor() {
  const border = getComputedStyle(html).getPropertyValue('--c-border').trim();
  if (!border) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta, i) => {
    // Drop the media-scoped pair once a palette is pinned: it would override.
    if (i === 0) meta.removeAttribute('media');
    else meta.remove();
    meta.setAttribute('content', border);
  });
}

export function setPalette(name, { persist = true } = {}) {
  html.setAttribute('data-palette', name);
  if (persist) write(KEY, name);
  syncThemeColor();
  document.dispatchEvent(new CustomEvent('c64:palette', { detail: { name } }));
}

/**
 * POKE 53280,n / 53281,n / 646,n — border, screen and text from the C64 ramp.
 * Stored as a compact "b,s,t" triple with -1 for "not poked".
 */
export function setPokes({ border, screen, text }, { persist = true } = {}) {
  const ramp = (n) => `var(--c64-${n})`;
  if (Number.isInteger(border)) html.style.setProperty('--c-border', ramp(border));
  if (Number.isInteger(screen)) html.style.setProperty('--c-screen', ramp(screen));
  if (Number.isInteger(text)) html.style.setProperty('--c-text', ramp(text));
  if (persist) {
    const current = pokes();
    const next = {
      border: Number.isInteger(border) ? border : current.border,
      screen: Number.isInteger(screen) ? screen : current.screen,
      text: Number.isInteger(text) ? text : current.text,
    };
    write(POKE_KEY, `${next.border},${next.screen},${next.text}`);
  }
  syncThemeColor();
}

export function pokes() {
  const raw = (read(POKE_KEY) || '-1,-1,-1').split(',').map(Number);
  const ok = (n) => (Number.isInteger(n) && n >= 0 && n <= 15 ? n : -1);
  return { border: ok(raw[0]), screen: ok(raw[1]), text: ok(raw[2]) };
}

/** SYS 64738: drop every custom colour and go back to the configured palette. */
export function reset() {
  ['--c-border', '--c-screen', '--c-text'].forEach((p) => html.style.removeProperty(p));
  html.removeAttribute('data-palette');
  write(KEY, null);
  write(POKE_KEY, null);
  syncThemeColor();
  document.dispatchEvent(new CustomEvent('c64:palette', { detail: { name: null } }));
}

function markPressed(root, name) {
  root.querySelectorAll('.palette__btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.palette === name));
  });
}

export default function initPalette(root = document) {
  const stored = pokes();
  if (stored.border >= 0 || stored.screen >= 0 || stored.text >= 0) {
    setPokes(
      {
        border: stored.border >= 0 ? stored.border : undefined,
        screen: stored.screen >= 0 ? stored.screen : undefined,
        text: stored.text >= 0 ? stored.text : undefined,
      },
      { persist: false },
    );
  }

  const el = root.querySelector('.palette');
  if (!el) {
    syncThemeColor();
    return;
  }

  markPressed(el, html.getAttribute('data-palette'));

  // One listener for the whole switcher; the buttons carry the palette name.
  el.addEventListener('click', (event) => {
    const btn = event.target.closest('.palette__btn');
    if (!btn || !el.contains(btn)) return;
    const { palette } = btn.dataset;
    if (!palette) return;
    reset();
    setPalette(palette);
    markPressed(el, palette);
    const poke = el.querySelector('.palette__poke');
    if (poke && btn.dataset.poke) poke.textContent = btn.dataset.poke;
  });

  document.addEventListener('c64:palette', (event) => markPressed(el, event.detail.name));
}
