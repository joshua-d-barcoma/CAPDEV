const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const BENCH_TENURE_BUCKETS = [
  { label: '0 - 30 days', min: 0, max: 30 },
  { label: '31 - 60 days', min: 31, max: 60 },
  { label: '61 - 90 days', min: 61, max: 90 },
  { label: '91 - 120+ days', min: 91, max: Infinity },
];

export const CAREER_LEVELS = ['CL5', 'CL6', 'CL7', 'CL8', 'CL9', 'CL10'];

function toUtcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDaysOnBench(rollInDate, today = new Date()) {
  if (!rollInDate) return null;
  const parsedDate = new Date(`${rollInDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return Math.max(0, Math.floor((toUtcDay(today) - toUtcDay(parsedDate)) / DAY_IN_MILLISECONDS));
}

export function getBenchTenureCounts(employees, today = new Date()) {
  const counts = BENCH_TENURE_BUCKETS.map((bucket) => ({ ...bucket, count: 0 }));

  employees.forEach((employee) => {
    const daysOnBench = getDaysOnBench(employee.rollInDate, today);
    const bucket = counts.find(
      ({ min, max }) => daysOnBench !== null && daysOnBench >= min && daysOnBench <= max,
    );
    if (bucket) bucket.count += 1;
  });

  return counts;
}

export function getCareerLevelCounts(employees) {
  return CAREER_LEVELS.map((level) => ({
    level,
    count: employees.filter((employee) => employee.careerLevel === level).length,
  }));
}
