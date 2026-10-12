import { Component } from '@angular/core';
import {
  DateRangeFilterChange,
  SearchFilters,
  SelectFilterChange,
  SelectFilterConfig,
  DateRangeFilterConfig
} from '../../../components/search-filters/search-filters';

type AttendanceStatus =
  | 'Present'
  | 'Sick Leave'
  | 'Vacation Leave'
  | 'Unapproved Absence';

type WorkLocation = 'Manila' | 'Cebu';

interface Resource {
  name: string;
  careerLevel: string;
  workLocation: WorkLocation;
  capability: string;
  skills: string[];
  attendanceStatus: AttendanceStatus;
  absenceDays: number;
  joiningDate: string;
  rollInDate: string;
}

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

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [SearchFilters],
  templateUrl: './resources.html',
  styleUrl: './resources.scss'
})
export class Resources {
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

  resources: Resource[] = [
    {
      name: 'Alex Santos',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'SRE / Hybrid Cloud',
      skills: [
        'AWS',
        'Azure',
        'Kubernetes',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2020-02-10',
      rollInDate: '2026-07-14'
    },
    {
      name: 'Maria Cruz',
      careerLevel: 'CL7',
      workLocation: 'Cebu',
      capability: 'Cloud Customer Edge',
      skills: [
        'Azure',
        'Networking',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05'
    },
    {
      name: 'John Reyes',
      careerLevel: 'CL6',
      workLocation: 'Manila',
      capability: 'Network',
      skills: [
        'Routing',
        'Switching',
        'Cisco'
      ],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 1,
      joiningDate: '2021-11-01',
      rollInDate: '2026-09-10'
    },
    {
      name: 'Sarah Garcia',
      careerLevel: 'CL9',
      workLocation: 'Cebu',
      capability: 'Hybrid Cloud - Operations',
      skills: [
        'AWS',
        'Linux',
        'Kubernetes',
        'Docker'
      ],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 3,
      joiningDate: '2019-04-15',
      rollInDate: '2026-06-20'
    },
    {
      name: 'Michael Tan',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'Hybrid Cloud - Migration',
      skills: [
        'Azure',
        'Migration',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2023-01-09',
      rollInDate: '2026-09-25'
    },
    {
      name: 'Nicole Lim',
      careerLevel: 'CL5',
      workLocation: 'Cebu',
      capability: 'Service Management',
      skills: [
        'ITIL',
        'ServiceNow',
        'Incident Management'
      ],
      attendanceStatus: 'Vacation Leave',
      absenceDays: 0,
      joiningDate: '2020-08-31',
      rollInDate: '2026-10-01'
    }
  ];

  get unapprovedAbsences(): Resource[] {
    return this.resources.filter(
      resource =>
        resource.attendanceStatus === 'Unapproved Absence'
    );
  }

  get criticalAbsences(): Resource[] {
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

  get filteredResources(): Resource[] {
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