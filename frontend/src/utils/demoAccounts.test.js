import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  DEMO_ACCOUNTS,
  getDemoProfile,
  saveDemoProfile,
} from './demoAccounts.js';

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  },
};

beforeEach(() => storage.clear());

test('only the four configured demo accounts are available', () => {
  assert.equal(DEMO_ACCOUNTS.length, 4);
  assert.deepEqual(
    DEMO_ACCOUNTS.filter((account) => account.profile.attendanceEmployeeId).map(
      (account) => account.profile.employeeId,
    ),
    ['DEMO-JM-001', 'DEMO-KC-002', 'DEMO-OP-003'],
  );
  assert.equal(DEMO_ACCOUNTS.find((account) => account.accountType === 'admin').profile.employeeId, '');
});

test('demo profiles load defaults and preserve saved edits by account', () => {
  const juan = getDemoProfile(' JUAN.MARCOS@ACCENTURE.COM ');
  assert.equal(juan.name, 'Juan Marcos Garcia');
  assert.equal(juan.employeeId, 'DEMO-JM-001');

  saveDemoProfile(juan.email, { ...juan, capability: 'Updated capability' });

  assert.equal(getDemoProfile(juan.email).capability, 'Updated capability');
  assert.equal(
    getDemoProfile('karoline.cayetano@accenture.com').capability,
    'Cloud Ops',
  );
});

test('unknown demo accounts cannot load or save profiles', () => {
  assert.equal(getDemoProfile('unknown@example.com'), null);
  assert.throws(
    () => saveDemoProfile('unknown@example.com', {}),
    /not one of the configured demo accounts/,
  );
});
