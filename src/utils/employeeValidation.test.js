import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEmployee } from './employeeValidation.js';

test('valid employee data passes the shared form validation', () => {
  assert.deepEqual(
    validateEmployee({
      name: ' Alex Santos ',
      capability: 'SRE',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      rollInDate: '2026-10-16',
    }),
    {},
  );
});

test('employee validation identifies all missing required fields', () => {
  assert.deepEqual(
    validateEmployee({
      name: ' ',
      capability: '',
      careerLevel: '',
      workLocation: '',
      rollInDate: '',
    }),
    {
      name: 'Enter an employee name.',
      capability: 'Enter a capability.',
      careerLevel: 'Select a career level.',
      workLocation: 'Select a work location.',
      rollInDate: 'Select a roll-in date.',
    },
  );
});
