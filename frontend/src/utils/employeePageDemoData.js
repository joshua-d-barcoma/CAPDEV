export const DEMO_READINESS_METRICS = Object.freeze({
  'Hybrid Cloud': { mandatoryTraining: 82, proficiency: 76, deliverables: 88 },
  'Cloud Customer Edge': { mandatoryTraining: 82, proficiency: 76, deliverables: 88 },
  Network: { mandatoryTraining: 82, proficiency: 76, deliverables: 88 },
  'Service Management': { mandatoryTraining: 82, proficiency: 76, deliverables: 88 },
  Security: { mandatoryTraining: 91, proficiency: 84, deliverables: 79 },
  'Data & AI': { mandatoryTraining: 78, proficiency: 81, deliverables: 86 },
});

export const DEMO_DEPLOYMENT_STAGES = Object.freeze([
  { label: 'Ready for screening', count: 24 },
  { label: 'Profile shared with TFS', count: 16 },
  { label: 'Interview in progress', count: 9 },
  { label: 'Client selection', count: 5 },
  { label: 'Deployment confirmed', count: 3 },
]);

export const DEMO_COHORT_PROGRESS = Object.freeze([
  {
    name: 'Cloud Elite',
    focus: 'Cloud engineering and operations',
    members: 18,
    progress: 72,
  },
  {
    name: 'Automation Mission',
    focus: 'Infrastructure automation',
    members: 14,
    progress: 58,
  },
  {
    name: 'Digital Workplace',
    focus: 'Microsoft 365 and endpoint services',
    members: 12,
    progress: 81,
  },
  {
    name: 'Network Readiness',
    focus: 'Enterprise network operations',
    members: 10,
    progress: 64,
  },
]);
