/**
 * tab.js — the browser tab is part of the screen (CLAUDE.md 15).
 *
 * The <title> Hugo rendered stays authoritative for history, bookmarks and
 * search engines; this only borrows it while the machine is busy or the tab
 * is in the background. Safari ignores dynamic favicons, which is fine.
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
const PERIOD = 625; // ms — the 1.6 Hz cursor, same as the CSS

export default function initTab() {
  const original = document.title;
  const icon = document.querySelector('link[rel="icon"][data-dynamic]');
  let timer = 0;
  let on = true;

  const paint = (lit) => {
    if (!icon || !window.HTMLCanvasElement) return;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const style = getComputedStyle(document.documentElement);
    const read = (token) => {
      const raw = style.getPropertyValue(token).trim();
      const hop = raw.match(/var\(\s*(--[\w-]+)/);
      return (hop ? style.getPropertyValue(hop[1]).trim() : raw) || '#000';
    };
    ctx.fillStyle = read('--c-border');
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = read('--c-screen');
    ctx.fillRect(2, 2, 28, 28);
    if (lit) {
      ctx.fillStyle = read('--c-bright');
      ctx.fillRect(8, 6, 16, 20);
    }
    icon.href = canvas.toDataURL('image/png');
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
    on = true;
    document.title = original;
    paint(true);
  };

  document.addEventListener('c64:boot', () => {
    document.title = 'LOADING';
  });
  document.addEventListener('c64:booted', () => {
    if (document.visibilityState === 'visible') stop();
  });
  document.addEventListener('c64:palette', () => paint(on));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      stop();
      return;
    }
    if (REDUCED.matches) {
      document.title = 'READY.';
      return;
    }
    timer = window.setInterval(() => {
      on = !on;
      document.title = on ? 'READY.█' : 'READY. ';
      paint(on);
    }, PERIOD);
  });

  paint(true);
}
