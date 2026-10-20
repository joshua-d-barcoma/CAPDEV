import assert from 'node:assert/strict';
import test from 'node:test';
import { getDatePresetRange, isDateInRange } from './dateFilters.js';

const today = new Date(2026, 9, 20);

test('date presets return the expected inclusive date ranges', () => {
  assert.deepEqual(getDatePresetRange('Today', today), {
    start: '2026-10-20',
    end: '2026-10-20',
  });
  assert.deepEqual(getDatePresetRange('Yesterday', today), {
    start: '2026-10-19',
    end: '2026-10-19',
  });
  assert.deepEqual(getDatePresetRange('Last week', today), {
    start: '2026-10-12',
    end: '2026-10-18',
  });
  assert.deepEqual(getDatePresetRange('Last month', today), {
    start: '2026-09-01',
    end: '2026-09-30',
  });
  assert.deepEqual(getDatePresetRange('Last quarter', today), {
    start: '2026-07-01',
    end: '2026-09-30',
  });
});

test('date range matching includes both boundary dates', () => {
  const range = { start: '2026-07-01', end: '2026-09-30' };

  assert.equal(isDateInRange('2026-07-01', range), true);
  assert.equal(isDateInRange('2026-09-30', range), true);
  assert.equal(isDateInRange('2026-06-30', range), false);
  assert.equal(isDateInRange('2026-10-01', range), false);
  assert.equal(isDateInRange('', range), false);
});
