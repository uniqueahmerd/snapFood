import assert from 'node:assert/strict';
import test from 'node:test';

import { passwordResetEmail, verificationEmail, welcomeEmail } from './email.templates';

test('verification email contains the provided working client link', () => {
  const link = 'http://localhost:5174/verify-email/abc123';
  const email = verificationEmail('Ada', link);

  assert.match(email.html, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(email.text, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('password reset email includes the reset URL in HTML and text', () => {
  const link = 'http://localhost:5174/reset-password/token-value';
  const email = passwordResetEmail('Sam', link);

  assert.ok(email.html.includes(`href="${link}"`));
  assert.ok(email.text.includes(link));
});

test('welcome email escapes user-provided HTML', () => {
  const email = welcomeEmail('<script>alert(1)</script>');

  assert.ok(!email.html.includes('<script>alert(1)</script>'));
  assert.ok(email.html.includes('&lt;script&gt;'));
});