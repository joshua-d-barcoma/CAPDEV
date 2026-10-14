import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AttendanceStatus,
  Employee,
  EmployeeDirectory,
  WorkLocation
} from '../../../services/employee-directory';
import {
  DateRangeFilterChange,
  SearchFilters,
  SelectFilterChange,
  SelectFilterConfig,
  DateRangeFilterConfig
} from '../../../components/search-filters/search-filters';

interface SkillDistribution {
  name: string;
  count: number;
}

interface BenchAgingMetric {
  range: string;
  count: number;
}

interface CareerLevel {
  level: string;
  count: number;
}

interface CapabilityDistribution {
  name: string;
  count: number;
}

interface ScorecardEntry {
  capability: string;
  headcount: number;
  attendance: number;
  training: number;
  proficiency: number;
  deliverables: number;
}

interface PipelineStage {
  stage: string;
  count: number;
}

interface BenchCohort {
  name: string;
  focus: string;
  members: number;
  progress: number;
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [SearchFilters, RouterLink],
  templateUrl: './resources.html',
  styleUrl: './resources.scss'
})
export class Resources {
  readonly employeeDirectory = inject(EmployeeDirectory);
  readonly resources = this.employeeDirectory.employees;
  totalEmployees = 86;
  presentToday = 79;
  activeNonCompliance = 1;
  searchTerm = '';
  capabilityFilter = '';
  careerLevelFilter = '';
  skillFilter = '';
  attendanceFilter = '';
  workLocationFilter = '';
  joiningDateFrom = '';
  joiningDateTo = '';
  rollInDateFrom = '';
  rollInDateTo = '';

  skillDistribution: SkillDistribution[] = [
    {
      name: 'Azure',
      count: 68
    },
    {
      name: 'Java',
      count: 54
    },
    {
      name: 'SAP',
      count: 46
    },
    {
      name: 'Data',
      count: 58
    },
    {
      name: 'SRE',
      count: 42
    },
    {
      name: 'UiPath',
      count: 36
    },
    {
      name: 'AWS',
      count: 63
    },
    {
      name: 'Python',
      count: 51
    },
    {
      name: 'Kubernetes',
      count: 48
    },
    {
      name: 'SQL',
      count: 44
    },
    {
      name: 'Terraform',
      count: 39
    },
    {
      name: 'Linux',
      count: 31
    }
  ];

  benchAgingMetrics: BenchAgingMetric[] = [
    {
      range: '0-30 days',
      count: 28
    },
    {
      range: '31-60 days',
      count: 24
    },
    {
      range: '61-90 days',
      count: 17
    },
    {
      range: '91-120+ days',
      count: 17
    }
  ];

  careerLevels: CareerLevel[] = [
    {
      level: 'CL9',
      count: 8
    },
    {
      level: 'CL10',
      count: 16
    },
    {
      level: 'CL11',
      count: 28
    },
    {
      level: 'CL12',
      count: 34
    }
  ];

  capabilityDistribution: CapabilityDistribution[] = [
    {
      name: 'Cloud First',
      count: 29
    },
    {
      name: 'Security',
      count: 18
    },
    {
      name: 'Enterprise Platforms',
      count: 16
    },
    {
      name: 'Data & AI',
      count: 14
    },
    {
      name: 'Software Engineering',
      count: 9
    }
  ];

  readonly benchStatusDistribution: CapabilityDistribution[] = [
    { name: 'Ready for Deployment', count: 24 },
    { name: 'Capability Building', count: 38 },
    { name: 'Unavailable in Bench', count: 18 },
    { name: 'Apprentice', count: 4 },
    { name: 'Lateral Cross Training', count: 2 }
  ];

  readonly locationDistribution: CapabilityDistribution[] = [
    { name: 'Manila', count: 68 },
    { name: 'Cebu', count: 18 }
  ];

  readonly deploymentReady = 24;
  readonly capabilityBuilding = 38;
  readonly rtoCompliance = 82;

  readonly rosterStatuses = [
    'Capability Building',
    'Ready for Deployment',
    'Unavailable in Bench',
    'Ready for Deployment',
    'Lateral Cross Training',
    'Apprentice'
  ];

  readonly daysOnBench = [92, 70, 34, 116, 19, 13];
  readonly trainingCompletion = [84, 100, 58, 92, 67, 45];
  readonly snapshotStatus = ['Retained', 'New', 'Retained', 'Retained', 'New', 'Retained'];

  readonly scorecardByCapability: ScorecardEntry[] = [
    { capability: 'Hybrid Cloud', headcount: 29, attendance: 94, training: 82, proficiency: 76, deliverables: 88 },
    { capability: 'Network', headcount: 18, attendance: 91, training: 78, proficiency: 73, deliverables: 81 },
    { capability: 'Security', headcount: 18, attendance: 96, training: 89, proficiency: 84, deliverables: 90 },
    { capability: 'Data & AI', headcount: 14, attendance: 93, training: 86, proficiency: 79, deliverables: 85 }
  ];

  readonly deploymentPipeline: PipelineStage[] = [
    { stage: 'Ready for screening', count: 24 },
    { stage: 'Profile shared with TFS', count: 16 },
    { stage: 'Interview in progress', count: 9 },
    { stage: 'Client selection', count: 5 },
    { stage: 'Deployment confirmed', count: 3 }
  ];

  readonly benchCohorts: BenchCohort[] = [
    { name: 'Cloud Elite', focus: 'Cloud engineering and operations', members: 18, progress: 72 },
    { name: 'Automation Mission', focus: 'Infrastructure automation', members: 14, progress: 58 },
    { name: 'Digital Workplace', focus: 'Microsoft 365 and endpoint services', members: 12, progress: 81 },
    { name: 'Network Readiness', focus: 'Enterprise network operations', members: 10, progress: 64 }
  ];

  get unapprovedAbsences(): Employee[] {
    return this.resources.filter(
      resource =>
        resource.attendanceStatus === 'Unapproved Absence'
    );
  }

  get criticalAbsences(): Employee[] {
    return this.unapprovedAbsences.filter(
      resource => resource.absenceDays >= 3
    );
  }

  get attendancePercentage(): number {
    if (!this.totalEmployees) {
      return 0;
    }

    return Math.round(
      (this.presentToday / this.totalEmployees) * 100
    );
  }

  get activeNonCompliancePercentage(): number {
    if (!this.totalEmployees) {
      return 0;
    }

    return Math.round(
      (this.activeNonCompliance / this.totalEmployees) * 100
    );
  }

  get filteredResources(): Employee[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.resources.filter(resource =>
      (!query || [
          resource.name,
          resource.careerLevel,
          resource.workLocation,
          resource.capability,
          resource.attendanceStatus,
          resource.joiningDate,
          resource.rollInDate,
          ...resource.skills
        ].some(value => value.toLowerCase().includes(query))) &&
      (!this.capabilityFilter ||
        resource.capability === this.capabilityFilter) &&
      (!this.careerLevelFilter ||
        resource.careerLevel === this.careerLevelFilter) &&
      (!this.skillFilter || resource.skills.includes(this.skillFilter)) &&
      (!this.attendanceFilter ||
        resource.attendanceStatus === this.attendanceFilter) &&
      (!this.workLocationFilter ||
        resource.workLocation === this.workLocationFilter) &&
      this.isDateInRange(
        resource.joiningDate,
        this.joiningDateFrom,
        this.joiningDateTo
      ) &&
      this.isDateInRange(
        resource.rollInDate,
        this.rollInDateFrom,
        this.rollInDateTo
      )
    );
  }

  getRosterStatus(resource: Employee): string {
    const index = this.resources.indexOf(resource);
    return this.rosterStatuses[index] ?? 'Capability Building';
  }

  getRosterMetric(
    values: number[],
    resource: Employee
  ): number {
    const index = this.resources.indexOf(resource);
    return values[index] ?? 0;
  }

  get deploymentReadyPercentage(): number {
    return this.totalEmployees
      ? Math.round((this.deploymentReady / this.totalEmployees) * 100)
      : 0;
  }

  getRosterSnapshot(resource: Employee): string {
    const index = this.resources.indexOf(resource);
    return this.snapshotStatus[index] ?? 'Retained';
  }

  getScorecardAverage(entry: ScorecardEntry): number {
    return Math.round(
      (entry.attendance + entry.training + entry.proficiency + entry.deliverables) / 4
    );
  }

  getPipelineWidth(count: number): number {
    const max = Math.max(...this.deploymentPipeline.map(stage => stage.count));
    return max ? (count / max) * 100 : 0;
  }

  getDistributionWidth(
    count: number,
    distribution: CapabilityDistribution[]
  ): number {
    const max = Math.max(...distribution.map(item => item.count));
    return max ? (count / max) * 100 : 0;
  }

  get searchFilterOptions(): SelectFilterConfig[] {
    return [
      {
        key: 'capability',
        label: 'All Capabilities',
        options: this.capabilityOptions,
        value: this.capabilityFilter
      },
      {
        key: 'careerLevel',
        label: 'All Career Levels',
        options: this.careerLevelOptions,
        value: this.careerLevelFilter
      },
      {
        key: 'skill',
        label: 'All Skills',
        options: this.skillOptions,
        value: this.skillFilter
      },
      {
        key: 'attendance',
        label: 'All Attendance',
        options: this.attendanceOptions,
        value: this.attendanceFilter
      },
      {
        key: 'workLocation',
        label: 'All Locations',
        options: this.workLocationOptions,
        value: this.workLocationFilter
      }
    ];
  }

  get dateRangeFilterOptions(): DateRangeFilterConfig[] {
    return [
      {
        key: 'joining',
        label: 'Join date',
        startDate: this.joiningDateFrom,
        endDate: this.joiningDateTo
      },
      {
        key: 'rollIn',
        label: 'Roll-in date',
        startDate: this.rollInDateFrom,
        endDate: this.rollInDateTo
      }
    ];
  }

  get workLocationOptions(): WorkLocation[] {
    return [...new Set(this.resources.map(resource => resource.workLocation))]
      .sort((a, b) => a.localeCompare(b));
  }

  get capabilityOptions(): string[] {
    return [...new Set(this.resources.map(resource => resource.capability))]
      .sort((a, b) => a.localeCompare(b));
  }

  get careerLevelOptions(): string[] {
    return [...new Set(this.resources.map(resource => resource.careerLevel))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  get skillOptions(): string[] {
    return [...new Set(this.resources.flatMap(resource => resource.skills))]
      .sort((a, b) => a.localeCompare(b));
  }

  get attendanceOptions(): AttendanceStatus[] {
    return [...new Set(this.resources.map(resource => resource.attendanceStatus))]
      .sort((a, b) => a.localeCompare(b));
  }

  updateSearchTerm(searchTerm: string): void {
    this.searchTerm = searchTerm;
  }

  updateSearchFilter(change: SelectFilterChange): void {
    switch (change.key) {
      case 'capability':
        this.capabilityFilter = change.value;
        break;
      case 'careerLevel':
        this.careerLevelFilter = change.value;
        break;
      case 'skill':
        this.skillFilter = change.value;
        break;
      case 'attendance':
        this.attendanceFilter = change.value;
        break;
      case 'workLocation':
        this.workLocationFilter = change.value;
        break;
    }
  }

  updateDateRangeFilter(change: DateRangeFilterChange): void {
    if (change.key === 'joining') {
      this.joiningDateFrom = change.range.start;
      this.joiningDateTo = change.range.end;
    } else if (change.key === 'rollIn') {
      this.rollInDateFrom = change.range.start;
      this.rollInDateTo = change.range.end;
    }
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.capabilityFilter = '';
    this.careerLevelFilter = '';
    this.skillFilter = '';
    this.attendanceFilter = '';
    this.workLocationFilter = '';
    this.joiningDateFrom = '';
    this.joiningDateTo = '';
    this.rollInDateFrom = '';
    this.rollInDateTo = '';
  }

  getSkillHeight(count: number): number {
    const max = Math.max(
      ...this.skillDistribution.map(skill => skill.count)
    );

    return max > 0 ? (count / max) * 100 : 0;
  }

  getCapabilityWidth(count: number): number {
    const max = 30;

    return (count / max) * 100;
  }

  getCareerDashOffset(index: number): number {
    const circumference = 251.2;
    const values = this.careerLevels;

    let previous = 0;

    for (let i = 0; i < index; i++) {
      previous += values[i].count;
    }

    return circumference - (
      (previous / this.totalEmployees) * circumference
    );
  }

  getCareerDashLength(count: number): number {
    const circumference = 251.2;

    return (
      (count / this.totalEmployees) * circumference
    );
  }

  private isDateInRange(date: string, from: string, to: string): boolean {
    return (!from || date >= from) && (!to || date <= to);
  }

}