import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEmployeeReportRows, serializeCsvRows } from './employeeReport.js';

test('resource report includes scoped resource metrics and supplemental data', () => {
  const rows = buildEmployeeReportRows({
    generatedAt: new Date('2026-10-28T08:00:00.000Z'),
    employees: [
      {
        id: 'employee-1',
        name: 'Alex Santos',
        careerLevel: 'CL8',
        workLocation: 'Manila',
        capability: 'Hybrid Cloud',
        skills: ['AWS', 'Terraform'],
        attendanceStatus: 'Present',
        joiningDate: '2020-02-10',
        rollInDate: '2026-10-01',
      },
    ],
    attendanceRecords: [
      {
        employeeId: 'employee-1',
        date: '2026-10-28',
        timeIn: '08:42 AM',
        workType: 'Onsite',
        location: 'Mandaluyong, CG2',
        status: 'Present',
      },
      {
        employeeId: 'employee-2',
        date: '2026-10-28',
        timeIn: '—',
        workType: '—',
        location: '—',
        status: 'Unapproved Absence',
      },
    ],
    employeeSchedules: {
      'employee-1': {
        Monday: 'Onsite',
        Tuesday: 'Onsite',
        Wednesday: 'Onsite',
        Thursday: 'Onsite',
        Friday: 'Work from home',
      },
    },
    cohorts: [
      {
        name: 'Cloud Elite',
        focus: 'Cloud engineering',
        duration: '6-week mission',
        joined: true,
      },
    ],
  });
  const reportText = serializeCsvRows(rows);

  assert.match(reportText, /"Headcount","1"/);
  assert.match(reportText, /"Present today","1"/);
  assert.match(reportText, /"Attendance Records"/);
  assert.match(reportText, /"Employee RTO Schedule"/);
  assert.match(reportText, /"Alex Santos","Onsite","Onsite","Onsite","Onsite","Work from home"/);
  assert.match(reportText, /"Alex Santos","2026-10-28","08:42 AM","Onsite"/);
  assert.match(reportText, /"Skills"/);
  assert.match(reportText, /"Terraform","1"/);
  assert.match(reportText, /"Cohort catalog","Cloud Elite"/);
  assert.match(reportText, /"Illustrative demo mission","Cloud Elite"/);
  assert.match(reportText, /"Deployment Pipeline"/);
  assert.doesNotMatch(reportText, /employee-2/);
});

test('CSV serialization quotes fields and escapes embedded quotes', () => {
  assert.equal(
    serializeCsvRows([
      ['Employee', 'Name'],
      ['Alex', 'Ace, "Cloud"'],
    ]),
    '\uFEFF"Employee","Name"\r\n"Alex","Ace, ""Cloud"""',
  );
});