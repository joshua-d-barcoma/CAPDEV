import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

export default function ActionItemsPage() {
  const { actionItems, updateActionItem } = useBenchData();
  const [filter, setFilter] = useState('All');
  const filteredItems = useMemo(
    () =>
      actionItems.filter(
        (item) =>
          filter === 'All' || (filter === 'Done' ? item.status === 'Done' : item.status !== 'Done'),
      ),
    [actionItems, filter],
  );
  const open = actionItems.filter((item) => item.status !== 'Done');

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Bench Management"
        title="Action Items"
        description="Prioritize follow-ups that keep employees engaged and deployment-ready."
      />
      <div className="stat-grid">
        <StatCard label="Open items" value={open.length} detail="Awaiting completion" icon="⚑" />
        <StatCard
          label="High priority"
          value={open.filter((item) => item.priority === 'High').length}
          detail="Open high-priority items"
          tone="red"
          icon="!"
        />
        <StatCard
          label="Due today"
          value={open.filter((item) => item.due === 'Due today').length}
          detail="Requires attention today"
          tone="orange"
          icon="◷"
        />
        <StatCard
          label="Completed"
          value={actionItems.length - open.length}
          detail="Closed action items"
          tone="green"
          icon="✓"
        />
      </div>
      <Panel title="Action register" eyebrow="Follow-up queue">
        <div className="filter-tabs" role="tablist" aria-label="Filter action items">
          {['All', 'Open', 'Done'].map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={filter === item}
              className={filter === item ? 'selected' : ''}
              onClick={() => setFilter(item)}
            >
              {item}
              <span>
                {item === 'All'
                  ? actionItems.length
                  : item === 'Done'
                    ? actionItems.length - open.length
                    : open.length}
              </span>
            </button>
          ))}
        </div>
        <div className="action-list">
          {filteredItems.map((item) => (
            <article className="action-card" key={item.id}>
              <span className={`priority-mark priority-${item.priority.toLowerCase()}`} />
              <div className="action-card-main">
                <div className="action-title-row">
                  <h3>{item.title}</h3>
                  <StatusBadge status={item.priority} />
                </div>
                <p>{item.description}</p>
                <span className="action-meta">
                  {item.category} · Owner: {item.owner} · {item.due}
                </span>
              </div>
              <label className="status-field">
                <span>Status</span>
                <select
                  value={item.status}
                  onChange={(event) => updateActionItem(item.id, event.target.value)}
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </label>
            </article>
          ))}
          {filteredItems.length === 0 && (
            <p className="muted-copy">No action items in this view.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
