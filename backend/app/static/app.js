const TOKEN_KEY = 'benchflow.demo.token';
const DEMO_PASSWORD = 'bench-flow-portal';
const PAGE_TITLES = {
  'admin-dashboard': ['Bench Overview', 'Bench management overview'],
  employees: ['Employees', 'Bench resource directory'],
  attendance: ['Attendance', 'Attendance and RTO management'],
  learning: ['Learning', 'Capability development'],
  productivity: ['Productivity', 'Tasks and productivity'],
  'action-items': ['Action Items', 'Follow up on bench operations'],
  'user-dashboard': ['My Dashboard', 'Your bench workspace'],
  tasks: ['My Tasks', 'Training and development tasks'],
  'time-entry': ['Time In', 'Record your workday attendance'],
  history: ['Attendance History', 'Review your attendance and schedule'],
  calendar: ['My Calendar', 'Attendance and planned leave'],
  'skill-hub': ['Skill Hub', 'Learning and development'],
  'employee-profile': ['Employee Profile', 'Resource details and development'],
};

const ROLE_HOME = { admin: '/admin/dashboard', user: '/u/dashboard' };
const ROLE_PAGES = {
  admin: new Set([
    'admin-dashboard', 'employees', 'attendance', 'learning', 'productivity',
    'action-items', 'employee-profile',
  ]),
  user: new Set(['user-dashboard', 'tasks', 'time-entry', 'history', 'calendar', 'skill-hub']),
};

function showMessage(container, message, isError = false) {
  const target = container.querySelector('[data-message]');
  if (!target) return;
  target.textContent = message;
  target.dataset.error = String(isError);
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = displayValue(value);
  row.append(cell);
}

function renderTable(target, columns, rows, emptyMessage = 'No records available.') {
  const card = target.closest('[data-api]');
  target.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const title = document.createElement('strong');
    title.textContent = 'Nothing to show yet';
    const description = document.createElement('span');
    description.textContent = emptyMessage;
    empty.append(title, description);
    target.append(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  const head = document.createElement('thead');
  const headingRow = document.createElement('tr');
  columns.forEach((column) => {
    const heading = document.createElement('th');
    heading.scope = 'col';
    heading.textContent = column.label;
    headingRow.append(heading);
  });
  head.append(headingRow);
  const body = document.createElement('tbody');
  rows.forEach((record) => {
    const row = document.createElement('tr');
    columns.forEach((column) => {
      if (Array.isArray(column.status)) {
        const cell = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'status-select';
        select.setAttribute('aria-label', `${column.label} for ${record.title}`);
        column.status.forEach((value) => select.add(new Option(value, value)));
        select.value = record[column.key];
        select.addEventListener('change', async () => {
          try {
            await apiRequest(column.updateUrl(record), {
              method: 'PATCH',
              body: JSON.stringify({ status: select.value }),
            });
            await loadCards();
          } catch (error) {
            showMessage(card, error.message, true);
            select.value = record[column.key];
          }
        });
        cell.append(select);
        row.append(cell);
      } else if (column.status) {
        const cell = document.createElement('td');
        const badge = document.createElement('span');
        const value = displayValue(record[column.key]);
        badge.className = `status-badge status-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        badge.textContent = value;
        cell.append(badge);
        row.append(cell);
      } else {
        addCell(row, column.get ? column.get(record) : record[column.key]);
      }
    });
    body.append(row);
  });
  table.append(head, body);
  target.append(table);
}

function renderStatCards(target, stats) {
  target.replaceChildren();
  stats.forEach(({ label, value, detail, icon, tone }) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    const symbol = document.createElement('span');
    symbol.className = `stat-icon ${tone || ''}`.trim();
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = icon;
    const content = document.createElement('div');
    content.className = 'stat-content';
    const name = document.createElement('span');
    name.className = 'stat-label';
    name.textContent = label;
    const number = document.createElement('strong');
    number.textContent = displayValue(value);
    const description = document.createElement('span');
    description.className = 'stat-detail';
    description.textContent = detail;
    content.append(name, number, description);
    card.append(symbol, content);
    target.append(card);
  });
}

function setStats(name, stats) {
  const target = document.querySelector(`[data-stats="${name}"]`);
  if (target) renderStatCards(target, stats);
}

function renderBadges(items) {
  return items.map((item) => {
    const badge = document.createElement('span');
    const value = displayValue(item);
    badge.className = 'tag';
    badge.textContent = value;
    return badge;
  });
}

function renderBars(target, groups, labelKey, countKey, suffix = '') {
  target.replaceChildren();
  if (!groups.length) {
    target.textContent = 'No source records available.';
    target.className = 'empty-state';
    return;
  }
  target.className = 'bar-list';
  const max = Math.max(...groups.map((group) => Number(group[countKey]) || 0), 1);
  groups.forEach((group) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const label = document.createElement('span');
    label.textContent = displayValue(group[labelKey]);
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(3, ((Number(group[countKey]) || 0) / max) * 100)}%`;
    track.append(fill);
    const value = document.createElement('strong');
    value.textContent = `${displayValue(group[countKey])}${suffix}`;
    row.append(label, track, value);
    target.append(row);
  });
}

async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) {
    let message = body || `Request failed (${response.status}).`;
    try {
      message = JSON.parse(body).detail || message;
    } catch {
      // Keep the original response body for non-JSON errors.
    }
    throw new Error(message);
  }
  return body ? JSON.parse(body) : null;
}

function renderEmployeeTable(target, records) {
  const search = document.querySelector('[data-table-search]');
  const location = document.querySelector('[data-location-filter]');
  const locations = [...new Set(records.map((row) => row.location).filter(Boolean))].sort();
  if (location) {
    const selected = location.value;
    location.replaceChildren(new Option('All locations', ''));
    locations.forEach((value) => location.add(new Option(value, value)));
    location.value = selected;
  }
  const filtered = records.filter((employee) => {
    const haystack = [
      employee.first_name, employee.last_name, employee.employee_id,
      employee.capability_area, employee.location, ...(employee.skills || []),
    ].join(' ').toLowerCase();
    return haystack.includes(search?.value.toLowerCase() || '')
      && (!location?.value || employee.location === location.value);
  });
  const count = document.querySelector('[data-result-count]');
  if (count) count.textContent = `${filtered.length} resources`;
  renderTable(target, [
    { label: 'Employee', get: (row) => `${row.first_name} ${row.last_name} · ${row.management_level || 'Level n/a'}` },
    { label: 'Capability', key: 'capability_area' },
    { label: 'Location', key: 'location' },
    { label: 'Key skills', get: (row) => (row.skills || []).slice(0, 3).join(' · ') },
    { label: 'Status', key: 'activity_type', status: true },
  ], filtered, 'Try a different search or location.');
}

function renderAttendanceTable(target, records) {
  const search = document.querySelector('[data-table-search]');
  const statusFilter = document.querySelector('[data-status-filter]');
  const filtered = records.filter((row) => {
    const term = `${row.first_name || ''} ${row.last_name || ''} ${row.location || ''} ${row.work_type || ''}`.toLowerCase();
    return term.includes(search?.value.toLowerCase() || '')
      && (!statusFilter?.value || row.status === statusFilter.value);
  });
  renderTable(target, [
    { label: 'Employee', get: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.employee_id },
    { label: 'Date', key: 'date' },
    { label: 'Time in', key: 'time_in' },
    { label: 'Work type', key: 'work_type' },
    { label: 'Location', key: 'location' },
    { label: 'Status', key: 'status', status: true },
  ], filtered);
}

function renderCompactList(target, records, kind) {
  target.replaceChildren();
  if (!records.length) {
    target.textContent = 'No records available.';
    return;
  }
  records.slice(0, 5).forEach((record) => {
    const row = document.createElement('div');
    row.className = 'compact-row';
    const marker = document.createElement('span');
    if (kind === 'actions') {
      marker.className = `priority-mark priority-${(record.priority || 'medium').toLowerCase()}`;
    } else {
      marker.className = 'avatar-small';
      marker.textContent = `${record.first_name?.[0] || ''}${record.last_name?.[0] || ''}`;
    }
    const main = document.createElement('span');
    main.className = 'compact-row-main';
    const title = document.createElement('strong');
    title.textContent = kind === 'actions'
      ? record.title
      : `${record.first_name || ''} ${record.last_name || ''}`.trim() || record.employee_id;
    const detail = document.createElement('small');
    detail.textContent = kind === 'actions'
      ? `${record.owner || 'Unassigned'} · ${record.due_date || 'No due date'}`
      : kind === 'tasks'
        ? `${record.category} · Due ${record.due_date || 'not specified'}`
        : `${record.location || 'Location not recorded'} · ${record.capability || ''}`;
    main.append(title, detail);
    const badge = document.createElement('span');
    const status = kind === 'actions' ? record.status : record.status || 'Unknown';
    badge.className = `status-badge status-${String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    badge.textContent = status;
    row.append(marker, main, badge);
    target.append(row);
  });
}

function renderLearning(target, data) {
  const records = data.records || [];
  target.replaceChildren();
  if (!records.length) {
    target.textContent = 'No training records available.';
    return;
  }
  records.forEach((record) => {
    const row = document.createElement('article');
    row.className = 'learning-row';
    const icon = document.createElement('span');
    icon.className = 'learning-icon';
    icon.textContent = '◇';
    const main = document.createElement('div');
    main.className = 'learning-main';
    const title = document.createElement('strong');
    title.textContent = record.name;
    const subtext = document.createElement('span');
    subtext.textContent = `${record.category || 'Training'} · Due ${record.due_date || 'not specified'}`;
    const progress = document.createElement('div');
    progress.className = 'progress-track';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(0, Math.min(Number(record.progress_pct) || 0, 100))}%`;
    progress.append(fill);
    main.append(title, subtext, progress);
    const badge = document.createElement('span');
    const value = record.status || 'Unknown';
    badge.className = `status-badge status-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    badge.textContent = value;
    row.append(icon, main, badge);
    target.append(row);
  });
}

function renderPersonalTraining(target, data) {
  renderLearning(target, { records: data.training || [] });
}

function handleApiData(card, data) {
  const target = card.querySelector('[data-output]');
  switch (card.dataset.view) {
    case 'dashboard-stats': {
      const dashboard = data;
      const attendance = dashboard.attendance;
      const attendanceRate = dashboard.headcount
        ? Math.round((attendance.present / dashboard.headcount) * 100)
        : null;
      setStats('dashboard', [
        { label: 'Total Bench Employees', value: dashboard.headcount, detail: 'Active bench employees', icon: '♙' },
        { label: 'Attendance Today', value: attendanceRate === null ? '—' : `${attendanceRate}%`, detail: `${attendance.present} recorded present`, icon: '✓', tone: 'green' },
        { label: 'RTO Non-Compliance', value: attendance.rto_non_compliant, detail: 'Recorded onsite schedule exceptions', icon: '!', tone: 'orange' },
        { label: 'Open Action Items', value: dashboard.action_items.open, detail: `${dashboard.action_items.total} total items`, icon: '⚑', tone: 'blue' },
      ]);
      break;
    }
    case 'employees': {
      const active = data.filter((row) => row.is_active);
      const capabilities = new Set(data.map((row) => row.capability_area).filter(Boolean));
      setStats('employees', [
        { label: 'Total Bench Employees', value: data.length, detail: 'Employee directory records', icon: '♙' },
        { label: 'Active Employees', value: active.length, detail: 'Currently active', icon: '✓', tone: 'green' },
        { label: 'Capabilities', value: capabilities.size, detail: 'Across the bench', icon: '◇', tone: 'blue' },
        { label: 'Missing Skill Data', value: data.filter((row) => !row.skills?.length).length, detail: 'Profiles without recorded skills', icon: '!', tone: 'orange' },
      ]);
      renderEmployeeTable(target, data);
      card.querySelector('[data-table-search]')?.addEventListener('input', () => renderEmployeeTable(target, data));
      card.querySelector('[data-location-filter]')?.addEventListener('change', () => renderEmployeeTable(target, data));
      break;
    }
    case 'attendance-stats': {
      const attendance = data;
      setStats('attendance', [
        { label: 'Attendance Records', value: attendance.records, detail: 'Persisted check-ins', icon: '♙' },
        { label: 'Present', value: attendance.present, detail: 'Recorded present', icon: '✓', tone: 'green' },
        { label: 'Tardiness Count', value: '—', detail: 'Time policy is not configured', icon: '◷', tone: 'orange' },
        { label: 'Non-Compliance', value: attendance.rto_non_compliant, detail: 'Recorded onsite exceptions', icon: '!', tone: 'red' },
        { label: 'RTO Compliance', value: attendance.rto_compliance_rate === null ? '—' : `${attendance.rto_compliance_rate}%`, detail: 'Scheduled onsite days only', icon: '↗', tone: 'blue' },
      ]);
      break;
    }
    case 'attendance-table':
      renderAttendanceTable(target, data);
      card.querySelector('[data-table-search]')?.addEventListener('input', () => renderAttendanceTable(target, data));
      card.querySelector('[data-status-filter]')?.addEventListener('change', () => renderAttendanceTable(target, data));
      break;
    case 'attendance-capability': {
      const grouped = new Map();
      data.forEach((row) => {
        if (!row.capability || row.rto_compliant === null) return;
        const stats = grouped.get(row.capability) || { capability: row.capability, compliant: 0, total: 0 };
        stats.total += 1;
        if (row.rto_compliant) stats.compliant += 1;
        grouped.set(row.capability, stats);
      });
      const result = [...grouped.values()].map((group) => ({
        capability: group.capability,
        rate: group.total ? Math.round((group.compliant / group.total) * 100) : 0,
      }));
      renderBars(target, result, 'capability', 'rate', '%');
      break;
    }
    case 'attendance-preview':
      renderCompactList(target, data, 'attendance');
      break;
    case 'capabilities': {
      const counts = new Map();
      data.forEach((row) => {
        const capability = row.capability_area || 'Unassigned';
        counts.set(capability, (counts.get(capability) || 0) + 1);
      });
      renderBars(target, [...counts].map(([capability, count]) => ({ capability, count })), 'capability', 'count');
      break;
    }
    case 'action-preview':
      renderCompactList(target, data.filter((row) => row.status !== 'Done'), 'actions');
      break;
    case 'learning':
      setStats('learning', [
        { label: 'Training assignments', value: data.summary.total_assignments, detail: 'Across filtered employees', icon: '◇' },
        { label: 'Completed', value: data.summary.completed, detail: `${data.summary.completion_rate ?? '—'}% completion`, icon: '✓', tone: 'green' },
        { label: 'In progress', value: data.summary.in_progress, detail: 'Active learning', icon: '◷', tone: 'blue' },
        { label: 'Employees with training', value: data.summary.employees_with_training, detail: 'Source-backed assignments', icon: '♙', tone: 'orange' },
      ]);
      renderLearning(target, data);
      break;
    case 'personal-training':
      renderPersonalTraining(target, data);
      break;
    case 'actions':
    case 'action-items':
      setStats('actions', [
        { label: 'Action Items', value: data.length, detail: 'Total assigned items', icon: '⚑' },
        { label: 'Open', value: data.filter((row) => row.status === 'Open').length, detail: 'Needs follow-up', icon: '◷', tone: 'orange' },
        { label: 'In Progress', value: data.filter((row) => row.status === 'In Progress').length, detail: 'Being worked', icon: '✓', tone: 'blue' },
        { label: 'High Priority', value: data.filter((row) => row.priority === 'High' && row.status !== 'Done').length, detail: 'Open high-priority actions', icon: '!', tone: 'red' },
      ]);
      renderTable(target, [
        { label: 'Action item', key: 'title' }, { label: 'Owner', key: 'owner' },
        { label: 'Category', key: 'category' }, { label: 'Due date', key: 'due_date' },
        { label: 'Priority', key: 'priority' },
        {
          label: 'Status', key: 'status', status: ['Open', 'In Progress', 'Done'],
          updateUrl: (row) => `/api/action-items/${encodeURIComponent(row.id)}`,
        },
      ], data);
      break;
    case 'tasks':
      setStats('tasks', [
        { label: 'My Tasks', value: data.length, detail: 'App-owned tasks', icon: '✓' },
        { label: 'Not Started', value: data.filter((row) => row.status === 'Not Started').length, detail: 'Ready to begin', icon: '◷', tone: 'orange' },
        { label: 'In Progress', value: data.filter((row) => row.status === 'In Progress').length, detail: 'Currently active', icon: '◇', tone: 'blue' },
        { label: 'Completed', value: data.filter((row) => row.status === 'Completed').length, detail: 'Finished tasks', icon: '✓', tone: 'green' },
      ]);
      renderTable(target, [
        { label: 'Task', key: 'title' }, { label: 'Due date', key: 'due_date' },
        { label: 'Category', key: 'category' }, { label: 'Priority', key: 'priority' },
        {
          label: 'Status', key: 'status', status: ['Not Started', 'In Progress', 'Completed'],
          updateUrl: (row) => `/api/me/tasks/${encodeURIComponent(row.id)}`,
        },
      ], data);
      break;
    case 'personal':
      setStats('personal', [
        { label: 'Recorded Check-ins', value: data.attendance.records, detail: `${data.attendance.present} present`, icon: '♙' },
        { label: 'My Tasks', value: data.tasks.length, detail: 'Personal development tasks', icon: '✓', tone: 'blue' },
        { label: 'Training Items', value: data.training.length, detail: 'Workday status is read-only', icon: '◇', tone: 'orange' },
        { label: 'Recommendations', value: data.recommendations.status === 'unavailable' ? '—' : data.recommendations.items.length, detail: data.recommendations.status, icon: '✦' },
      ]);
      document.querySelector('[data-welcome-copy]')?.replaceChildren(
        document.createTextNode(`Here’s your personal development overview, ${data.employee.preferred_name || data.employee.first_name}.`),
      );
      break;
    case 'personal-tasks':
      renderCompactList(target, data.tasks, 'tasks');
      break;
    case 'recommendations':
      target.replaceChildren();
      const note = document.createElement('p');
      note.className = 'recommendation-note';
      note.textContent = data.recommendations.reason || 'No recommendations are currently available.';
      target.append(note);
      break;
    case 'personal-history':
      renderTable(target, [
        { label: 'Date', key: 'date' }, { label: 'Time in', key: 'time_in' },
        { label: 'Work type', key: 'work_type' }, { label: 'Location', key: 'location' },
        { label: 'Status', key: 'status', status: true },
      ], data.attendance.records || []);
      break;
    case 'skill-hub': {
      target.replaceChildren();
      const main = document.createElement('div');
      main.className = 'profile-main';
      const name = document.createElement('strong');
      name.textContent = `${data.employee.first_name} ${data.employee.last_name}`;
      const capability = document.createElement('span');
      capability.className = 'muted-copy';
      capability.textContent = data.employee.capability_area || 'No capability recorded';
      main.append(name, capability);
      const skills = document.createElement('div');
      skills.className = 'profile-skills';
      const label = document.createElement('strong');
      label.textContent = 'Recorded skills';
      const tags = document.createElement('div');
      tags.className = 'skill-tags';
      renderBadges(data.employee.skills || []).forEach((tag) => tags.append(tag));
      skills.append(label, tags);
      target.append(main, skills);
      break;
    }
    case 'personal-attendance':
      renderTable(target, [
        { label: 'Date', key: 'date' }, { label: 'Time in', key: 'time_in' },
        { label: 'Work type', key: 'work_type' }, { label: 'Location', key: 'location' },
        { label: 'Status', key: 'status', status: true },
      ], data.attendance.records || []);
      break;
    case 'applicability':
      renderTable(target, [
        { label: 'Course', key: 'course_name' }, { label: 'Population', key: 'population_rule' },
        { label: 'Effective from', key: 'effective_from' }, { label: 'Effective to', key: 'effective_to' },
      ], data);
      break;
    case 'productivity':
      renderTable(target, [
        { label: 'Metric', get: (row) => row.label },
        { label: 'Value', get: (row) => row.value },
        { label: 'Notes', get: (row) => row.notes },
      ], [
        { label: 'Headcount', value: data.headcount, notes: 'Filtered employee records' },
        { label: 'Attendance records', value: data.attendance.records, notes: 'Persisted attendance' },
        { label: 'RTO compliance rate', value: data.attendance.rto_compliance_rate === null ? 'Unavailable' : `${data.attendance.rto_compliance_rate}%`, notes: 'Scheduled onsite days only' },
        { label: 'Learning completion', value: data.training.completion_rate === null ? 'Unavailable' : `${data.training.completion_rate}%`, notes: 'Persisted training assignments' },
        { label: 'Deployment ready', value: data.deployment_readiness.eligible, notes: `Latest snapshots; ${data.deployment_readiness.missing_snapshots} employees missing snapshots` },
        { label: 'Open action items', value: data.action_items.open, notes: 'Application-owned follow-up items' },
      ]);
      break;
    default:
      renderTable(target, [], []);
  }
}

async function loadCards() {
  const cards = document.querySelectorAll('[data-api]');
  await Promise.all([...cards].map(async (card) => {
    try {
      const data = await apiRequest(card.dataset.api);
      handleApiData(card, data);
      showMessage(card, '');
    } catch (error) {
      showMessage(card, error.message, true);
    }
  }));
}

async function initializeWorkspace() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.replace('/login');
    return;
  }
  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (response.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.location.replace('/login');
      return;
    }
    if (!response.ok) {
      showWorkspaceError(`Could not verify the demo session (${response.status}).`);
      return;
    }
    const principal = await response.json();
    const page = document.documentElement.dataset.page;
    if (!ROLE_PAGES[principal.role]?.has(page)) {
      window.location.replace(ROLE_HOME[principal.role] || '/login');
      return;
    }
    document.querySelectorAll('[data-role]').forEach((link) => {
      link.hidden = link.dataset.role !== principal.role;
      if (link.pathname === window.location.pathname) link.classList.add('active');
    });
    const roleLabel = principal.role === 'admin' ? 'Admin / Bench Lead' : 'User / Bench Resource';
    const name = principal.display_name;
    document.querySelector('[data-profile-name]').textContent = name;
    document.querySelector('[data-profile-role]').textContent = roleLabel;
    document.querySelector('[data-role-label]').textContent = roleLabel;
    document.querySelector('[data-avatar]').textContent = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    const [title, subtitle] = PAGE_TITLES[page] || ['BenchFlow', 'Bench management workspace'];
    document.querySelector('[data-header-title]').textContent = title;
    document.querySelector('[data-header-subtitle]').textContent = subtitle;
    document.title = `${title} · BenchFlow`;
    await loadCards();
  } catch (error) {
    showWorkspaceError(error instanceof Error ? error.message : 'Could not connect to the backend.');
  }
}

function showWorkspaceError(message) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const error = document.createElement('div');
  error.className = 'inline-error';
  error.setAttribute('role', 'alert');
  error.textContent = message;
  main.prepend(error);
}

document.querySelector('[data-login-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  try {
    const session = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    sessionStorage.setItem(TOKEN_KEY, session.access_token);
    window.location.assign(ROLE_HOME[session.user.role] || '/login');
  } catch (error) {
    showMessage(form, error.message, true);
  }
});

document.querySelectorAll('[data-demo-username]').forEach((account) => {
  account.addEventListener('click', () => {
    const form = document.querySelector('[data-login-form]');
    const usernameInput = form?.querySelector('[name="username"]');
    const passwordInput = form?.querySelector('[name="password"]');
    if (!form || !usernameInput || !passwordInput) return;
    usernameInput.value = account.dataset.demoUsername;
    passwordInput.value = DEMO_PASSWORD;
    document.querySelectorAll('[data-demo-username]').forEach((option) => {
      option.setAttribute('aria-pressed', String(option === account));
    });
    form.requestSubmit();
  });
});

document.querySelector('[data-check-in-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  try {
    const record = await apiRequest('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    showMessage(form, `Check-in recorded for ${record.attendance_date}.`);
  } catch (error) {
    showMessage(form, error.message, true);
  }
});

document.querySelector('[data-task-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  if (!values.due_date) delete values.due_date;
  try {
    await apiRequest('/api/me/tasks', { method: 'POST', body: JSON.stringify(values) });
    showMessage(form, 'Task added.');
    form.reset();
    await loadCards();
  } catch (error) {
    showMessage(form, error.message, true);
  }
});

document.querySelector('[data-sign-out]')?.addEventListener('click', () => {
  sessionStorage.removeItem(TOKEN_KEY);
});

document.querySelector('[data-sidebar-toggle]')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.toggle('collapsed');
});

document.querySelectorAll('[data-download]').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(link.href, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY) || ''}` },
      });
      if (!response.ok) throw new Error((await response.text()) || `Download failed (${response.status}).`);
      const file = URL.createObjectURL(await response.blob());
      const download = document.createElement('a');
      download.href = file;
      download.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'report.csv';
      download.click();
      URL.revokeObjectURL(file);
    } catch (error) {
      showMessage(link.closest('.panel'), error.message, true);
    }
  });
});

if (document.querySelector('.app-layout')) {
  initializeWorkspace();
}
