import assert from 'node:assert/strict';
import test from 'node:test';
import { getTaskStatus, getTasksForDistribution } from './productivityTasks.js';

test('incomplete tasks past their due date are overdue', () => {
  const today = new Date(2026, 9, 22);

  assert.equal(getTaskStatus({ status: 'Not Started', due: 'Oct 15' }, today), 'Overdue');
  assert.equal(getTaskStatus({ status: 'In Progress', due: '2026-10-21' }, today), 'Overdue');
});

test('tasks due today or later are not overdue', () => {
  const today = new Date(2026, 9, 22);

  assert.equal(getTaskStatus({ status: 'Not Started', due: 'Today' }, today), 'Not Started');
  assert.equal(getTaskStatus({ status: 'In Progress', due: 'Oct 23' }, today), 'In Progress');
});

test('completed tasks remain completed even when their due date has passed', () => {
  assert.equal(
    getTaskStatus({ status: 'Completed', due: 'Oct 15' }, new Date(2026, 9, 22)),
    'Completed',
  );
});

test('distribution includes unassigned overdue tasks and excludes assigned tasks', () => {
  const tasks = [
    { id: 'overdue', status: 'In Progress', due: 'Oct 15' },
    { id: 'pending', status: 'Not Started', due: 'Oct 23' },
    { id: 'assigned', status: 'Not Started', due: 'Oct 23', assigneeId: 'employee-1' },
    { id: 'completed', status: 'Completed', due: 'Oct 15' },
  ];

  assert.deepEqual(
    getTasksForDistribution(tasks, new Date(2026, 9, 22)).map((task) => task.id),
    ['overdue', 'pending'],
  );
});
