import assert from 'node:assert/strict';
import test from 'node:test';
import { getRoleFromSession } from './useRole.js';

test('demo sessions select the experience from the account type', () => {
  assert.equal(getRoleFromSession({ accountType: 'admin' }), 'admin');
  assert.equal(getRoleFromSession({ accountType: 'individual' }), 'user');
});

test('demo account role cannot be changed by a stale session role', () => {
  assert.equal(getRoleFromSession({ accountType: 'admin', activeRole: 'user' }), 'admin');
  assert.equal(getRoleFromSession({ accountType: 'individual', activeRole: 'admin' }), 'user');
});

test('unknown or missing sessions do not receive the admin role', () => {
  assert.equal(getRoleFromSession({}), 'user');
  assert.equal(getRoleFromSession(null), 'user');
});
