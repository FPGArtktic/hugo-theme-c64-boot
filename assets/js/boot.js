/**
 * boot.js — reveal the switch-on sequence that boot.html already contains.
 *
 * Every line is in the DOM before this file runs; all we do is make lines
 * visible on a timer and type the two lines that the operator would have
 * typed. Nothing here creates content, so the page is complete without JS.
 *
 * Budget: 2.6 s to READY., 3.0 s hard ceiling (CLAUDE.md 6).
 */

const TYPE_STEP = 40; // ms per character, about a fast typist on a C64
const LOADER_IN = 1450; // after the LOAD line has finished typing
const LOADER_OUT = 2300;
const FINISH = 2600;

/** sessionStorage is unavailable in some privacy modes; never let it throw. */
function remember(key) {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    /* private mode: the boot simply replays next time */
  }
}

export default function boot(root = document) {
  const el = root.querySelector('.boot');
  if (!el) return;

  const html = root.documentElement;

  const finish = () => {
    html.classList.remove('is-booting');
    document.body.classList.remove('is-loading');
    html.classList.add('is-booted');
    el.querySelectorAll('.boot__line').forEach((line) => {
      const full = line.dataset.text;
      if (full) line.textContent = full;
      line.classList.add('is-shown');
    });
    document.dispatchEvent(new CustomEvent('c64:booted'));
  };

  /*
   * Whether to boot at all was decided by the inline script in head.html,
   * before the first paint — see the comment there. Doing it here instead
   * costs a layout shift, because the block is display:none until the class
   * lands. This module only runs the sequence.
   */
  if (!html.classList.contains('is-booting')) return;
  remember('booted');

  const lines = [...el.querySelectorAll('.boot__line')];
  // Typed lines keep their text in data-text so the no-JS page still shows it.
  lines.forEach((line) => {
    if (line.dataset.type !== undefined) {
      line.dataset.text = line.textContent;
      line.textContent = '';
    }
  });

  document.dispatchEvent(new CustomEvent('c64:boot'));

  const timers = [];
  const at = (ms, fn) => timers.push(window.setTimeout(fn, ms));

  const type = (line) => {
    const full = line.dataset.text || '';
    line.classList.add('is-shown');
    [...full].forEach((ch, i) => {
      at(Number(line.dataset.at) + i * TYPE_STEP, () => {
        line.textContent += ch;
      });
    });
  };

  lines.forEach((line) => {
    const ms = Number(line.dataset.at) || 0;
    if (line.dataset.type !== undefined) {
      at(ms, () => type(line));
    } else {
      at(ms, () => line.classList.add('is-shown'));
    }
  });

  at(LOADER_IN, () => document.body.classList.add('is-loading'));
  at(LOADER_OUT, () => document.body.classList.remove('is-loading'));
  at(FINISH, finish);

  const skip = () => {
    timers.forEach(window.clearTimeout);
    finish();
  };

  // Any key, click or tap skips, as it would on a real loader.
  const opts = { once: true, passive: true };
  ['keydown', 'pointerdown'].forEach((type_) => document.addEventListener(type_, skip, opts));
  const link = el.querySelector('.boot__skip');
  if (link) link.addEventListener('click', skip, { once: true });
}
