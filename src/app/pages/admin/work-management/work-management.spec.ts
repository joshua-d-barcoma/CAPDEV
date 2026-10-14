import { WorkManagement } from './work-management';

describe('WorkManagement', () => {
  it('summarizes tracked tasks and open work', () => {
    const page = new WorkManagement();

    expect(page.totalTasks).toBe(104);
    expect(page.overdueTasks).toBe(6);
    expect(page.unassignedTasks).toBe(3);
    expect(page.completedTasks).toBe(49);
  });

  it('updates the pending distribution count after assigning a task', () => {
    const page = new WorkManagement();

    page.assignTask(page.pendingTasks[0]);

    expect(page.unassignedTasks).toBe(2);
    expect(page.pendingTasks[0].assigned).toBe(true);
  });
});
