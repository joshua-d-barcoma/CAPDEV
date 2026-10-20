import { isDateInRange } from './dateFilters.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const BENCH_TENURE_BUCKETS = [
  { label: '0 - 30 days', min: 0, max: 30 },
  { label: '31 - 60 days', min: 31, max: 60 },
  { label: '61 - 90 days', min: 61, max: 90 },
  { label: '91 - 120+ days', min: 91, max: Infinity },
];

export const CAREER_LEVELS = ['CL5', 'CL6', 'CL7', 'CL8', 'CL9', 'CL10'];

export function getEmployeeFilterOptions(employees) {
  const getSortedValues = (values) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return {
    capabilities: getSortedValues(employees.map((employee) => employee.capability)),
    careerLevels: getSortedValues(employees.map((employee) => employee.careerLevel)),
    skills: getSortedValues(employees.flatMap((employee) => employee.skills ?? [])),
    attendanceStatuses: getSortedValues(employees.map((employee) => employee.attendanceStatus)),
    locations: getSortedValues(employees.map((employee) => employee.workLocation)),
  };
}

export function filterEmployees(employees, filters, search = '') {
  const query = search.trim().toLocaleLowerCase();

  return employees.filter((employee) => {
    const searchableText = [
      employee.name,
      employee.capability,
      employee.workLocation,
      employee.careerLevel,
      ...(employee.skills ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();

    return (
      (!query || searchableText.includes(query)) &&
      (!filters.capability || employee.capability === filters.capability) &&
      (!filters.careerLevel || employee.careerLevel === filters.careerLevel) &&
      (!filters.skill || (employee.skills ?? []).includes(filters.skill)) &&
      (!filters.attendance || employee.attendanceStatus === filters.attendance) &&
      (!filters.location || employee.workLocation === filters.location) &&
      (!filters.joiningDate || isDateInRange(employee.joiningDate, filters.joiningDate)) &&
      (!filters.rollInDate || isDateInRange(employee.rollInDate, filters.rollInDate))
    );
  });
}

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

export function getCapabilityReadiness(employees) {
  const capabilities = [
    ...new Set(employees.map((employee) => employee.capability).filter(Boolean)),
  ].sort((first, second) => first.localeCompare(second));

  return capabilities.map((capability) => {
    const members = employees.filter((employee) => employee.capability === capability);
    const present = members.filter((employee) => employee.attendanceStatus === 'Present').length;

    return {
      capability,
      headcount: members.length,
      attendancePercent: members.length ? Math.round((present / members.length) * 100) : null,
    };
  });
}

export function getSkillDistribution(employees, limit = 12) {
  const counts = new Map();

  employees.forEach((employee) => {
    (employee.skills ?? []).forEach((skill) => {
      if (skill) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((first, second) => second.count - first.count || first.skill.localeCompare(second.skill))
    .slice(0, limit);
}

export function getEmployeeCountsBy(employees, property) {
  const counts = new Map();

  employees.forEach((employee) => {
    const value = employee[property];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}
