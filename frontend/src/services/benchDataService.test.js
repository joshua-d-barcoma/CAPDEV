import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addEmployee,
  deleteEmployee,
  reviewEmployeeScheduleRequest,
  submitEmployeeScheduleRequest,
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
