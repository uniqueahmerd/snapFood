#!/usr/bin/env node
/**
 * Locates a TypeScript compiler for the offline gates.
 *
 * The npm registry is blocked in this workspace, so `client/node_modules` does not
 * exist and `require('typescript')` cannot work. A compiler *is* present in the
 * server's pnpm store, and that is what the gates borrow.
 *
 * This used to point at a copy under `/tmp`, which was a mistake: `/tmp` is wiped
 * between sessions, so the gates failed with MODULE_NOT_FOUND rather than with a
 * verdict about the code. Every candidate below lives inside the repo.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');

/** Every `typescript` package in the server's pnpm store, newest name last. */
function pnpmCandidates() {
  const store = join(repo, 'server', 'node_modules', '.pnpm');
  if (!existsSync(store)) return [];

  try {
    return readdirSync(store)
      .filter((entry) => entry.startsWith('typescript@'))
      .sort()
      .map((entry) => join(store, entry, 'node_modules', 'typescript'));
  } catch {
    return [];
  }
}

const CANDIDATES = [
  join(repo, 'client', 'node_modules', 'typescript'),
  ...pnpmCandidates(),
  join(repo, 'server', 'node_modules', 'typescript'),
];

/**
 * @returns {import('typescript')}
 * @throws if no compiler is reachable — the caller should report and exit non-zero
 *         rather than silently passing.
 */
export function loadTypeScript() {
  for (const candidate of CANDIDATES) {
    try {
      // `existsSync` is not enough: pnpm leaves symlinks that the mount cannot
      // follow, and those throw on require rather than resolving.
      return require(candidate);
    } catch {
      /* try the next one */
    }
  }

  throw new Error(
    'No TypeScript compiler found. Tried:\n' +
      CANDIDATES.map((path) => `  - ${path}`).join('\n') +
      '\nInstall dependencies in client/ or server/ and run again.',
  );
}
