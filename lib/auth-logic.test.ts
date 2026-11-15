import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  resolveCookieSecurityOptions,
  signSessionToken,
  validateAuthInput,
  verifyPassword,
  verifySessionToken,
} from './auth-logic';

test('hashPassword and verifyPassword validate matching and reject wrong passwords', () => {
  const hash = hashPassword('Nageeb@2026');
  assert.ok(hash.startsWith('scrypt:'));
  assert.equal(verifyPassword('Nageeb@2026', hash), true);
  assert.equal(verifyPassword('wrong-pass', hash), false);
  assert.equal(verifyPassword('Nageeb@2026', 'invalid-format'), false);
});

test('signSessionToken and verifySessionToken enforce signature and expiry', () => {
  const secret = 'test-secret-key-32-chars-minimum';
  const token = signSessionToken(
    { uid: 7, email: 'MahmoudNageeb2709@gmail.com', role: 'admin', ttlSeconds: 3600 },
    secret,
  );
  const decoded = verifySessionToken(token, secret);
  assert.ok(decoded);
  assert.equal(decoded.uid, 7);
  assert.equal(decoded.email, 'mahmoudnageeb2709@gmail.com');
  assert.equal(decoded.role, 'admin');

  // Tampered token fails
  const [payload, sig] = token.split('.');
  assert.equal(verifySessionToken(`${payload}.tampered${sig}`, secret), null);
  assert.equal(verifySessionToken(token, 'different-secret'), null);

  // Expired token fails
  const expired = signSessionToken(
    { uid: 7, email: 'a@b.com', role: 'user', ttlSeconds: -10 },
    secret,
  );
  assert.equal(verifySessionToken(expired, secret), null);
});

test('validateAuthInput enforces required fields and email formatting', () => {
  const bad = validateAuthInput(
    { fullName: 'م', email: 'not-an-email', password: '123' },
    'register',
  );
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.fullName);
  assert.ok(bad.errors.email);
  assert.ok(bad.errors.password);

  const good = validateAuthInput(
    { fullName: '  محمود   نجيب ', email: ' Test@Example.COM ', password: 'StrongPassword1' },
    'register',
  );
  assert.equal(good.valid, true);
  assert.equal(good.sanitized?.fullName, 'محمود نجيب');
  assert.equal(good.sanitized?.email, 'test@example.com');

  const loginOk = validateAuthInput(
    { email: 'MahmoudNageeb2709@gmail.com', password: 'any-password' },
    'login',
  );
  assert.equal(loginOk.valid, true);
  assert.equal(loginOk.sanitized?.email, 'mahmoudnageeb2709@gmail.com');

  const loginMissing = validateAuthInput({ email: 'a@b.com', password: '' }, 'login');
  assert.equal(loginMissing.valid, false);
  assert.ok(loginMissing.errors.password);
});

test('resolveCookieSecurityOptions uses SameSite=None Secure Partitioned for HTTPS/iFrame and Lax for local HTTP', () => {
  const iframeOpts = resolveCookieSecurityOptions(
    {
      forwardedProto: 'https',
      origin: 'https://ais-dev-example.run.app',
      host: 'localhost:3000',
      nodeEnv: 'development',
    },
    3600,
  );
  assert.equal(iframeOpts.sameSite, 'none');
  assert.equal(iframeOpts.secure, true);
  assert.equal(iframeOpts.partitioned, true);
  assert.equal(iframeOpts.maxAge, 3600);

  const localOpts = resolveCookieSecurityOptions(
    {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      nodeEnv: 'development',
    },
    3600,
  );
  assert.equal(localOpts.sameSite, 'lax');
  assert.equal(localOpts.secure, false);
  assert.equal(localOpts.partitioned, undefined);
});

