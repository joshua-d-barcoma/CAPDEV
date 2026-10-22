import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMandatoryTraining,
  addSkillHubItem,
  addEmployee,
  deleteEmployee,
  reviewEmployeeScheduleRequest,
  submitEmployeeScheduleRequest,
  updateLearningAssignment,
  updateMandatoryTraining,
} from './benchDataService.js';

function createData() {
  return {
    employees: [{ id: 'employee-1', name: 'Alex Santos' }],
    attendanceRecords: [{ id: 'attendance-1', employeeId: 'employee-1' }],
    employeeSchedules: { 'employee-1': { Monday: 'Onsite', Friday: 'Work from home' } },
    scheduleRequests: [],
  };
}

test('employee create and delete operations return updated immutable data', () => {
  const initial = createData();
  const withNewEmployee = addEmployee(initial, { name: 'Maria Cruz' });
  const created = withNewEmployee.employees.find((employee) => employee.name === 'Maria Cruz');

  assert.ok(created.id.startsWith('employee-'));
  assert.equal(initial.employees.length, 1);
  assert.equal(withNewEmployee.employees.length, 2);

  const afterDelete = deleteEmployee(withNewEmployee, 'employee-1');
  assert.equal(afterDelete.employees.length, 1);
  assert.equal(afterDelete.attendanceRecords.length, 0);
  assert.equal(afterDelete.employeeSchedules['employee-1'], undefined);
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
