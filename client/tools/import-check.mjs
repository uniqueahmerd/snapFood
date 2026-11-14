#!/usr/bin/env node
/**
 * Import resolution check.
 *
 * The npm registry is blocked in this workspace, so `tsc` cannot run. This covers
 * the single most common class of error that syntax parsing misses: importing a
 * name that the target module does not actually export, or a module path that does
 * not exist. It resolves `@/*` through the tsconfig alias and follows
 * `export * from` chains.
 *
 *   node tools/import-check.mjs src
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

import { loadTypeScript } from './load-typescript.mjs';

const ts = loadTypeScript();

const ROOT = resolve(process.argv[2] ?? 'src');
const EXTENSIONS = ['.ts', '.tsx'];

/* ── file walking ─────────────────────────────────────────────────────────── */

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (EXTENSIONS.some((ext) => full.endsWith(ext))) files.push(full);
  }
  return files;
}

function parse(file) {
  const text = readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, kind);
}

/** `@/foo` → `<root>/foo`; relative paths resolve against the importer. */
function resolveModule(specifier, importer) {
  // Style and asset imports are Vite's business, not the type layer's.
  if (/\.(css|scss|svg|png|jpe?g|webp|woff2?|json)$/.test(specifier)) return null;

  let base;
  if (specifier.startsWith('@/')) base = join(ROOT, specifier.slice(2));
  else if (specifier.startsWith('.')) base = resolve(dirname(importer), specifier);
  else return null; // node_modules — nothing to check without an install

  for (const candidate of [
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => join(base, 'index' + ext)),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return { missing: base };
}

/* ── export collection ────────────────────────────────────────────────────── */

const exportCache = new Map();

function exportsOf(file, seen = new Set()) {
  if (exportCache.has(file)) return exportCache.get(file);
  if (seen.has(file)) return new Set();
  seen.add(file);

  const names = new Set();
  const source = parse(file);

  for (const statement of source.statements) {
    const isExported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) names.add(element.name.text);
      } else if (statement.moduleSpecifier) {
        // export * from './x'
        const target = resolveModule(statement.moduleSpecifier.text, file);
        if (target && !target.missing) {
          for (const name of exportsOf(target, seen)) names.add(name);
        }
      }
      continue;
    }

    if (!isExported) continue;

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (statement.name && ts.isIdentifier(statement.name)) {
      names.add(statement.name.text);
    }

    if (statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
      names.add('default');
    }
  }

  exportCache.set(file, names);
  return names;
}

/* ── the check ────────────────────────────────────────────────────────────── */

const files = walk(ROOT);
const problems = [];

for (const file of files) {
  const source = parse(file);
  const where = `${relative(process.cwd(), file)}`;

  // Dynamic `import('...')` — how the router loads page chunks. Only the module
  // path can be checked; the named exports come out of a promise.
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const specifier = node.arguments[0].text;
      const target = resolveModule(specifier, file);
      if (target?.missing) {
        problems.push(`${where}: cannot resolve lazy module "${specifier}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const specifier = statement.moduleSpecifier.text;
    const target = resolveModule(specifier, file);
    if (!target) continue;

    if (target.missing) {
      problems.push(`${where}: cannot resolve module "${specifier}"`);
      continue;
    }

    const clause = statement.importClause;
    if (!clause) continue;

    const available = exportsOf(target);

    if (clause.name && !available.has('default')) {
      problems.push(`${where}: "${specifier}" has no default export`);
    }

    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        const imported = (element.propertyName ?? element.name).text;
        if (!available.has(imported)) {
          problems.push(`${where}: "${specifier}" does not export "${imported}"`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} import problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`✓ All imports resolve. Checked ${files.length} files.`);
