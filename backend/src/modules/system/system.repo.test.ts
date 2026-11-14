import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatLogLevel, getLogSnapshot } from './system.repo';

test('formatLogLevel keeps output readable for admin logs', () => {
  assert.equal(formatLogLevel('error'), 'error');
  assert.equal(formatLogLevel('warn'), 'warning');
  assert.equal(formatLogLevel('info'), 'info');
});

test('getLogSnapshot returns a safe list even when there are no logs', () => {
  const snapshot = getLogSnapshot([], 25);
  assert.deepEqual(snapshot.logs, []);
  assert.equal(snapshot.total, 0);
  assert.equal(snapshot.limit, 25);
});
