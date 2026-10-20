import assert from 'node:assert/strict';
import test from 'node:test';
import { getBenchTenureCounts, getCareerLevelCounts, getDaysOnBench } from './employeeInsights.js';

const today = new Date(2026, 9, 20);

test('bench tenure is calculated from roll-in date and grouped into the displayed ranges', () => {
  const employees = [
    { rollInDate: '2026-10-20' },
    { rollInDate: '2026-09-20' },
    { rollInDate: '2026-09-19' },
    { rollInDate: '2026-08-20' },
    { rollInDate: '2026-07-20' },
    { rollInDate: '2026-06-20' },
    { rollInDate: '' },
  ];

  assert.deepEqual(
    getBenchTenureCounts(employees, today).map(({ label, count }) => ({ label, count })),
    [
      { label: '0 - 30 days', count: 2 },
      { label: '31 - 60 days', count: 1 },
      { label: '61 - 90 days', count: 1 },
      { label: '91 - 120+ days', count: 2 },
    ],
  );
});

test('future roll-in dates are clamped to zero days on bench', () => {
  assert.equal(getDaysOnBench('2026-10-21', today), 0);
});

test('career level mix reports counts across supported levels', () => {
  const employees = [
    { careerLevel: 'CL8' },
    { careerLevel: 'CL8' },
    { careerLevel: 'CL5' },
  ];

  assert.deepEqual(
    getCareerLevelCounts(employees).filter(({ count }) => count > 0),
    [
      { level: 'CL5', count: 1 },
      { level: 'CL8', count: 2 },
    ],
  );
});
