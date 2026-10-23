import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseEmployeeCsv, parseEmployeeExcel } from './employeeCsv.js';

test('the downloadable sample employee CSV can be imported without validation errors', async () => {
  const csv = await readFile(
    new URL('../../public/sample-employee-import.csv', import.meta.url),
    'utf8',
  );
  const result = parseEmployeeCsv(csv);

  assert.deepEqual(result.errors, []);
  assert.equal(result.employees.length, 4);
  assert.equal(result.employees[0].employeeStatus, 'Bench');
  assert.equal(result.employees[3].skills.length, 3);
  assert.equal(result.employees[3].capability, 'Cloud Engineering');
});

test('the leave and deployed sample includes four new bench employees and three deployed employees', async () => {
  const csv = await readFile(
    new URL('../../public/sample-employee-import-leaves-and-deployed.csv', import.meta.url),
    'utf8',
  );
  const result = parseEmployeeCsv(csv);

  assert.deepEqual(result.errors, []);
  assert.equal(result.employees.length, 7);
  assert.deepEqual(
    result.employees
      .slice(0, 4)
      .map(({ employeeStatus, attendanceStatus }) => [employeeStatus, attendanceStatus]),
    [
      ['Bench', 'Sick Leave'],
      ['Bench', 'Vacation Leave'],
      ['Bench', 'Unapproved Absence'],
      ['Bench', 'Emergency Leave'],
    ],
  );
  assert.ok(result.employees.slice(4).every(({ employeeStatus }) => employeeStatus === 'Project'));
});

test('parses employee summaries with quoted values and optional fields', () => {
  const result = parseEmployeeCsv(
    'Full Name,Capability,Career Level,Location,Key Skills,Joining Date,Status\n' +
      '"Alex Santos","SRE, Hybrid Cloud",CL8,Manila,"AWS, Kubernetes",2020-02-10,Bench',
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.employees, [
    {
      employeeId: '',
      email: '',
      name: 'Alex Santos',
      capability: 'SRE, Hybrid Cloud',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      skills: ['AWS', 'Kubernetes'],
      attendanceStatus: 'Present',
      employeeStatus: 'Bench',
      absenceDays: 0,
      joiningDate: '2020-02-10',
      rollInDate: '',
      providedFields: [
        'name',
        'capability',
        'careerLevel',
        'workLocation',
        'skills',
        'employeeStatus',
        'joiningDate',
      ],
    },
  ]);
});

test('parses the employee file headers and join-date-only layout', () => {
  const result = parseEmployeeCsv(
    'EID,Activity Type,Level,Primary Skill,Join Date\n' + 'Alex Santos,Bench,CL8,AWS,2020-02-10',
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.employees.length, 1);
  assert.equal(result.employees[0].name, 'Alex Santos');
  assert.equal(result.employees[0].employeeStatus, 'Bench');
  assert.equal(result.employees[0].careerLevel, 'CL8');
  assert.deepEqual(result.employees[0].skills, ['AWS']);
  assert.equal(result.employees[0].joiningDate, '2020-02-10');
  assert.equal(result.employees[0].rollInDate, '');
  assert.equal(result.employees[0].capability, '');
  assert.equal(result.employees[0].workLocation, '');
  assert.deepEqual(result.sourceHeaders, [
    'EID',
    'Activity Type',
    'Level',
    'Primary Skill',
    'Join Date',
  ]);
  assert.deepEqual(result.sourceRows, [['Alex Santos', 'Bench', 'CL8', 'AWS', '2020-02-10']]);
});

test('preserves every uploaded column and raw cell for history', () => {
  const result = parseEmployeeCsv(
    'EID,Activity Type,Level,Primary Skill,Join Date,Project Name,Manager,Allocation %\n' +
      'Alex Santos,Project,CL8,AWS,2020-02-10,Atlas,Jordan Lee,80',
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.sourceHeaders, [
    'EID',
    'Activity Type',
    'Level',
    'Primary Skill',
    'Join Date',
    'Project Name',
    'Manager',
    'Allocation %',
  ]);
  assert.deepEqual(result.sourceRows, [
    ['Alex Santos', 'Project', 'CL8', 'AWS', '2020-02-10', 'Atlas', 'Jordan Lee', '80'],
  ]);
});

test('rejects missing required columns and invalid employee rows', () => {
  const missingHeaders = parseEmployeeCsv('Name,Location\nAlex,Manila');
  assert.deepEqual(missingHeaders.employees, []);
  assert.match(missingHeaders.errors[0], /Missing required columns/);
  assert.match(missingHeaders.errors[0], /Join Date/);

  const invalidRow = parseEmployeeCsv(
    'Name,Capability,Career Level,Location,Joining Date,Absence Days,Status,Key Skills\n' +
      'Alex,SRE,CL8,Manila,2026-02-30,-1,Bench,AWS',
  );
  assert.equal(invalidRow.employees.length, 1);
  assert.ok(invalidRow.errors.some((error) => error.includes('not a valid date')));
  assert.ok(invalidRow.errors.some((error) => error.includes('non-negative whole number')));

  const missingJoinDate = parseEmployeeCsv(
    'EID,Activity Type,Level,Primary Skill,Join Date\nAlex,Bench,CL8,AWS,',
  );
  assert.ok(missingJoinDate.errors.some((error) => error.includes('Join Date is required')));
});

test('reports malformed quoted CSV instead of importing partial data', () => {
  const result = parseEmployeeCsv(
    'Name,Capability,Career Level,Location,Roll-in Date\n"Alex,SRE,CL8,Manila,2026-10-21',
  );

  assert.deepEqual(result.employees, []);
  assert.match(result.errors[0], /Unclosed quoted value/);
});

test('rejects employee statuses not supported by the import workflow', () => {
  const result = parseEmployeeCsv(
    'Name,Capability,Career Level,Location,Joining Date,Status,Key Skills\n' +
      'Alex,SRE,CL8,Manila,2020-01-01,Removed,AWS',
  );

  assert.ok(result.errors.some((error) => error.includes('Activity Type must be one of')));
});

test('normalizes the legacy On Bench status to Bench', () => {
  const result = parseEmployeeCsv(
    'Name,Capability,Career Level,Location,Joining Date,Status,Key Skills\n' +
      'Alex,SRE,CL8,Manila,2020-01-01,On Bench,AWS',
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.employees[0].employeeStatus, 'Bench');
});

test('accepts the four current activity types and maps legacy activity values', () => {
  const result = parseEmployeeCsv(
    'EID,Activity Type,Level,Primary Skill,Join Date\n' +
      'Bench User,Bench,CL8,AWS,2020-01-01\n' +
      'Project User,Project,CL8,AWS,2020-01-01\n' +
      'Training User,Training,CL8,AWS,2020-01-01\n' +
      'Internal User,Internal,CL8,AWS,2020-01-01\n' +
      'Legacy Deployed,Deployed,CL8,AWS,2020-01-01\n' +
      'Legacy Training,On Training,CL8,AWS,2020-01-01\n' +
      'Legacy Internal,Internal Project,CL8,AWS,2020-01-01',
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.employees.map(({ employeeStatus }) => employeeStatus),
    ['Bench', 'Project', 'Training', 'Internal', 'Project', 'Training', 'Internal'],
  );
});

test('rejects invalid Excel workbook data with a parse error', async () => {
  const result = await parseEmployeeExcel(new ArrayBuffer(0));

  assert.deepEqual(result.employees, []);
  assert.ok(result.errors.length > 0);
});

test('parses Excel cells that contain numbers and dates without throwing', async () => {
  const workbook = await readFile(new URL('./fixtures/employee-mixed-cells.xlsx', import.meta.url));
  const result = await parseEmployeeExcel(
    workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength),
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.employees.length, 1);
  assert.equal(result.employees[0].name, 'Mixed Cell User');
  assert.equal(result.employees[0].careerLevel, '8');
  assert.equal(result.employees[0].joiningDate, '2020-02-10');
  assert.equal(result.employees[0].rollInDate, '');
  assert.equal(result.employees[0].absenceDays, 0);
  assert.ok(result.employees[0].providedFields.includes('absenceDays'));
});
