/**
 * axe.mjs — run axe-core over every page of the built exampleSite.
 *
 *   node scripts/axe.mjs [dir] [--reduced-motion]
 *
 * Serves the directory itself (node's own http module, no dependency) and
 * drives it with Playwright, so the same command works in CI and on a laptop.
 * Playwright and @axe-core/playwright are dev tools: install them anywhere,
 * then point AXE_MODULES at that node_modules. Nothing is installed into this
 * repository, which is the rule for every tool in scripts/.
 *
 * Exits non-zero on the first violation of WCAG 2.2 A or AA.
 */

import { createReadStream, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * ESM ignores NODE_PATH, so a scratch install has to be resolved by hand:
 * CommonJS resolution from a file inside it, then import the resolved entry.
 */
async function load(name) {
  const modules = process.env.AXE_MODULES;
  if (!modules) return import(name);
  const resolve = createRequire(join(modules, 'resolver.cjs'));
  return import(pathToFileURL(resolve.resolve(name)).href);
}

const axe = await load('@axe-core/playwright');
const AxeBuilder = axe.default?.default ?? axe.default ?? axe;
const pw = await load('playwright');
const { chromium } = pw.default ?? pw;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const root =
  process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'exampleSite/public';
const reducedMotion = process.argv.includes('--reduced-motion');

function serve(dir) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = join(dir, normalize(url).replace(/^(\.\.[/\\])+/, ''));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      /* fall through to the 404 below */
    }
    try {
      statSync(file);
    } catch {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** Every page the build produced, so a new section cannot slip past unchecked. */
function pages(dir, base = '') {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      found.push(...pages(join(dir, entry.name), `${base}/${entry.name}`));
    } else if (entry.name.endsWith('.html')) {
      // An alias is a <meta refresh> stub with nothing of its own to audit.
      // Loading one lands on the destination mid-navigation, where the view
      // transition is still fading and every colour reads as a blend.
      const html = readFileSync(join(dir, entry.name), 'utf8');
      if (/http-equiv=["']?refresh/i.test(html)) continue;
      found.push(entry.name === 'index.html' ? `${base}/` : `${base}/${entry.name}`);
    }
  }
  return found;
}

const PAGES = pages(root).sort();

const server = await serve(root);
const { port } = server.address();
const browser = await chromium.launch();
let failures = 0;

try {
  for (const path of PAGES) {
    // Every palette shares one stylesheet, so the pages are checked once each
    // and the palettes are covered by scripts/contrast.py instead.
    const context = await browser.newContext(reducedMotion ? { reducedMotion: 'reduce' } : {});
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load' });
    // The boot sequence holds the content back for 2.6 s; let it finish.
    await page.waitForTimeout(reducedMotion ? 200 : 3200);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    if (violations.length === 0) {
      process.stdout.write(`  ok    ${path}\n`);
    } else {
      failures += violations.length;
      process.stdout.write(`  FAIL  ${path}\n`);
      for (const v of violations) {
        process.stdout.write(`        ${v.id} (${v.impact}): ${v.help}\n`);
        for (const node of v.nodes.slice(0, 3)) {
          process.stdout.write(`          ${node.target.join(' ')}\n`);
          process.stdout.write(`          ${node.failureSummary.split('\n').join(' | ')}\n`);
        }
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

process.stdout.write(
  `\n${PAGES.length} pages checked${reducedMotion ? ' (reduced motion)' : ''}, ${failures} violation(s)\n`,
);
process.exit(failures ? 1 : 0);
