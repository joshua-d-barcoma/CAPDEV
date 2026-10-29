import { useMemo } from 'react';
import { getEmployeeFilterOptions } from '../utils/employeeInsights.js';

export function EmployeeScopeFilters({
  employees,
  location,
  capability,
  onChange,
  className = '',
}) {
  const options = useMemo(() => getEmployeeFilterOptions(employees), [employees]);

  return (
    <div className={`dashboard-filters employee-scope-header-filters ${className}`.trim()}>
      <label className="dashboard-filter">
        <span className="visually-hidden">Filter by location</span>
        <select
          aria-label="Filter by location"
          value={location}
          onChange={(event) => onChange('location', event.target.value)}
        >
          <option value="">All Locations</option>
          {options.locations.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="dashboard-filter">
        <span className="visually-hidden">Filter by capability</span>
        <select
          aria-label="Filter by capability"
          value={capability}
          onChange={(event) => onChange('capability', event.target.value)}
        >
          <option value="">All Capabilities</option>
          {options.capabilities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
