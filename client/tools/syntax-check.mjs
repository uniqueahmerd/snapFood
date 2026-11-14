#!/usr/bin/env node
/**
 * Syntax gate for the SnapFood client.
 *
 * The workspace has no npm registry access, so dependencies cannot be
 * installed and a full type-check is impossible here. This parses every source
 * file with the TypeScript compiler and reports *syntactic* diagnostics, which
 * catches the class of error that actually matters when writing a large
 * codebase by hand: unbalanced braces, malformed JSX, bad generics, stray
 * characters.
 *
 * Run `npm run typecheck` on a machine with the dependencies installed for the
 * full semantic check.
 *
 *   node tools/syntax-check.mjs [rootDir]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { loadTypeScript } from './load-typescript.mjs';

const ts = loadTypeScript();

const root = resolve(process.argv[2] ?? 'src');

/** @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(root).sort();
let errors = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, kind);

  // `parseDiagnostics` is internal but stable, and is the only way to read
  // syntactic errors without building a full Program.
  const diagnostics = source.parseDiagnostics ?? [];

  for (const diagnostic of diagnostics) {
    const { line, character } = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    console.error(`${relative(process.cwd(), file)}:${line + 1}:${character + 1}  ${message}`);
    errors += 1;
  }
}

const label = `${files.length} file${files.length === 1 ? '' : 's'}`;
if (errors > 0) {
  console.error(`\n✗ ${errors} syntax error(s) across ${label}.`);
  process.exit(1);
}
console.log(`✓ No syntax errors. Parsed ${label}.`);
