/**
 * main.js — the single entry point Hugo bundles with js.Build (esbuild is
 * built into Hugo extended; no npm, no transpiling, ES2020 out).
 *
 * Each feature is a module that does nothing when its markup is absent, so a
 * page without a boot block or a prompt pays only for the import.
 */

import boot from './boot.js';
import initPalette from './palette.js';
import initPrompt from './prompt.js';
import initTab from './tab.js';
import initNotFound from './notfound.js';
import initDirKeys from './dir-keys.js';

initPalette();
initTab();
boot();
initPrompt();
initNotFound();
initDirKeys();
