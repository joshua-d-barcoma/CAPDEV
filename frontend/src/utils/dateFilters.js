function localDate(year, month, day) {
  return new Date(year, month, day);
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDays(date, days) {
  return localDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getDatePresetRange(preset, today = new Date()) {
  const currentDay = localDate(today.getFullYear(), today.getMonth(), today.getDate());
  let start;
  let end;

  if (preset === 'Today') {
    start = currentDay;
    end = currentDay;
  } else if (preset === 'Yesterday') {
    start = shiftDays(currentDay, -1);
    end = start;
  } else if (preset === 'Last week') {
    const daysSinceMonday = (currentDay.getDay() + 6) % 7;
    end = shiftDays(currentDay, -daysSinceMonday - 1);
    start = shiftDays(end, -6);
  } else if (preset === 'Last month') {
    start = localDate(currentDay.getFullYear(), currentDay.getMonth() - 1, 1);
    end = localDate(currentDay.getFullYear(), currentDay.getMonth(), 0);
  } else if (preset === 'Last quarter') {
    const currentQuarter = Math.floor(currentDay.getMonth() / 3);
    const quarterStartMonth = currentQuarter * 3;
    end = localDate(currentDay.getFullYear(), quarterStartMonth, 0);
    start = localDate(end.getFullYear(), end.getMonth() - 2, 1);
  } else {
    throw new Error(`Unknown date range preset: ${preset}`);
  }

  return { start: toDateKey(start), end: toDateKey(end) };
}

export function isDateInRange(date, range) {
  return Boolean(date && range?.start && range?.end && date >= range.start && date <= range.end);
}

export function getCalendarDates(month) {
  const firstOfMonth = localDate(month.getFullYear(), month.getMonth(), 1);
  const gridStart = shiftDays(firstOfMonth, -((firstOfMonth.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => shiftDays(gridStart, index));
}

export function shiftCalendarMonth(month, amount) {
  return localDate(month.getFullYear(), month.getMonth() + amount, 1);
}

export function formatDateKey(
  dateKey,
  options = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en', options).format(localDate(year, month - 1, day));
}

export function getDateRangeLabel(range) {
  if (!range?.start || !range?.end) return '';
  if (range.start === range.end) return formatDateKey(range.start);
  return `${formatDateKey(range.start, { month: 'short', day: 'numeric' })} - ${formatDateKey(
    range.end,
  )}`;
}
