import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAttendanceTrend, filterDashboardData } from './dashboardFilters.js';

const employees = [
  { id: 'manila-hybrid', workLocation: 'Manila', capability: 'SRE / Hybrid Cloud' },
  { id: 'cebu-hybrid', workLocation: 'Cebu', capability: 'Hybrid Cloud - Operations' },
  { id: 'manila-network', workLocation: 'Manila', capability: 'Network' },
];
const attendanceRecords = employees.map((employee) => ({
  id: `attendance-${employee.id}`,
  employeeId: employee.id,
  date: '2026-10-16',
  status: 'Present',
}));
const actionItems = [
  { id: 'linked-action', employeeId: 'manila-hybrid', status: 'Open' },
  { id: 'multi-linked-action', employeeIds: ['cebu-hybrid', 'manila-network'], status: 'Open' },
  { id: 'unlinked-action', status: 'Open' },
];
const data = { employees, attendanceRecords, actionItems };

test('dashboard filters combine location and capability for each data set', () => {
  const filtered = filterDashboardData(data, { location: 'Manila', capability: 'Hybrid Cloud' });

  assert.deepEqual(
    filtered.employees.map((employee) => employee.id),
    ['manila-hybrid'],
  );
  assert.deepEqual(
    filtered.attendanceRecords.map((record) => record.employeeId),
    ['manila-hybrid'],
  );
  assert.deepEqual(
    filtered.actionItems.map((item) => item.id),
    ['linked-action'],
  );
});

test('clearing location retains the capability filter', () => {
  const filtered = filterDashboardData(data, { location: '', capability: 'Hybrid Cloud' });

  assert.deepEqual(
    filtered.employees.map((employee) => employee.id),
    ['manila-hybrid', 'cebu-hybrid'],
  );
  assert.deepEqual(
    filtered.actionItems.map((item) => item.id),
    ['linked-action', 'multi-linked-action'],
  );
});

test('clearing capability retains the location filter', () => {
  const filtered = filterDashboardData(data, { location: 'Manila', capability: '' });

  assert.deepEqual(
    filtered.employees.map((employee) => employee.id),
    ['manila-hybrid', 'manila-network'],
  );
  assert.deepEqual(
    filtered.actionItems.map((item) => item.id),
    ['linked-action', 'multi-linked-action'],
  );
});

test('dashboard action items exclude records without employee associations', () => {
  const filtered = filterDashboardData(data, {});

  assert.deepEqual(
    filtered.actionItems.map((item) => item.id),
    ['linked-action', 'multi-linked-action'],
  );
});

test('combined filters include action items linked to any matching employee', () => {
  const filtered = filterDashboardData(data, { location: 'Manila', capability: 'Network' });

  assert.deepEqual(
    filtered.actionItems.map((item) => item.id),
    ['multi-linked-action'],
  );
});

test('attendance trend is derived only from the supplied attendance records', () => {
  const trend = buildAttendanceTrend([
    { date: '2026-10-17', status: 'Unapproved Absence' },
    { date: '2026-10-16', status: 'Present' },
    { date: '2026-10-16', status: 'Present' },
  ]);

  assert.deepEqual(trend, [
    { date: '2026-10-16', present: 2, total: 2, percentage: 100 },
    { date: '2026-10-17', present: 0, total: 1, percentage: 0 },
  ]);
});
