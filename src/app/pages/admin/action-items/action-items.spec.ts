import { ActionItems } from './action-items';

describe('ActionItems', () => {
  it('shows open items by default and filters completed items', () => {
    const page = new ActionItems();

    expect(page.filteredActionItems).toHaveLength(6);
    expect(page.openCount).toBe(5);
    expect(page.highPriorityCount).toBe(3);
    expect(page.dueTodayCount).toBe(2);

    page.setFilter('Done');

    expect(page.filteredActionItems).toHaveLength(1);
    expect(page.filteredActionItems[0].status).toBe('Done');
  });

  it('updates action status from the selected value', () => {
    const page = new ActionItems();
    const select = document.createElement('select');
    select.add(new Option('Done', 'Done'));
    select.value = 'Done';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: select });

    page.updateStatus(page.actionItems[0], event);

    expect(page.actionItems[0].status).toBe('Done');
    expect(page.openCount).toBe(4);
  });
});
