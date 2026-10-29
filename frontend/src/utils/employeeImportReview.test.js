import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseEmployeeCsv } from './employeeCsv.js';
import { reviewEmployeeImport } from './employeeImportReview.js';

const employee = {
  employeeId: 'EMP1001',
  email: 'alex@example.com',
  name: 'Alex Santos',
  careerLevel: 'CL8',
  capability: 'Cloud',
  workLocation: 'Manila',
  skills: ['AWS'],
  attendanceStatus: 'Present',
  employeeStatus: 'Bench',
  absenceDays: 0,
  joiningDate: '2020-01-01',
  rollInDate: '2026-01-01',
};

test('adds new employees, preserves existing employees, and merges duplicate import rows', () => {
  const imported = reviewEmployeeImport(
    [
      { ...employee, employeeId: 'EMP2001', name: 'New Person' },
      {
        ...employee,
        careerLevel: 'CL9',
        attendanceStatus: 'Vacation Leave',
        employeeStatus: 'Project',
      },
      { ...employee },
      {
        ...employee,
        employeeId: 'EMP2001',
        name: 'New Person',
        skills: ['Kubernetes'],
      },
    ],
    [{ ...employee, id: 'employee-1' }],
  );

  assert.ok(imported.rows.some(({ type }) => type === 'new'));
  assert.ok(imported.rows.some(({ field }) => field === 'Existing employee preserved'));
  assert.equal(
    imported.rows.filter(({ field }) => field === 'Duplicate employee merged').length,
    2,
  );
  assert.equal(imported.changesToApply.length, 1);
  assert.equal(imported.changesToApply[0].employee.name, 'New Person');
});

test('the action sample adds new employees and preserves matching existing records', async () => {
  const csv = await readFile(
    new URL('../../public/sample-employee-import-actions.csv', import.meta.url),
    'utf8',
  );
  const { employees, errors } = parseEmployeeCsv(csv);
  assert.equal(employees.length, 20);
  const seededEmployees = [
    {
      id: 'alex',
      name: 'Alex Santos',
      careerLevel: 'CL8',
      capability: 'SRE / Hybrid Cloud',
      workLocation: 'Manila',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Python'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2020-02-10',
      rollInDate: '2026-07-14',
    },
    {
      id: 'maria',
      name: 'Maria Cruz',
      careerLevel: 'CL7',
      capability: 'Cloud Customer Edge',
      workLocation: 'Cebu',
      skills: ['Azure', 'Networking', 'Terraform'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05',
    },
    {
      id: 'john',
      name: 'John Reyes',
      careerLevel: 'CL6',
      capability: 'Network',
      workLocation: 'Manila',
      skills: ['Routing', 'Switching', 'Cisco'],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 1,
      joiningDate: '2021-11-01',
      rollInDate: '2026-09-10',
    },
  ];
  const review = reviewEmployeeImport(employees, seededEmployees);
  const types = review.rows.map(({ type }) => type);

  assert.deepEqual(errors, []);
  assert.ok(types.includes('new'));
  assert.ok(types.includes('duplicate'));
  assert.equal(review.changesToApply.length, 17);
  assert.equal(
    review.rows.filter(({ field }) => field === 'Existing employee preserved').length,
    3,
  );
});

test('preserves an existing employee matched by name when Employee ID is not supplied', () => {
  const imported = reviewEmployeeImport(
    [{ ...employee, employeeId: '', name: ' alex santos ', workLocation: 'Cebu' }],
    [{ ...employee, id: 'employee-1' }],
  );

  assert.equal(imported.rows[0].type, 'duplicate');
  assert.equal(imported.rows[0].field, 'Existing employee preserved');
  assert.deepEqual(imported.changesToApply, []);
});

test('normalizes legacy On Bench status to Bench during review', () => {
  const imported = reviewEmployeeImport(
    [{ ...employee, employeeStatus: 'On Bench', providedFields: ['name', 'employeeStatus'] }],
    [{ ...employee, id: 'employee-1' }],
  );

  assert.equal(imported.changesToApply.length, 0);
  assert.equal(imported.rows[0].type, 'duplicate');
});

test('merges repeated imported employee rows and adds a project employee as new', () => {
  const imported = reviewEmployeeImport(
    [
      {
        ...employee,
        employeeId: 'EMP2001',
        name: 'New Person',
        skills: ['AWS'],
        employeeStatus: 'Bench',
        providedFields: ['employeeId', 'name', 'skills', 'employeeStatus'],
      },
      {
        ...employee,
        employeeId: 'EMP2001',
        name: 'New Person',
        skills: ['Kubernetes'],
        employeeStatus: 'Project',
        providedFields: ['employeeId', 'name', 'skills', 'employeeStatus'],
      },
    ],
    [],
  );

  assert.equal(imported.employees.length, 1);
  assert.deepEqual(imported.employees[0].skills, ['AWS', 'Kubernetes']);
  assert.equal(imported.employees[0].employeeStatus, 'Project');
  assert.equal(imported.changesToApply.length, 1);
  assert.equal(imported.changesToApply[0].type, 'new');
  assert.equal(imported.rows[0].type, 'new');
  assert.equal(imported.rows[0].employee.employeeStatus, 'Project');
  assert.equal(imported.rollOffEmployees.length, 1);
  assert.equal(imported.rollOffEmployees[0].employee.name, 'New Person');
  assert.equal(imported.rollOffEmployees[0].previousEmployee, null);
});

test('an already project employee is preserved and shown in roll-off review', () => {
  const imported = reviewEmployeeImport(
    [
      {
        ...employee,
        employeeStatus: 'Project',
        providedFields: ['employeeId', 'name', 'employeeStatus'],
      },
    ],
    [{ ...employee, id: 'employee-1', employeeStatus: 'Project' }],
  );

  assert.equal(imported.changesToApply.length, 0);
  assert.equal(imported.rows[0].field, 'Existing employee preserved');
  assert.equal(imported.rollOffEmployees.length, 1);
  assert.equal(imported.rollOffEmployees[0].employee.employeeStatus, 'Project');
  assert.equal(imported.rollOffEmployees[0].previousEmployee.employeeStatus, 'Project');
});

test('an imported project activity is shown in roll-off review without overwriting a matching bench employee', () => {
  const imported = reviewEmployeeImport(
    [
      {
        ...employee,
        employeeStatus: 'Project',
        providedFields: ['employeeId', 'name', 'employeeStatus'],
      },
    ],
    [{ ...employee, id: 'employee-1', employeeStatus: 'Bench' }],
  );

  assert.equal(imported.changesToApply.length, 0);
  assert.equal(imported.rows[0].field, 'Existing employee preserved');
  assert.equal(imported.rollOffEmployees.length, 1);
  assert.equal(imported.rollOffEmployees[0].employee.employeeStatus, 'Project');
  assert.equal(imported.rollOffEmployees[0].previousEmployee.employeeStatus, 'Bench');
});

test('does not overwrite any fields on a matching existing employee', () => {
  const imported = reviewEmployeeImport(
    [
      {
        ...employee,
        workLocation: 'Cebu',
        employeeStatus: '',
        attendanceStatus: 'Present',
        providedFields: ['name', 'workLocation'],
      },
    ],
    [{ ...employee, id: 'employee-1', employeeStatus: 'Bootcamp' }],
  );

  assert.deepEqual(imported.changesToApply, []);
  assert.equal(imported.rows[0].field, 'Existing employee preserved');
});

test('does not add or update a name match with a conflicting Employee ID', () => {
  const imported = reviewEmployeeImport(
    [{ ...employee, employeeId: 'EMP2002' }],
    [{ ...employee, id: 'employee-1', employeeId: 'EMP1001' }],
  );

  assert.equal(imported.rows[0].type, 'duplicate');
  assert.equal(imported.rows[0].field, 'Employee ID mismatch');
  assert.deepEqual(imported.changesToApply, []);
});

test('marks ambiguous name matches as potential duplicates instead of updating', () => {
  const imported = reviewEmployeeImport(
    [{ ...employee, employeeId: '' }],
    [
      { ...employee, id: 'employee-1' },
      { ...employee, id: 'employee-2' },
    ],
  );

  assert.equal(imported.rows[0].type, 'duplicate');
  assert.match(imported.rows[0].newValue, /unique Employee ID/);
  assert.deepEqual(imported.changesToApply, []);
});
