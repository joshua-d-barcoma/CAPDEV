const STORAGE_KEY = 'bench-flow:data:v2';
const DEFAULT_SCHEDULE = Object.freeze({
  Monday: 'Onsite',
  Tuesday: 'Onsite',
  Wednesday: 'Onsite',
  Thursday: 'Onsite',
  Friday: 'Work from home',
});

function todayDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

const today = todayDate();

const initialData = {
  employees: [
    {
      id: 'employee-alex-santos',
      name: 'Alex Santos',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'SRE / Hybrid Cloud',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Python'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2020-02-10',
      rollInDate: '2026-07-14',
    },
    {
      id: 'employee-maria-cruz',
      name: 'Maria Cruz',
      careerLevel: 'CL7',
      workLocation: 'Cebu',
      capability: 'Cloud Customer Edge',
      skills: ['Azure', 'Networking', 'Terraform'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05',
    },
    {
      id: 'employee-john-reyes',
      name: 'John Reyes',
      careerLevel: 'CL6',
      workLocation: 'Manila',
      capability: 'Network',
      skills: ['Routing', 'Switching', 'Cisco'],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 1,
      joiningDate: '2021-11-01',
      rollInDate: '2026-09-10',
    },
    {
      id: 'employee-sarah-garcia',
      name: 'Sarah Garcia',
      careerLevel: 'CL9',
      workLocation: 'Cebu',
      capability: 'Hybrid Cloud - Operations',
      skills: ['AWS', 'Linux', 'Kubernetes', 'Docker'],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 3,
      joiningDate: '2019-04-15',
      rollInDate: '2026-06-20',
    },
    {
      id: 'employee-michael-tan',
      name: 'Michael Tan',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'Hybrid Cloud - Migration',
      skills: ['Azure', 'Migration', 'Terraform'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2023-01-09',
      rollInDate: '2026-09-25',
    },
    {
      id: 'employee-nicole-lim',
      name: 'Nicole Lim',
      careerLevel: 'CL5',
      workLocation: 'Cebu',
      capability: 'Service Management',
      skills: ['ITIL', 'ServiceNow', 'Incident Management'],
      attendanceStatus: 'Vacation Leave',
      absenceDays: 0,
      joiningDate: '2020-08-31',
      rollInDate: '2026-10-01',
    },
  ],
  tasks: [
    {
      id: 'task-security',
      title: 'Security Awareness',
      description: 'Complete the required annual security awareness training.',
      due: 'Oct 5',
      priority: 'High',
      status: 'Completed',
      category: 'Mandatory',
    },
    {
      id: 'task-privacy',
      title: 'Data Privacy & Protection',
      description: 'Complete the mandatory data privacy training.',
      due: 'Oct 7',
      priority: 'High',
      status: 'In Progress',
      category: 'Mandatory',
    },
    {
      id: 'task-safety',
      title: 'Workplace Safety',
      description: 'Complete the required workplace safety training.',
      due: 'Oct 15',
      priority: 'Medium',
      status: 'Not Started',
      category: 'Mandatory',
    },
    {
      id: 'task-profile',
      title: 'Update technical profile',
      description: 'Review and update your current skills and capability information.',
      due: 'Today',
      priority: 'High',
      status: 'In Progress',
      category: 'Development',
    },
    {
      id: 'task-azure',
      title: 'Complete Azure fundamentals',
      description: 'Strengthen foundational Azure knowledge.',
      due: 'Oct 8',
      priority: 'Medium',
      status: 'In Progress',
      category: 'Development',
    },
    {
      id: 'task-project',
      title: 'Review project requirements',
      description: 'Review the requirements for the upcoming project assignment.',
      due: 'Oct 10',
      priority: 'Low',
      status: 'Not Started',
      category: 'Assignment',
    },
    {
      id: 'task-resume',
      title: 'Submit updated resume',
      description: 'Upload the latest version of your professional resume.',
      due: 'Oct 12',
      priority: 'Medium',
      status: 'Completed',
      category: 'Development',
    },
  ],
  actionItems: [
    {
      id: 'action-training',
      title: 'Review overdue mandatory training',
      description: 'Follow up with three employees whose required training is overdue.',
      category: 'Learning',
      owner: 'Capability Development POC',
      due: 'Due today',
      priority: 'High',
      status: 'Open',
    },
    {
      id: 'action-allocation',
      title: 'Assign unallocated bench employees',
      description: 'Match two available employees with appropriate learning or internal work.',
      category: 'Assignment',
      owner: 'Bench Lead',
      due: 'Due today',
      priority: 'High',
      status: 'In Progress',
    },
    {
      id: 'action-profile',
      title: 'Complete missing employee profile information',
      description: 'Collect capability, skill, or resume details for three bench profiles.',
      category: 'Profile',
      owner: 'Bench Management Team',
      due: 'Due tomorrow',
      priority: 'Medium',
      status: 'Open',
    },
    {
      id: 'action-readiness',
      title: 'Review deployment readiness',
      description: 'Validate the profiles of five employees approaching deployment readiness.',
      category: 'Deployment',
      owner: 'Deployment POC',
      due: 'Due this week',
      priority: 'Medium',
      status: 'Open',
    },
    {
      id: 'action-plans',
      title: 'Consolidate training and certification plans',
      description: 'Collect current capability learning plans and certification needs.',
      category: 'Governance',
      owner: 'Capability Development Lead',
      due: 'Oct 16',
      priority: 'Medium',
      status: 'Done',
    },
    {
      id: 'action-attendance',
      title: 'Review attendance exceptions',
      description: 'Confirm next steps for employees with repeated attendance exceptions.',
      category: 'Attendance',
      owner: 'Bench Management Team',
      due: 'Oct 17',
      priority: 'High',
      status: 'Open',
    },
  ],
  attendanceRecords: [
    {
      id: 'attendance-1',
      employeeId: 'employee-alex-santos',
      date: '2026-10-16',
      timeIn: '08:42 AM',
      workType: 'Onsite',
      location: 'Mandaluyong, CG2',
      status: 'Present',
    },
    {
      id: 'attendance-2',
      employeeId: 'employee-maria-cruz',
      date: '2026-10-16',
      timeIn: '08:55 AM',
      workType: 'Onsite',
      location: 'Cebu IT Park',
      status: 'Present',
    },
    {
      id: 'attendance-3',
      employeeId: 'employee-john-reyes',
      date: '2026-10-16',
      timeIn: '—',
      workType: '—',
      location: '—',
      status: 'Unapproved Absence',
    },
    {
      id: 'attendance-4',
      employeeId: 'employee-sarah-garcia',
      date: '2026-10-16',
      timeIn: '—',
      workType: '—',
      location: '—',
      status: 'Unapproved Absence',
    },
    {
      id: 'attendance-5',
      employeeId: 'employee-michael-tan',
      date: '2026-10-16',
      timeIn: '09:12 AM',
      workType: 'Work from home',
      location: '—',
      status: 'Present',
    },
    {
      id: 'attendance-6',
      employeeId: 'employee-nicole-lim',
      date: '2026-10-16',
      timeIn: '—',
      workType: 'Leave',
      location: '—',
      status: 'Vacation Leave',
    },
  ],
  cohorts: [
    {
      id: 'cohort-cloud',
      name: 'Cloud Elite',
      focus: 'Cloud engineering and operations missions',
      duration: '6-week mission',
      joined: true,
    },
    {
      id: 'cohort-automation',
      name: 'Automation Mission',
      focus: 'Build reusable infrastructure automation',
      duration: '4-week mission',
      joined: false,
    },
    {
      id: 'cohort-deployment',
      name: 'Deployment Readiness Circle',
      focus: 'Practice technical interviews and profile reviews',
      duration: 'Weekly sessions',
      joined: false,
    },
  ],
  mandatoryTraining: [
    {
      id: 'training-security',
      title: 'Security Awareness',
      description: 'Annual security awareness and information security training.',
      due: 'Oct 16',
      status: 'Active',
    },
    {
      id: 'training-privacy',
      title: 'Data Privacy & Protection',
      description: 'Mandatory data privacy and protection training.',
      due: 'Oct 26',
      status: 'Active',
    },
  ],
  learningAssignments: [
    {
      id: 'learning-alex-security',
      employeeId: 'employee-alex-santos',
      trainingId: 'training-security',
      status: 'Completed',
      completionDate: today,
    },
    {
      id: 'learning-alex-privacy',
      employeeId: 'employee-alex-santos',
      trainingId: 'training-privacy',
      status: 'Completed',
      completionDate: today,
    },
    {
      id: 'learning-maria-security',
      employeeId: 'employee-maria-cruz',
      trainingId: 'training-security',
      status: 'Completed',
      completionDate: today,
    },
    {
      id: 'learning-maria-privacy',
      employeeId: 'employee-maria-cruz',
      trainingId: 'training-privacy',
      status: 'In Progress',
      completionDate: null,
    },
    {
      id: 'learning-michael-security',
      employeeId: 'employee-michael-tan',
      trainingId: 'training-security',
      status: 'Completed',
      completionDate: today,
    },
    {
      id: 'learning-michael-privacy',
      employeeId: 'employee-michael-tan',
      trainingId: 'training-privacy',
      status: 'In Progress',
      completionDate: null,
    },
    {
      id: 'learning-sarah-security',
      employeeId: 'employee-sarah-garcia',
      trainingId: 'training-security',
      status: 'In Progress',
      completionDate: null,
    },
    {
      id: 'learning-sarah-privacy',
      employeeId: 'employee-sarah-garcia',
      trainingId: 'training-privacy',
      status: 'Not Started',
      completionDate: null,
    },
  ],
  scheduleRequests: [],
  checkedIn: false,
};

const seedData = {
  ...initialData,
  employeeSchedules: Object.fromEntries(
    initialData.employees.map((employee) => [employee.id, { ...DEFAULT_SCHEDULE }]),
  ),
};

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function createId(prefix) {
  const id =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

export function loadBenchData() {
  const storedData = window.localStorage.getItem(STORAGE_KEY);
  if (storedData === null) {
    const seededData = cloneData(seedData);
    saveBenchData(seededData);
    return seededData;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(storedData);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error(
      'Saved BenchFlow data is invalid. Clear the bench-flow browser storage and reload.',
      { cause: error },
    );
  }
  const requiredArrays = [
    'employees',
    'tasks',
    'actionItems',
    'attendanceRecords',
    'cohorts',
    'scheduleRequests',
  ];
  if (
    parsedData &&
    Array.isArray(parsedData.employees) &&
    !Array.isArray(parsedData.mandatoryTraining)
  ) {
    parsedData.mandatoryTraining = cloneData(initialData.mandatoryTraining);
  }
  if (
    parsedData &&
    Array.isArray(parsedData.employees) &&
    !Array.isArray(parsedData.learningAssignments)
  ) {
    parsedData.learningAssignments = cloneData(initialData.learningAssignments).filter(
      (assignment) =>
        parsedData.employees.some((employee) => employee.id === assignment.employeeId),
    );
  }
  requiredArrays.push('mandatoryTraining', 'learningAssignments');
  if (
    !parsedData ||
    requiredArrays.some((key) => !Array.isArray(parsedData[key])) ||
    !parsedData.employeeSchedules ||
    typeof parsedData.employeeSchedules !== 'object' ||
    typeof parsedData.checkedIn !== 'boolean'
  ) {
    throw new Error(
      'Saved BenchFlow data has an unsupported format. Clear the bench-flow browser storage and reload.',
    );
  }
  return parsedData;
}

export function saveBenchData(data) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addEmployee(data, employee) {
  const createdEmployee = { ...employee, id: createId('employee') };
  return {
    ...data,
    employees: [...data.employees, createdEmployee],
    learningAssignments: [
      ...(data.learningAssignments ?? []),
      ...(data.mandatoryTraining ?? [])
        .filter((training) => training.status === 'Active')
        .map((training) => ({
          id: createId('learning'),
          employeeId: createdEmployee.id,
          trainingId: training.id,
          status: 'Not Started',
          completionDate: null,
        })),
    ],
  };
}

export function updateEmployee(data, employeeId, changes) {
  return {
    ...data,
    employees: data.employees.map((employee) =>
      employee.id === employeeId ? { ...employee, ...changes } : employee,
    ),
  };
}

export function deleteEmployee(data, employeeId) {
  const employeeSchedules = { ...data.employeeSchedules };
  delete employeeSchedules[employeeId];
  return {
    ...data,
    employees: data.employees.filter((employee) => employee.id !== employeeId),
    attendanceRecords: data.attendanceRecords.filter((record) => record.employeeId !== employeeId),
    learningAssignments: (data.learningAssignments ?? []).filter(
      (assignment) => assignment.employeeId !== employeeId,
    ),
    employeeSchedules,
    scheduleRequests: data.scheduleRequests.filter((request) => request.employeeId !== employeeId),
  };
}

export function updateTaskStatus(data, taskId, status) {
  return {
    ...data,
    tasks: data.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
  };
}

export function updateLearningAssignment(data, assignmentId, status) {
  if (!['Not Started', 'In Progress', 'Completed'].includes(status)) {
    throw new Error('Learning assignment status is invalid.');
  }
  const assignment = data.learningAssignments.find((item) => item.id === assignmentId);
  if (!assignment) throw new Error('Learning assignment was not found.');
  return {
    ...data,
    learningAssignments: data.learningAssignments.map((item) =>
      item.id === assignmentId
        ? { ...item, status, completionDate: status === 'Completed' ? todayDate() : null }
        : item,
    ),
  };
}

export function addMandatoryTraining(data, training) {
  const id = createId('training');
  return {
    ...data,
    mandatoryTraining: [...data.mandatoryTraining, { ...training, id }],
    learningAssignments: [
      ...data.learningAssignments,
      ...data.employees.map((employee) => ({
        id: createId('learning'),
        employeeId: employee.id,
        trainingId: id,
        status: 'Not Started',
        completionDate: null,
      })),
    ],
  };
}

export function updateMandatoryTraining(data, trainingId, changes) {
  if (!data.mandatoryTraining.some((training) => training.id === trainingId)) {
    throw new Error('Mandatory training was not found.');
  }
  return {
    ...data,
    mandatoryTraining: data.mandatoryTraining.map((training) =>
      training.id === trainingId ? { ...training, ...changes } : training,
    ),
  };
}

export function updateActionItemStatus(data, actionId, status) {
  return {
    ...data,
    actionItems: data.actionItems.map((item) =>
      item.id === actionId ? { ...item, status } : item,
    ),
  };
}

export function toggleCohortMembership(data, cohortId) {
  return {
    ...data,
    cohorts: data.cohorts.map((cohort) =>
      cohort.id === cohortId ? { ...cohort, joined: !cohort.joined } : cohort,
    ),
  };
}

export function submitAttendanceRecord(data, record) {
  return {
    ...data,
    checkedIn: record.workType !== 'Leave',
    employees: data.employees.map((employee) =>
      employee.id === record.employeeId
        ? { ...employee, attendanceStatus: record.status }
        : employee,
    ),
    attendanceRecords: [
      { ...record, id: createId('attendance') },
      ...data.attendanceRecords.filter(
        (entry) => !(entry.employeeId === record.employeeId && entry.date === record.date),
      ),
    ],
  };
}

export function updateCheckInStatus(data, checkedIn) {
  return { ...data, checkedIn };
}

export function submitEmployeeScheduleRequest(data, request) {
  const kind = request.schedule ? 'schedule' : 'calendar';
  const pendingRequest =
    kind === 'schedule' &&
    data.scheduleRequests.some(
      (item) =>
        item.employeeId === request.employeeId && item.kind === kind && item.status === 'Pending',
    );
  if (pendingRequest) {
    throw new Error(`An employee can only have one pending ${kind} request.`);
  }

  return {
    ...data,
    scheduleRequests: [
      {
        ...request,
        id: createId('schedule'),
        kind,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
      },
      ...data.scheduleRequests,
    ],
  };
}

export function reviewEmployeeScheduleRequest(data, requestId, status) {
  const request = data.scheduleRequests.find((item) => item.id === requestId);
  if (!request || request.status !== 'Pending') {
    throw new Error('Only pending schedule requests can be reviewed.');
  }
  if (status !== 'Approved' && status !== 'Rejected') {
    throw new Error('A schedule request must be approved or rejected.');
  }

  return {
    ...data,
    employeeSchedules:
      status === 'Approved' && request.kind === 'schedule'
        ? { ...data.employeeSchedules, [request.employeeId]: { ...request.schedule } }
        : data.employeeSchedules,
    scheduleRequests: data.scheduleRequests.map((item) =>
      item.id === requestId ? { ...item, status } : item,
    ),
  };
}

export function updateEmployeeSchedule(data, employeeId, schedule) {
  return {
    ...data,
    employeeSchedules: { ...data.employeeSchedules, [employeeId]: { ...schedule } },
  };
}
