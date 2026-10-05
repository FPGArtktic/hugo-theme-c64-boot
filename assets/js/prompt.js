/**
 * prompt.js — a small, honest BASIC console (CLAUDE.md 8.2).
 *
 * Rules it keeps: no eval, no innerHTML, no network. Output lines are built
 * with createElement + textContent, so a path or a PRINT string can never
 * become markup. The page directory comes from a JSON block Hugo renders into
 * prompt.html, so LIST and LOAD need no request.
 */

import { pokes, reset, setPokes } from './palette.js';

const ERR = {
  syntax: '?SYNTAX  ERROR',
  file: '?FILE NOT FOUND  ERROR',
  quantity: '?ILLEGAL QUANTITY  ERROR',
};
const AA = 4.5;

function srgb(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255);
}

/** Resolve a token to #rrggbb, following one var() hop into the C64 ramp. */
function resolve(token) {
  const style = getComputedStyle(document.documentElement);
  const raw = style.getPropertyValue(token).trim();
  const hop = raw.match(/var\(\s*(--[\w-]+)/);
  const value = hop ? style.getPropertyValue(hop[1]).trim() : raw;
  return /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Integer arithmetic for PRINT. Shunting-yard, so nothing is ever evaluated. */
function arithmetic(src) {
  const tokens = src.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
  if (!tokens || tokens.join('') !== src.replace(/\s+/g, '')) return null;
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const out = [];
  const ops = [];
  for (const t of tokens) {
    if (/\d/.test(t)) out.push(Number(t));
    else if (t === '(') ops.push(t);
    else if (t === ')') {
      while (ops.length && ops.at(-1) !== '(') out.push(ops.pop());
      if (ops.pop() !== '(') return null;
    } else {
      while (ops.length && prec[ops.at(-1)] >= prec[t]) out.push(ops.pop());
      ops.push(t);
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === '(') return null;
    out.push(op);
  }
  const stack = [];
  for (const t of out) {
    if (typeof t === 'number') stack.push(t);
    else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return null;
      stack.push(op(a, b, t));
    }
  }
  return stack.length === 1 && Number.isFinite(stack[0]) ? stack[0] : null;
}

function op(a, b, sign) {
  if (sign === '+') return a + b;
  if (sign === '-') return a - b;
  if (sign === '*') return a * b;
  return b === 0 ? NaN : a / b;
}

export default function initPrompt(root = document) {
  const el = root.querySelector('.prompt');
  if (!el) return;

  const out = el.querySelector('.prompt__out');
  const form = el.querySelector('.prompt__form');
  const input = el.querySelector('.prompt__input');
  const hotkey = el.dataset.hotkey || '`';
  const pages = JSON.parse(root.getElementById('c64-dir')?.textContent || '[]');
  let opener = null;
  let maze = null;

  const say = (text, kind) => {
    const line = document.createElement('span');
    line.className = kind ? `prompt__line prompt__line--${kind}` : 'prompt__line';
    line.textContent = text;
    out.append(line);
    el.scrollTop = el.scrollHeight;
    return line;
  };

  const close = () => {
    stopMaze();
    el.hidden = true;
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  };

  const open = (from) => {
    opener = from || document.activeElement;
    el.hidden = false;
    input.focus();
  };

  function stopMaze() {
    if (!maze) return;
    window.clearInterval(maze.timer);
    document.removeEventListener('keydown', maze.stop);
    maze = null;
  }

  function runMaze() {
    const line = say('', 'ok');
    line.className = 'prompt__maze';
    const stop = () => stopMaze();
    const timer = window.setInterval(() => {
      let chunk = '';
      for (let i = 0; i < 40; i += 1) chunk += Math.random() < 0.5 ? '/' : '\\';
      line.textContent += chunk;
      if (line.textContent.length > 4000) stopMaze();
      el.scrollTop = el.scrollHeight;
    }, 100);
    maze = { timer, stop };
    document.addEventListener('keydown', stop, { once: true });
    say('BREAK WITH ANY KEY', 'ok');
  }

  function list() {
    say(`0 "${(el.dataset.diskName || '').padEnd(16)}" ${el.dataset.diskId || '2A'} 2A`);
    pages.forEach((p) => say(`${String(p.blocks).padEnd(4)} "${p.name}" ${p.type}`));
    say(`${el.dataset.free || '664'} BLOCKS FREE.`);
  }

  function load(name) {
    say(`SEARCHING FOR ${name}`);
    const key = name.slice(0, 16);
    const hit =
      pages.find((p) => p.name === key) ||
      pages.find((p) => p.name.startsWith(key)) ||
      pages.find((p) => p.slug.toUpperCase().startsWith(key));
    if (!hit) {
      say(ERR.file, 'err');
      say('READY.');
      return;
    }
    say('LOADING', 'ok');
    window.setTimeout(() => {
      window.location.assign(hit.url);
    }, 600);
  }

  function poke(address, value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 15) {
      say(ERR.quantity, 'err');
      return;
    }
    if (address === '53280') {
      setPokes({ border: n });
      return;
    }
    if (address === '53281') {
      setPokes({ screen: n });
      return;
    }
    if (address !== '646') {
      say(ERR.quantity, 'err');
      return;
    }
    // 646 is the real cursor-colour address. Refuse anything below AA: a
    // palette the reader cannot read is not a palette.
    const fg = resolve(`--c64-${n}`);
    const bg = resolve('--c-screen');
    if (fg && bg && contrast(fg, bg) < AA) {
      say(ERR.quantity, 'err');
      return;
    }
    setPokes({ text: n });
  }

  function run(raw) {
    const line = raw.trim().toUpperCase();
    if (!line) return;
    say(line);

    const load$ = line.match(/^LOAD\s*"([^"]*)"\s*,\s*8(?:\s*,\s*1)?$/);
    const poke$ = line.match(/^POKE\s*(\d+)\s*,\s*(\d+)$/);
    const print$ = line.match(/^PRINT\s*"([^"]*)"$/);
    const expr$ = line.match(/^PRINT\s+([\d\s+\-*/().]+)$/);
    const maze$ = /^10\s+PRINT\s+CHR\$\(205\.5\s*\+\s*RND\(1\)\)\s*;\s*:\s*GOTO\s+10$/;

    if (line === 'LIST' || load$?.[1] === '$') {
      list();
    } else if (load$) {
      load(load$[1]);
    } else if (poke$) {
      poke(poke$[1], poke$[2]);
    } else if (print$) {
      say(print$[1]);
    } else if (expr$) {
      const value = arithmetic(expr$[1].trim());
      say(value === null ? ERR.syntax : ` ${value} `, value === null ? 'err' : null);
    } else if (maze$.test(line)) {
      // The listing only enters the program; RUN starts it, as it would.
      out.dataset.program = 'maze';
    } else if (line === 'RUN') {
      if (out.dataset.program === 'maze') {
        delete out.dataset.program;
        runMaze();
      } else {
        window.location.assign(el.dataset.home || '/');
      }
    } else if (line === 'SYS 64738') {
      reset();
      try {
        window.sessionStorage.removeItem('booted');
      } catch {
        /* nothing to clear */
      }
      window.location.assign(el.dataset.home || '/');
    } else if (line === 'NEW') {
      out.replaceChildren();
    } else {
      say(ERR.syntax, 'err');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { value } = input;
    input.value = '';
    run(value);
    if (!el.hidden) say('READY.');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !el.hidden) {
      close();
      return;
    }
    if (event.key !== hotkey || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    if (el.hidden) open(document.activeElement);
    else close();
  });

  root
    .querySelectorAll('[data-prompt-open]')
    .forEach((btn) => btn.addEventListener('click', () => open(btn)));

  // Restore POKEs saved in a previous session before the first command.
  const saved = pokes();
  if (saved.text >= 0 || saved.border >= 0 || saved.screen >= 0) {
    setPokes(
      {
        border: saved.border >= 0 ? saved.border : undefined,
        screen: saved.screen >= 0 ? saved.screen : undefined,
        text: saved.text >= 0 ? saved.text : undefined,
      },
      { persist: false },
    );
  }
}
