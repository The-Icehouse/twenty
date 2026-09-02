#!/usr/bin/env node
// Prove the fork's stylesheet parses and minifies exactly as Vite's lightningcss step will.
// A single lost brace once turned into an 8-minute CI failure ("Unknown at rule: @keyframes"
// — the NEXT stylesheet in the bundle parsed as nested). Run before every commit that touches
// packages/twenty-front/src/icehouse.css:   node scripts/check-css.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { transform } = require('lightningcss');
const file = 'packages/twenty-front/src/icehouse.css';
const code = readFileSync(file);
const opens = (code.toString().match(/{/g) || []).length, closes = (code.toString().match(/}/g) || []).length;
if (opens !== closes) { console.error(`✗ ${file}: ${opens} '{' vs ${closes} '}'`); process.exit(1); }
try { transform({ filename: file, code, minify: true }); console.log(`✓ ${file} parses and minifies (${opens} blocks)`); }
catch (e) { console.error(`✗ ${file}: ${e.message}`); process.exit(1); }
