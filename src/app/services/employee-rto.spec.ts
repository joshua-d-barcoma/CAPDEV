import { EmployeeDirectory } from './employee-directory';
import { EmployeeRto } from './employee-rto';

describe('EmployeeRto', () => {
  it('applies a requested schedule only after admin approval', () => {
    const service = new EmployeeRto(new EmployeeDirectory());
    const requested = service.getSchedule('Alex Santos')
      .map(day => ({ ...day, location: day.day === 'Mon' ? 'WFH' as const : day.location }));
    const original = service.getSchedule('Alex Santos').map(day => ({ ...day }));

    service.submitRequest('Alex Santos', requested);
    const request = service.getLatestRequest('Alex Santos');
    expect(request?.status).toBe('Pending');
    expect(service.getSchedule('Alex Santos')).toEqual(original);

    if (!request) {
      throw new Error('Expected a submitted schedule request.');
    }

    service.approveRequest(request);

    expect(request.status).toBe('Approved');
    expect(service.getSchedule('Alex Santos')).toEqual(requested);
  });

  it('rejects a request without changing the current schedule', () => {
    const service = new EmployeeRto(new EmployeeDirectory());
    const original = service.getSchedule('Alex Santos').map(day => ({ ...day }));
    const requestSchedule = original.map(day => ({
      ...day,
      location: day.day === 'Fri' ? 'Onsite' as const : day.location
    }));

    service.submitRequest('Alex Santos', requestSchedule);
    const request = service.getLatestRequest('Alex Santos');
    if (!request) {
      throw new Error('Expected a submitted schedule request.');
    }

    service.rejectRequest(request);

    expect(request.status).toBe('Rejected');
    expect(service.getSchedule('Alex Santos')).toEqual(original);
  });

  it('allows an admin to directly update an employee schedule', () => {
    const service = new EmployeeRto(new EmployeeDirectory());
    const edited = service.getSchedule('Maria Cruz')
      .map(day => ({ ...day, location: day.day === 'Tue' ? 'WFH' as const : day.location }));

    service.updateSchedule('Maria Cruz', edited);

    expect(service.getSchedule('Maria Cruz')).toEqual(edited);
  });
});
