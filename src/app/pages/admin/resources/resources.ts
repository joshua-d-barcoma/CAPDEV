import { Component } from '@angular/core';

type AttendanceStatus =
  | 'Present'
  | 'Sick Leave'
  | 'Vacation Leave'
  | 'Unapproved Absence';

interface Resource {
  name: string;
  careerLevel: string;
  capability: string;
  skills: string[];
  attendanceStatus: AttendanceStatus;
  absenceDays: number;
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
      capability: 'SRE / Hybrid Cloud',
      skills: [
        'AWS',
        'Azure',
        'Kubernetes',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0
    },
    {
      name: 'Maria Cruz',
      careerLevel: 'CL7',
      capability: 'Cloud Customer Edge',
      skills: [
        'Azure',
        'Networking',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0
    },
    {
      name: 'John Reyes',
      careerLevel: 'CL6',
      capability: 'Network',
      skills: [
        'Routing',
        'Switching',
        'Cisco'
      ],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 1
    },
    {
      name: 'Sarah Garcia',
      careerLevel: 'CL9',
      capability: 'Hybrid Cloud - Operations',
      skills: [
        'AWS',
        'Linux',
        'Kubernetes',
        'Docker'
      ],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 3
    },
    {
      name: 'Michael Tan',
      careerLevel: 'CL8',
      capability: 'Hybrid Cloud - Migration',
      skills: [
        'Azure',
        'Migration',
        'Terraform'
      ],
      attendanceStatus: 'Present',
      absenceDays: 0
    },
    {
      name: 'Nicole Lim',
      careerLevel: 'CL5',
      capability: 'Service Management',
      skills: [
        'ITIL',
        'ServiceNow',
        'Incident Management'
      ],
      attendanceStatus: 'Vacation Leave',
      absenceDays: 0
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
          resource.capability,
          resource.attendanceStatus,
          ...resource.skills
        ].some(value => value.toLowerCase().includes(query))) &&
      (!this.capabilityFilter ||
        resource.capability === this.capabilityFilter) &&
      (!this.careerLevelFilter ||
        resource.careerLevel === this.careerLevelFilter) &&
      (!this.skillFilter || resource.skills.includes(this.skillFilter)) &&
      (!this.attendanceFilter ||
        resource.attendanceStatus === this.attendanceFilter)
    );
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

  updateSearch(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchTerm = target.value;
    }
  }

  updateCapabilityFilter(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.capabilityFilter = target.value;
    }
  }

  updateCareerLevelFilter(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.careerLevelFilter = target.value;
    }
  }

  updateSkillFilter(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.skillFilter = target.value;
    }
  }

  updateAttendanceFilter(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.attendanceFilter = target.value;
    }
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

}