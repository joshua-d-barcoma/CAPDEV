import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTime } from './timeEntry.js';

test('time entry uses the AM/PM period typed by the user', () => {
  assert.equal(formatTime('9:34 AM'), '9:34 AM');
  assert.equal(formatTime('9:34 PM'), '9:34 PM');
  assert.equal(formatTime('12:05 AM'), '12:05 AM');
  assert.equal(formatTime('12:05 PM'), '12:05 PM');
  assert.equal(formatTime('9:34'), null);
});

test('time entry accepts explicit AM/PM and 24-hour times', () => {
  assert.equal(formatTime('8:15 PM'), '8:15 PM');
  assert.equal(formatTime('08:15 am'), '8:15 AM');
  assert.equal(formatTime('17:30'), '5:30 PM');
  assert.equal(formatTime('00:10'), '12:10 AM');
});

test('time entry rejects invalid hour and minute input', () => {
  assert.equal(formatTime('13:30 PM'), null);
  assert.equal(formatTime('9:60 AM'), null);
  assert.equal(formatTime('25:30'), null);
  assert.equal(formatTime('not a time'), null);
});
