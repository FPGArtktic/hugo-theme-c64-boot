/**
 * dir-keys.js — arrow keys move a reverse-video cursor down the directory,
 * Enter opens the entry (CLAUDE.md 7).
 *
 * The listener is on the list, not the document: arrow keys must keep
 * scrolling the page everywhere else. Pure enhancement — every entry is an
 * <a>, so Tab, Enter and click already work without this file.
 */

export default function initDirKeys(root = document) {
  const list = root.querySelector('.dir__list');
  if (!list) return;
  const entries = [...list.querySelectorAll('.dir__entry')];
  if (entries.length < 2) return;

  const mark = (el) => {
    entries.forEach((entry) => entry.classList.toggle('is-cursor', entry === el));
  };

  list.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const step = { ArrowDown: 1, ArrowUp: -1, Home: 0, End: entries.length - 1 }[event.key];
    if (step === undefined) return;
    const from = entries.indexOf(event.target.closest('.dir__entry'));
    const to =
      event.key === 'Home' || event.key === 'End'
        ? step
        : (from + step + entries.length) % entries.length;
    event.preventDefault();
    entries[to].focus();
  });

  list.addEventListener('focusin', (event) => mark(event.target.closest('.dir__entry')));
  list.addEventListener('focusout', (event) => {
    if (!list.contains(event.relatedTarget)) mark(null);
  });
}
