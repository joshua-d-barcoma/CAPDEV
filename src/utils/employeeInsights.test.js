import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterEmployees,
  getBenchTenureCounts,
  getCapabilityReadiness,
  getEmployeeCountsBy,
  getCareerLevelCounts,
  getDaysOnBench,
  getEmployeeFilterOptions,
  getSkillDistribution,
} from './employeeInsights.js';

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
  const employees = [{ careerLevel: 'CL8' }, { careerLevel: 'CL8' }, { careerLevel: 'CL5' }];

  assert.deepEqual(
    getCareerLevelCounts(employees).filter(({ count }) => count > 0),
    [
      { level: 'CL5', count: 1 },
      { level: 'CL8', count: 2 },
    ],
  );
});

test('capability readiness uses current headcount and attendance without inventing other scores', () => {
  const readiness = getCapabilityReadiness([
    { capability: 'Hybrid Cloud', attendanceStatus: 'Present' },
    { capability: 'Hybrid Cloud', attendanceStatus: 'Vacation Leave' },
    { capability: 'Network', attendanceStatus: 'Unapproved Absence' },
  ]);

  assert.deepEqual(readiness, [
    { capability: 'Hybrid Cloud', headcount: 2, attendancePercent: 50 },
    { capability: 'Network', headcount: 1, attendancePercent: 0 },
  ]);
});

test('skill distribution counts employees per skill and sorts by frequency', () => {
  const distribution = getSkillDistribution([
    { skills: ['AWS', 'Kubernetes'] },
    { skills: ['AWS', 'Terraform'] },
    { skills: ['AWS'] },
  ]);

  assert.deepEqual(distribution, [
    { skill: 'AWS', count: 3 },
    { skill: 'Kubernetes', count: 1 },
    { skill: 'Terraform', count: 1 },
  ]);
});

test('skill distribution respects its limit and handles missing skill lists', () => {
  assert.deepEqual(getSkillDistribution([{ skills: ['AWS', 'Azure', 'Docker'] }, {}], 2), [
    { skill: 'AWS', count: 1 },
    { skill: 'Azure', count: 1 },
  ]);
});

test('employee breakdown counts current status and capability fields', () => {
  const employees = [
    { attendanceStatus: 'Present', capability: 'Hybrid Cloud' },
    { attendanceStatus: 'Present', capability: 'Network' },
    { attendanceStatus: 'Vacation Leave', capability: 'Hybrid Cloud' },
  ];

  assert.deepEqual(getEmployeeCountsBy(employees, 'attendanceStatus'), [
    { label: 'Present', count: 2 },
    { label: 'Vacation Leave', count: 1 },
  ]);
  assert.deepEqual(getEmployeeCountsBy(employees, 'capability'), [
    { label: 'Hybrid Cloud', count: 2 },
    { label: 'Network', count: 1 },
  ]);
});

const filterEmployee = {
  id: 'employee-a',
  name: 'Alex Santos',
  capability: 'Hybrid Cloud',
  careerLevel: 'CL8',
  skills: ['AWS', 'Kubernetes'],
  attendanceStatus: 'Present',
  workLocation: 'Manila',
  joiningDate: '2020-02-10',
  rollInDate: '2026-07-14',
};

test('employee filters combine all selected values', () => {
  const employees = [
    filterEmployee,
    {
      ...filterEmployee,
      id: 'employee-b',
      name: 'Maria Cruz',
      capability: 'Network',
      careerLevel: 'CL7',
      skills: ['Cisco'],
      attendanceStatus: 'Unapproved Absence',
      workLocation: 'Cebu',
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05',
    },
  ];

  assert.deepEqual(
    filterEmployees(employees, {
      capability: 'Hybrid Cloud',
      careerLevel: 'CL8',
      skill: 'AWS',
      attendance: 'Present',
      location: 'Manila',
      joiningDate: { start: '2020-02-01', end: '2020-02-28' },
      rollInDate: { start: '2026-07-01', end: '2026-07-31' },
    }).map(({ id }) => id),
    ['employee-a'],
  );
});

test('clearing each employee filter leaves the other selected filters active', () => {
  const filterKeys = [
    'capability',
    'careerLevel',
    'skill',
    'attendance',
    'location',
    'joiningDate',
    'rollInDate',
  ];
  const filterValues = {
    capability: 'Hybrid Cloud',
    careerLevel: 'CL8',
    skill: 'AWS',
    attendance: 'Present',
    location: 'Manila',
    joiningDate: { start: '2020-02-01', end: '2020-02-28' },
    rollInDate: { start: '2026-07-01', end: '2026-07-31' },
  };

  filterKeys.forEach((key) => {
    const otherEmployee = {
      ...filterEmployee,
      id: `employee-other-${key}`,
    };
    if (key === 'skill') otherEmployee.skills = ['Azure'];
    else if (key === 'attendance') otherEmployee.attendanceStatus = 'Unapproved Absence';
    else if (key === 'location') otherEmployee.workLocation = 'Cebu';
    else if (key === 'joiningDate') otherEmployee.joiningDate = '2021-03-10';
    else if (key === 'rollInDate') otherEmployee.rollInDate = '2026-08-05';
    else otherEmployee[key] = `${filterValues[key]}-other`;
    const employees = [filterEmployee, otherEmployee];

    assert.deepEqual(
      filterEmployees(employees, filterValues).map(({ id }) => id),
      ['employee-a'],
    );

    const filtersAfterClearingOne = { ...filterValues, [key]: '' };
    assert.deepEqual(
      filterEmployees(employees, filtersAfterClearingOne).map(({ id }) => id),
      ['employee-a', otherEmployee.id],
      `clearing ${key} should preserve the other filters`,
    );
  });
});

test('employee filter options are derived from current employee records', () => {
  const options = getEmployeeFilterOptions([
    filterEmployee,
    { ...filterEmployee, id: 'employee-b', capability: 'Network', skills: ['Cisco'] },
  ]);

  assert.deepEqual(options.capabilities, ['Hybrid Cloud', 'Network']);
  assert.deepEqual(options.skills, ['AWS', 'Cisco', 'Kubernetes']);
  assert.deepEqual(options.locations, ['Manila']);
});

test('employee search matches location and career level in addition to skills and name', () => {
  assert.deepEqual(filterEmployees([filterEmployee], {}, 'manila'), [filterEmployee]);
  assert.deepEqual(filterEmployees([filterEmployee], {}, 'CL8'), [filterEmployee]);
});
