import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../utils/password.js';

test('hashPassword produces a bcrypt hash', async () => {
  const hash = await hashPassword('s3cret!Password');
  assert.ok(hash.startsWith('$2'), 'expected bcrypt hash prefix');
  assert.notEqual(hash, 's3cret!Password');
});

test('verifyPassword returns true for the correct password', async () => {
  const hash = await hashPassword('correct-horse-battery');
  assert.equal(await verifyPassword('correct-horse-battery', hash), true);
});

test('verifyPassword returns false for a wrong password', async () => {
  const hash = await hashPassword('correct-horse-battery');
  assert.equal(await verifyPassword('wrong-password', hash), false);
});
