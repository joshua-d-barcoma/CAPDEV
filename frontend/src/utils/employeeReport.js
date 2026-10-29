import {
  getBenchTenureCounts,
  getCapabilityReadiness,
  getCareerLevelCounts,
  getEmployeeCountsBy,
  getDaysOnBench,
  getSkillDistribution,
} from './employeeInsights.js';
import {
  DEMO_COHORT_PROGRESS,
  DEMO_DEPLOYMENT_STAGES,
  DEMO_READINESS_METRICS,
} from './employeePageDemoData.js';

const RTO_COMPLIANCE_BENCHMARK = 85;
const ABSENCE_STATUSES = new Set(['Unapproved Absence', 'Vacation Leave']);

function addSection(rows, title, columns, entries) {
  rows.push([], [title], columns, ...entries);
}

function getReadinessRows(employees) {
  return getCapabilityReadiness(employees).map((item) => {
    const demoMetrics = DEMO_READINESS_METRICS[item.capability] ?? {
      mandatoryTraining: 82,
      proficiency: 76,
      deliverables: 88,
    };
    const scores = [
      item.attendancePercent,
      demoMetrics.mandatoryTraining,
      demoMetrics.proficiency,
      demoMetrics.deliverables,
    ].filter((score) => score !== null);
    const overall = Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);

    return [
      item.capability,
      item.headcount,
      item.attendancePercent === null ? '' : `${item.attendancePercent}%`,
      `${demoMetrics.mandatoryTraining}%`,
      `${demoMetrics.proficiency}%`,
      `${demoMetrics.deliverables}%`,
      `${overall}%`,
      'Training, proficiency, and deliverables are illustrative demo values.',
    ];
  });
}

export function buildEmployeeReportRows({
  employees,
  attendanceRecords,
  employeeSchedules = {},
  cohorts,
  scope = {},
  search = '',
  generatedAt = new Date(),
}) {
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const scopedAttendance = attendanceRecords.filter((record) => employeeIds.has(record.employeeId));
  const absences = scopedAttendance.filter((record) => ABSENCE_STATUSES.has(record.status));
  const presentCount = employees.filter(
    (employee) => employee.attendanceStatus === 'Present',
  ).length;
  const attendanceRate = employees.length
    ? `${Math.round((presentCount / employees.length) * 100)}%`
    : '0%';
  const capabilityCounts = getEmployeeCountsBy(employees, 'capability');
  const locationCounts = getEmployeeCountsBy(employees, 'workLocation');
  const benchStatusCounts = getEmployeeCountsBy(employees, 'attendanceStatus');
  const skills = getSkillDistribution(employees, Infinity);
  const tenureBuckets = getBenchTenureCounts(employees);
  const careerLevels = getCareerLevelCounts(employees);
  const rows = [
    ['BenchFlow Resource Report'],
    ['Generated at', generatedAt.toISOString()],
    ['Resource records in scope', employees.length],
  ];

  addSection(
    rows,
    'Report Scope',
    ['Filter', 'Selected value'],
    [
      ['Search', search || 'All employees'],
      ['Capability', scope.capability || 'All capabilities'],
      ['Career level', scope.careerLevel || 'All career levels'],
      ['Location', scope.location || 'All locations'],
      ['Skill', scope.skill || 'All skills'],
      ['Attendance', scope.attendance || 'All statuses'],
      [
        'Joining date',
        scope.joiningDate
          ? `${scope.joiningDate.start} to ${scope.joiningDate.end || 'open-ended'}`
          : 'Any date',
      ],
      [
        'Roll-in date',
        scope.rollInDate
          ? `${scope.rollInDate.start} to ${scope.rollInDate.end || 'open-ended'}`
          : 'Any date',
      ],
    ],
  );

  addSection(
    rows,
    'Resource Summary',
    ['Metric', 'Value', 'Notes'],
    [
      ['Headcount', employees.length, 'Active bench employees in the selected employee scope.'],
      ['Present today', presentCount, 'Based on current employee attendance status.'],
      ['Attendance rate', attendanceRate, 'Present employees divided by scoped headcount.'],
      [
        'Non-compliance',
        employees.filter((employee) => employee.attendanceStatus === 'Unapproved Absence').length,
        'Employees currently marked with an unapproved absence.',
      ],
      [
        'RTO compliance',
        `${RTO_COMPLIANCE_BENCHMARK}%`,
        'Illustrative demo benchmark shown in the Attendance section; not calculated from this scope.',
      ],
      [
        'Absence and leave records',
        absences.length,
        'Unapproved absence and vacation leave attendance records in scope.',
      ],
    ],
  );

  addSection(
    rows,
    'Employees',
    [
      'Employee',
      'Career level',
      'Location',
      'Capability',
      'Skills',
      'Attendance status',
      'Joining date',
      'Roll-in date',
      'Days on bench',
    ],
    employees.map((employee) => [
      employee.name,
      employee.careerLevel,
      employee.workLocation,
      employee.capability,
      (employee.skills ?? []).join(' | '),
      employee.attendanceStatus,
      employee.joiningDate,
      employee.rollInDate,
      getDaysOnBench(employee.rollInDate) ?? '',
    ]),
  );

  addSection(
    rows,
    'Time in Bench',
    ['Time-in-bench range', 'Headcount'],
    tenureBuckets.map((bucket) => [bucket.label, bucket.count]),
  );
  addSection(
    rows,
    'Skills',
    ['Skill', 'Employee count'],
    skills.map(({ skill, count }) => [skill, count]),
  );
  addSection(
    rows,
    'Bench Status',
    ['Status', 'Employee count'],
    benchStatusCounts.map(({ label, count }) => [label, count]),
  );
  addSection(
    rows,
    'Career Level',
    ['Career level', 'Employee count'],
    careerLevels.map(({ level, count }) => [level, count]),
  );
  addSection(
    rows,
    'Location',
    ['Location', 'Employee count'],
    locationCounts.map(({ label, count }) => [label, count]),
  );
  addSection(
    rows,
    'Capability',
    ['Capability', 'Employee count'],
    capabilityCounts.map(({ label, count }) => [label, count]),
  );
  addSection(
    rows,
    'Employee RTO Schedule',
    ['Employee', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    employees.map((employee) => {
      const schedule = employeeSchedules[employee.id] ?? {};
      return [
        employee.name,
        schedule.Monday,
        schedule.Tuesday,
        schedule.Wednesday,
        schedule.Thursday,
        schedule.Friday,
      ];
    }),
  );
  addSection(
    rows,
    'Readiness by Capability',
    [
      'Capability',
      'Headcount',
      'Attendance / RTO',
      'Mandatory training',
      'Proficiency',
      'EOD / deliverables',
      'Overall readiness',
      'Data note',
    ],
    getReadinessRows(employees),
  );
  addSection(
    rows,
    'Absences and Leave',
    ['Employee', 'Date', 'Status', 'Time in', 'Work type', 'Location'],
    absences.map((record) => [
      employees.find((employee) => employee.id === record.employeeId)?.name ?? 'Unknown employee',
      record.date,
      record.status,
      record.timeIn,
      record.workType,
      record.location,
    ]),
  );
  addSection(
    rows,
    'Attendance Records',
    ['Employee', 'Date', 'Time in', 'Work type', 'Location', 'Status'],
    scopedAttendance.map((record) => [
      employees.find((employee) => employee.id === record.employeeId)?.name ?? 'Unknown employee',
      record.date,
      record.timeIn,
      record.workType,
      record.location,
      record.status,
    ]),
  );
  addSection(
    rows,
    'Cohorts and Missions',
    ['Source', 'Name', 'Focus', 'Duration', 'Members', 'Progress', 'Joined', 'Data note'],
    [
      ...cohorts.map((cohort) => [
        'Cohort catalog',
        cohort.name,
        cohort.focus,
        cohort.duration,
        '',
        '',
        cohort.joined ? 'Yes' : 'No',
        'Cohort catalog data; employee-level membership is not available.',
      ]),
      ...DEMO_COHORT_PROGRESS.map((cohort) => [
        'Illustrative demo mission',
        cohort.name,
        cohort.focus,
        '',
        cohort.members,
        `${cohort.progress}%`,
        '',
        'Illustrative demo data; not linked to the selected employee records.',
      ]),
    ],
  );
  addSection(
    rows,
    'Deployment Pipeline',
    ['Stage', 'Headcount', 'Data note'],
    DEMO_DEPLOYMENT_STAGES.map((stage) => [
      stage.label,
      stage.count,
      'Illustrative demo pipeline data; not linked to the selected employee records.',
    ]),
  );

  return rows;
}

export function serializeCsvRows(rows) {
  return `\uFEFF${rows
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')}`;
}