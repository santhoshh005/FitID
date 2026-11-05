#!/usr/bin/env node
// Copies the shared FitID libraries from the browser extension into ./lib so the
// website is self-contained for static hosting. Re-run after the extension changes
// (new brands in lib/brands.js, parser fixes in lib/table.js, …):
//
//   node sync-lib.js            (expects ../fitid-extension next to this folder)
//   node sync-lib.js path/to/fitid-extension
//
// The extension stays the single source of truth: never edit the copies in ./lib.
const fs = require('fs');
const path = require('path');

const ext = path.resolve(process.argv[2] || path.join(__dirname, '..', 'fitid-extension'));
const out = path.join(__dirname, 'lib');
const FILES = [
  'lib/units.js',
  'lib/standards.js',
  'lib/engine.js',
  'lib/profile.js',
  'lib/table.js', // reads pasted size-chart tables on the "Check a chart" screen
  'lib/brands.js',
  'lib/converter.js',
  'lib/summary-view.js',
  'ui/shared.css',
];
const ICONS = ['icons/icon128.png', 'icons/icon48.png', 'icons/icon32.png', 'icons/icon16.png'];

if (!fs.existsSync(path.join(ext, 'manifest.json'))) {
  console.error(`Can't find the FitID extension at ${ext}\nPass its folder: node sync-lib.js path/to/fitid-extension`);
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'icons'), { recursive: true });

let n = 0;
for (const f of FILES) {
  const src = path.join(ext, f);
  if (!fs.existsSync(src)) { console.warn('  missing (skipped): ' + f); continue; }
  const body = fs.readFileSync(src, 'utf8');
  const banner = f.endsWith('.css')
    ? `/* Copied from fitid-extension/${f} by sync-lib.js. Do not edit here. */\n`
    : `// Copied from fitid-extension/${f} by sync-lib.js. Do not edit here.\n`;
  fs.writeFileSync(path.join(out, path.basename(f)), banner + body);
  console.log('  lib/' + path.basename(f));
  n++;
}
for (const f of ICONS) {
  const src = path.join(ext, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(__dirname, 'icons', path.basename(f))); n++; }
}

// Bump the service-worker cache so phones pick up the new files on next visit.
const sw = path.join(__dirname, 'sw.js');
if (fs.existsSync(sw)) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const s = fs.readFileSync(sw, 'utf8').replace(/const VERSION = '[^']*'/, `const VERSION = 'fitid-${stamp}'`);
  fs.writeFileSync(sw, s);
  console.log('  sw.js cache version -> fitid-' + stamp);
}

// Count brands so you can see new ones arrived.
try {
  globalThis.FitID = undefined;
  for (const f of ['units', 'standards', 'engine', 'profile', 'brands']) require(path.join(out, f + '.js'));
  const B = globalThis.FitID.brands.BRANDS;
  console.log(`Synced ${n} files. ${B.length} brand charts: ${[...new Set(B.map((b) => b.brand))].join(', ')}`);
} catch (e) {
  console.log(`Synced ${n} files.`);
}
