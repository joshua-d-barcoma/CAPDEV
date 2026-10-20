import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_COHORT_PROGRESS,
  DEMO_DEPLOYMENT_STAGES,
  DEMO_READINESS_METRICS,
} from './employeePageDemoData.js';

test('employee page demo scorecard metrics are valid percentages', () => {
  Object.values(DEMO_READINESS_METRICS).forEach((metrics) => {
    Object.values(metrics).forEach((value) => {
      assert.equal(Number.isInteger(value), true);
      assert.equal(value >= 0 && value <= 100, true);
    });
  });
});

test('employee page demo pipeline stages use positive counts in display order', () => {
  assert.deepEqual(
    DEMO_DEPLOYMENT_STAGES.map(({ count }) => count),
    [24, 16, 9, 5, 3],
  );
  assert.equal(
    DEMO_DEPLOYMENT_STAGES.every(({ count }) => count > 0),
    true,
  );
});

test('employee page demo cohort progress stays within valid display bounds', () => {
  assert.equal(DEMO_COHORT_PROGRESS.length, 4);
  assert.equal(
    DEMO_COHORT_PROGRESS.every(
      ({ members, progress }) => members > 0 && progress >= 0 && progress <= 100,
    ),
    true,
  );
});
