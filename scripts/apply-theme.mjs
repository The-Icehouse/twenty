#!/usr/bin/env node
// Apply a token mapping to BOTH theme files and mirror them into the committed dist copies.
//
//   node scripts/apply-theme.mjs theme/hubspot.json          # dry-run: report what changes
//   node scripts/apply-theme.mjs theme/hubspot.json --write
//
// Why a script and not hand edits: v2.37.0 renders from ~1,000 `--t-*` CSS custom properties
// in packages/twenty-ui/src/theme-constants/theme-{light,dark}.css, and the parity test
// (cornerShapeThemeParity.test.ts) requires packages/twenty-ui/dist/theme-*.css to equal src
// BYTE FOR BYTE. Editing four files by hand and keeping them identical across weekly rebases
// is exactly the kind of thing that drifts. The mapping file is the theme; this is the apply.
//
// Mapping format: { "light": { "--t-accent-primary": "#ff7a59", ... }, "dark": { ... } }
// Every key MUST already exist in the target file — the script refuses to invent variables,
// because an unknown key silently does nothing in CSS and would hide a typo forever.

import fs from 'fs';
import path from 'path';

const [,, mappingPath, flag] = process.argv;
if (!mappingPath) { console.error('usage: apply-theme.mjs <mapping.json> [--write]'); process.exit(1); }
const WRITE = flag === '--write';
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const SRC  = 'packages/twenty-ui/src/theme-constants';
const DIST = 'packages/twenty-ui/dist';
let changed = 0, missing = [];

for (const mode of ['light', 'dark']) {
  const file = path.join(SRC, `theme-${mode}.css`);
  let css = fs.readFileSync(file, 'utf8');
  const original = css;
  for (const [key, value] of Object.entries(mapping[mode] ?? {})) {
    // match "  --t-foo: <anything>;" exactly once, preserving indentation
    const re = new RegExp(`^(\\s*${key.replace(/[-]/g, '\\-')}:\\s*)([^;]+)(;)`, 'm');
    if (!re.test(css)) { missing.push(`${mode}:${key}`); continue; }
    const before = css.match(re)[2].trim();
    if (before === value) continue;
    css = css.replace(re, `$1${value}$3`);
    changed++;
    if (!WRITE) console.log(`  ${mode.padEnd(5)} ${key.padEnd(34)} ${before}  ->  ${value}`);
  }
  if (WRITE && css !== original) {
    fs.writeFileSync(file, css);
    fs.writeFileSync(path.join(DIST, `theme-${mode}.css`), css);   // parity: byte-identical
  }
}

if (missing.length) {
  console.error(`\nREFUSING: ${missing.length} mapping key(s) do not exist in the theme files:`);
  for (const m of missing) console.error('   ' + m);
  process.exit(2);
}
console.log(`\n${WRITE ? 'wrote' : 'would change'} ${changed} variable value(s) across light+dark, dist mirrored=${WRITE}`);
// prove parity after a write, the same way the test does
if (WRITE) for (const mode of ['light', 'dark']) {
  const a = fs.readFileSync(path.join(SRC, `theme-${mode}.css`)), b = fs.readFileSync(path.join(DIST, `theme-${mode}.css`));
  console.log(`  parity theme-${mode}.css: ${a.equals(b) ? 'dist == src ✓' : 'MISMATCH ✗'}`);
}
