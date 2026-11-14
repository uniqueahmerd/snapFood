#!/usr/bin/env node
/**
 * Unused-import check.
 *
 * `tsconfig.app.json` sets `noUnusedLocals: true`, which turns a single leftover
 * import into a hard build failure. Since `npm install` is unavailable in this
 * environment we cannot run `tsc`, so this approximates the one rule that bites
 * most often: it lists every imported binding whose name never appears again in
 * the file body.
 *
 *   node tools/unused-check.mjs src
 *
 * Deliberately naive — it works on text, not an AST. A name used only inside a
 * comment counts as "used", so this under-reports rather than crying wolf.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? 'src';
const EXTENSIONS = ['.ts', '.tsx'];

/** Every .ts/.tsx file under `dir`, recursively. */
function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'node_modules') collect(full, out);
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const IMPORT_RE = /^import\s+(?!type\s+['"])([\s\S]*?)\s+from\s+['"][^'"]+['"];?/gm;

/** Pull the bound names out of one import clause. */
function bindingsFrom(clause) {
  const names = [];
  const braced = clause.match(/\{([\s\S]*?)\}/);

  if (braced) {
    for (const part of braced[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim();
      if (name) names.push(name);
    }
  }

  // Default and namespace imports live outside the braces.
  const outside = clause.replace(/\{[\s\S]*?\}/, '').replace(/^type\s+/, '');
  for (const part of outside.split(',')) {
    const name = part.trim().replace(/^\*\s+as\s+/, '');
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.push(name);
  }

  return names;
}

let problems = 0;
const files = collect(root);

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  // Spread dots are collapsed to a space before the usage search. The lookbehind
  // below rejects a leading `.` so that `foo.cn` does not count as a use of `cn`,
  // but that also swallowed `...metaSchema` — a real use — and reported four
  // genuinely-used helpers as dead imports.
  const body = source.replace(IMPORT_RE, '').replace(/\.\.\./g, ' ');
  const unused = [];

  for (const match of source.matchAll(IMPORT_RE)) {
    for (const name of bindingsFrom(match[1])) {
      // Word-boundary search, so `cn` does not match `cnFoo` or `foo.cn`.
      if (!new RegExp(`(?<![\\w$.])${name}(?![\\w$])`).test(body)) unused.push(name);
    }
  }

  if (unused.length > 0) {
    problems += unused.length;
    console.log(`${relative(process.cwd(), file)}: ${unused.join(', ')}`);
  }
}

console.log(
  problems === 0
    ? `\n✓ No unused imports. Checked ${files.length} files.`
    : `\n✗ ${problems} unused import(s) — each one fails the build under noUnusedLocals.`,
);

process.exit(problems === 0 ? 0 : 1);
