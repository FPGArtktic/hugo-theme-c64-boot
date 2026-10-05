/**
 * notfound.js — print the path the reader actually asked for.
 *
 * textContent only: the path comes from the URL, so it must never reach the
 * parser as markup. Without JS the page already reads LOAD"$",8 and the same
 * ?FILE NOT FOUND  ERROR underneath it.
 */

const MAX = 40; // a C64 line, in 40-column mode

export default function initNotFound(root = document) {
  const slots = root.querySelectorAll('[data-notfound-path]');
  if (!slots.length) return;
  let path = window.location.pathname.toUpperCase();
  if (path.length > MAX) path = `${path.slice(0, MAX - 1)}…`;
  slots.forEach((slot) => {
    slot.textContent = path;
  });
}
