import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteEmployeeImportHistoryEntry, importEmployees } from './benchDataService.js';

function createData() {
  return {
    employees: [{ id: 'employee-1', name: 'Existing Employee' }],
    employeeImportHistory: [],
    learningAssignments: [],
    mandatoryTraining: [],
  };
}

test('employee import adds new employees and records the uploaded file snapshot', () => {
  const initial = createData();
  const updated = importEmployees(
    initial,
    [{ type: 'new', employee: { name: 'Imported Employee', employeeStatus: 'Bench' } }],
    'employees.csv',
    {
      employees: [{ name: 'Imported Employee', employeeStatus: 'Bench' }],
      sourceHeaders: ['Name', 'Status'],
      sourceRows: [['Imported Employee', 'Bench']],
    },
  );
  const entry = updated.employeeImportHistory[0];

  assert.equal(initial.employees.length, 1);
  assert.equal(initial.employeeImportHistory.length, 0);
  assert.equal(updated.employees.length, 2);
  assert.equal(updated.employees[1].name, 'Imported Employee');
  assert.equal(updated.employees[1].employeeStatus, 'Bench');
  assert.equal(entry.fileName, 'employees.csv');
  assert.equal(entry.count, 1);
  assert.equal(entry.changesApplied, 1);
  assert.deepEqual(entry.sourceRows, [['Imported Employee', 'Bench']]);
  assert.equal(entry.employees[0].providedFields, undefined);
});

test('employee import history entries can be deleted without changing employees', () => {
  const initial = {
    ...createData(),
    employeeImportHistory: [{ id: 'import-1' }, { id: 'import-2' }],
  };
  const updated = deleteEmployeeImportHistoryEntry(initial, 'import-1');

  assert.deepEqual(updated.employeeImportHistory, [{ id: 'import-2' }]);
  assert.equal(updated.employees, initial.employees);
});
