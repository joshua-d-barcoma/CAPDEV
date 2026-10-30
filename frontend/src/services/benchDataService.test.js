import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addTask,
  addMandatoryTraining,
  addSkillHubItem,
  addEmployee,
  deleteEmployee,
  getEmployeeLeaveBalances,
  reviewEmployeeScheduleRequest,
  submitEmployeeScheduleRequest,
  updateTaskAssignee,
  updateLearningAssignment,
  updateMandatoryTraining,
  updateCheckInStatus,
} from './benchDataService.js';

function createData() {
  return {
    employees: [{ id: 'employee-1', name: 'Alex Santos' }],
    tasks: [],
    attendanceRecords: [{ id: 'attendance-1', employeeId: 'employee-1' }],
    employeeSchedules: { 'employee-1': { Monday: 'Onsite', Friday: 'Work from home' } },
    scheduleRequests: [],
  };
}

test('adding a development task returns immutable data with a generated id', () => {
  const initial = { tasks: [] };
  const updated = addTask(initial, {
    title: '  Cloud Fundamentals  ',
    description: 'Build foundational cloud skills.',
    due: 'No due date',
    priority: 'Medium',
    status: 'Not Started',
    category: 'Development',
    assigneeId: 'employee-1',
  });

  assert.equal(initial.tasks.length, 0);
  assert.equal(updated.tasks.length, 1);
  assert.equal(updated.tasks[0].title, 'Cloud Fundamentals');
  assert.ok(updated.tasks[0].id.startsWith('task-'));
  assert.throws(() => addTask(initial, { title: ' ' }), /A task title is required/);
});

test('employee create and delete operations return updated immutable data', () => {
  const initial = createData();
  initial.tasks = [{ id: 'task-1', assigneeId: 'employee-1' }];
  const withNewEmployee = addEmployee(initial, { name: 'Maria Cruz' });
  const created = withNewEmployee.employees.find((employee) => employee.name === 'Maria Cruz');

  assert.ok(created.id.startsWith('employee-'));
  assert.equal(initial.employees.length, 1);
  assert.equal(withNewEmployee.employees.length, 2);

  const afterDelete = deleteEmployee(withNewEmployee, 'employee-1');
  assert.equal(afterDelete.employees.length, 1);
  assert.equal(afterDelete.attendanceRecords.length, 0);
  assert.equal(afterDelete.employeeSchedules['employee-1'], undefined);
  assert.equal(afterDelete.tasks[0].assigneeId, undefined);
  assert.equal(initial.tasks[0].assigneeId, 'employee-1');
});

test('approving a pending schedule request updates the employee schedule', () => {
  const initial = createData();
  const withRequest = submitEmployeeScheduleRequest(initial, {
    employeeId: 'employee-1',
    employeeName: 'Alex Santos',
    schedule: { Monday: 'Work from home', Friday: 'Onsite' },
  });
  const request = withRequest.scheduleRequests[0];
  const reviewed = reviewEmployeeScheduleRequest(withRequest, request.id, 'Approved');

  assert.equal(reviewed.employeeSchedules['employee-1'].Monday, 'Work from home');
  assert.equal(reviewed.scheduleRequests[0].status, 'Approved');
  assert.throws(
    () => reviewEmployeeScheduleRequest(reviewed, request.id, 'Rejected'),
    /Only pending schedule requests can be reviewed/,
  );
  assert.equal(initial.scheduleRequests.length, 0);
});

test('a second pending request of the same kind is rejected', () => {
  const withRequest = submitEmployeeScheduleRequest(createData(), {
    employeeId: 'employee-1',
    employeeName: 'Alex Santos',
    schedule: { Monday: 'Work from home' },
  });

  assert.throws(
    () =>
      submitEmployeeScheduleRequest(withRequest, {
        employeeId: 'employee-1',
        employeeName: 'Alex Santos',
        schedule: { Monday: 'Onsite' },
      }),
    /one pending schedule request/,
  );
});

test('calendar leave balances count approved and pending days once against annual allowances', () => {
  const balances = getEmployeeLeaveBalances(
    'employee-1',
    [
      { employeeId: 'employee-1', date: '2026-10-01', status: 'Vacation Leave' },
      { employeeId: 'employee-1', date: '2026-10-02', status: 'Sick Leave' },
    ],
    [
      {
        employeeId: 'employee-1',
        kind: 'calendar',
        date: '2026-10-01',
        requestType: 'Vacation leave',
        status: 'Approved',
      },
      {
        employeeId: 'employee-1',
        kind: 'calendar',
        date: '2026-10-05',
        requestType: 'Vacation leave',
        status: 'Pending',
      },
      {
        employeeId: 'employee-1',
        kind: 'calendar',
        date: '2026-10-04',
        requestType: 'Sick leave',
        status: 'Rejected',
      },
    ],
  );

  assert.deepEqual(balances['Vacation leave'], {
    entitlement: 15,
    used: 1,
    pending: 1,
    remaining: 13,
  });
  assert.deepEqual(balances['Sick leave'], {
    entitlement: 10,
    used: 1,
    pending: 0,
    remaining: 9,
  });
});

test('calendar leave requests reserve balances and prevent duplicate or excess usage', () => {
  const initial = createData();
  const withPendingLeave = submitEmployeeScheduleRequest(initial, {
    employeeId: 'employee-1',
    employeeName: 'Alex Santos',
    requestType: 'Sick leave',
    date: '2026-10-30',
  });

  assert.equal(
    getEmployeeLeaveBalances(
      'employee-1',
      withPendingLeave.attendanceRecords,
      withPendingLeave.scheduleRequests,
    )['Sick leave'].remaining,
    9,
  );
  assert.throws(
    () =>
      submitEmployeeScheduleRequest(withPendingLeave, {
        employeeId: 'employee-1',
        employeeName: 'Alex Santos',
        requestType: 'Sick leave',
        date: '2026-10-30',
      }),
    /already exists for this date/,
  );

  const weekdays = [];
  for (let day = 1; weekdays.length < 15; day += 1) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    if (![0, 6].includes(new Date(`${date}T00:00:00`).getDay())) weekdays.push(date);
  }
  const fullyUsed = {
    ...initial,
    scheduleRequests: weekdays.map((date) => ({
      employeeId: 'employee-1',
      kind: 'calendar',
      date,
      requestType: 'Vacation leave',
      status: 'Approved',
    })),
  };
  assert.throws(
    () =>
      submitEmployeeScheduleRequest(fullyUsed, {
        employeeId: 'employee-1',
        employeeName: 'Alex Santos',
        requestType: 'Vacation leave',
        date: '2026-12-01',
      }),
    /No Vacation leave balance remains/,
  );
});

test('calendar leave requests are recorded as approved without pending review', () => {
  const updated = submitEmployeeScheduleRequest(createData(), {
    employeeId: 'employee-1',
    employeeName: 'Alex Santos',
    requestType: 'Vacation leave',
    date: '2026-10-30',
  });

  assert.equal(updated.scheduleRequests[0].status, 'Approved');
  assert.equal(
    getEmployeeLeaveBalances('employee-1', updated.attendanceRecords, updated.scheduleRequests)[
      'Vacation leave'
    ].used,
    1,
  );
  assert.equal(
    getEmployeeLeaveBalances('employee-1', updated.attendanceRecords, updated.scheduleRequests)[
      'Vacation leave'
    ].pending,
    0,
  );
});

test('calendar leave requests are rejected on non-working weekends', () => {
  assert.throws(
    () =>
      submitEmployeeScheduleRequest(createData(), {
        employeeId: 'employee-1',
        employeeName: 'Alex Santos',
        requestType: 'Sick leave',
        date: '2026-10-31',
      }),
    /Leave is not needed on weekends/,
  );
});

test('time-out submission adds the time and accomplishments to the matching attendance record', () => {
  const initial = {
    checkedIn: true,
    attendanceRecords: [
      { id: 'attendance-1', employeeId: 'employee-1', date: '2026-10-30', timeIn: '08:00 AM' },
      { id: 'attendance-2', employeeId: 'employee-2', date: '2026-10-30', timeIn: '08:30 AM' },
    ],
  };

  const updated = updateCheckInStatus(initial, false, {
    employeeId: 'employee-1',
    date: '2026-10-30',
    timeOut: '05:00 PM',
    accomplishments: 'Completed assigned trainings.',
  });

  assert.equal(initial.checkedIn, true);
  assert.equal(initial.attendanceRecords[0].timeOut, undefined);
  assert.equal(updated.checkedIn, false);
  assert.equal(updated.attendanceRecords[0].timeOut, '05:00 PM');
  assert.equal(updated.attendanceRecords[0].accomplishments, 'Completed assigned trainings.');
  assert.equal(updated.attendanceRecords[1].timeOut, undefined);
});

test('time-out submission rejects when there is no matching attendance record', () => {
  const initial = {
    checkedIn: true,
    attendanceRecords: [],
  };

  assert.throws(
    () =>
      updateCheckInStatus(initial, false, {
        employeeId: 'employee-1',
        date: '2026-10-30',
        timeOut: '05:00 PM',
        accomplishments: 'Completed assigned trainings.',
      }),
    /Attendance record was not found for the time-out submission/,
  );
  assert.equal(initial.checkedIn, true);
});

test('recording a learning completion updates status and completion date', () => {
  const initial = {
    learningAssignments: [
      {
        id: 'learning-1',
        employeeId: 'employee-1',
        trainingId: 'training-1',
        status: 'In Progress',
        completionDate: null,
      },
    ],
  };

  const updated = updateLearningAssignment(initial, 'learning-1', 'Completed');

  assert.equal(initial.learningAssignments[0].status, 'In Progress');
  assert.equal(updated.learningAssignments[0].status, 'Completed');
  assert.match(updated.learningAssignments[0].completionDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.throws(
    () => updateLearningAssignment(updated, 'missing', 'Completed'),
    /Learning assignment was not found/,
  );
});

test('adding mandatory training assigns it to current employees and edits the catalog', () => {
  const initial = {
    employees: [{ id: 'employee-1' }, { id: 'employee-2' }],
    mandatoryTraining: [],
    learningAssignments: [],
  };

  const withTraining = addMandatoryTraining(initial, {
    title: 'Security Awareness',
    description: 'Required annual training.',
    due: 'Oct 16',
    status: 'Active',
  });

  const training = withTraining.mandatoryTraining[0];

  assert.equal(withTraining.learningAssignments.length, 2);
  assert.ok(withTraining.learningAssignments.every((item) => item.trainingId === training.id));
  assert.ok(withTraining.learningAssignments.every((item) => item.status === 'Not Started'));
  assert.equal(initial.mandatoryTraining.length, 0);

  const updated = updateMandatoryTraining(withTraining, training.id, { status: 'Inactive' });
  assert.equal(updated.mandatoryTraining[0].status, 'Inactive');
  assert.throws(
    () => updateMandatoryTraining(updated, 'missing', { status: 'Inactive' }),
    /Mandatory training was not found/,
  );
});

test('adding Skill Hub offerings persists the matching certification, cohort, or announcement', () => {
  const initial = { certifications: [], cohorts: [], announcements: [] };
  const withCertification = addSkillHubItem(initial, 'certifications', {
    title: 'Cloud Fundamentals',
    detail: 'Recommended',
    status: 'Recommended',
  });
  const withCohort = addSkillHubItem(initial, 'cohorts', {
    name: 'Cloud Elite',
    focus: 'Cloud engineering',
    duration: '6 weeks',
  });
  const withAnnouncement = addSkillHubItem(initial, 'announcements', {
    title: 'Learning update',
    description: 'New offerings are available.',
    category: 'Learning',
  });

  assert.equal(withCertification.certifications[0].title, 'Cloud Fundamentals');
  assert.equal(withCohort.cohorts[0].joined, false);
  assert.equal(withCohort.cohorts[0].duration, '6 weeks');
  assert.equal(withAnnouncement.announcements[0].category, 'Learning');
  assert.throws(() => addSkillHubItem(initial, 'invalid', {}), /Skill Hub category is invalid/);
});
test('assigning a task stores the employee id without mutating the original task', () => {
  const initial = {
    employees: [{ id: 'employee-1', name: 'Alex Santos' }],
    tasks: [{ id: 'task-1', title: 'Review requirements', status: 'Not Started' }],
  };

  const assigned = updateTaskAssignee(initial, 'task-1', 'employee-1');

  assert.equal(assigned.tasks[0].assigneeId, 'employee-1');
  assert.equal(initial.tasks[0].assigneeId, undefined);
  assert.throws(
    () => updateTaskAssignee(initial, 'task-1', 'missing-employee'),
    /selected employee does not exist/,
  );
});
