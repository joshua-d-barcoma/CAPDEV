import { useCallback, useMemo, useState } from 'react';
import { BenchDataContext } from './BenchDataContext.js';
import * as benchDataService from '../services/benchDataService.js';

export function BenchDataProvider({ children }) {
  const [data, setData] = useState(benchDataService.loadBenchData);
  const [storageError, setStorageError] = useState('');

  const updateData = useCallback(
    (updater) => {
      try {
        const nextData = updater(data);
        benchDataService.saveBenchData(nextData);
        setData(nextData);
        setStorageError('');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save demo data.';
        setStorageError(message);
        return false;
      }
    },
    [data],
  );

  const actions = useMemo(
    () => ({
      addEmployee(employee) {
        return updateData((current) => benchDataService.addEmployee(current, employee));
      },
      updateEmployee(employeeId, changes) {
        return updateData((current) =>
          benchDataService.updateEmployee(current, employeeId, changes),
        );
      },
      deleteEmployee(employeeId) {
        return updateData((current) => benchDataService.deleteEmployee(current, employeeId));
      },
      updateTask(taskId, status) {
        return updateData((current) => benchDataService.updateTaskStatus(current, taskId, status));
      },
      updateActionItem(actionId, status) {
        return updateData((current) =>
          benchDataService.updateActionItemStatus(current, actionId, status),
        );
      },
      toggleCohort(cohortId) {
        return updateData((current) => benchDataService.toggleCohortMembership(current, cohortId));
      },
      submitAttendance(record) {
        return updateData((current) => benchDataService.submitAttendanceRecord(current, record));
      },
      setCheckedIn(checkedIn) {
        return updateData((current) => benchDataService.updateCheckInStatus(current, checkedIn));
      },
      submitScheduleRequest(request) {
        return updateData((current) =>
          benchDataService.submitEmployeeScheduleRequest(current, request),
        );
      },
      reviewScheduleRequest(requestId, status) {
        return updateData((current) =>
          benchDataService.reviewEmployeeScheduleRequest(current, requestId, status),
        );
      },
      updateEmployeeSchedule(employeeId, schedule) {
        return updateData((current) =>
          benchDataService.updateEmployeeSchedule(current, employeeId, schedule),
        );
      },
    }),
    [updateData],
  );

  const value = useMemo(
    () => ({
      ...data,
      ...actions,
      storageError,
      clearStorageError: () => setStorageError(''),
    }),
    [actions, data, storageError],
  );

  return <BenchDataContext.Provider value={value}>{children}</BenchDataContext.Provider>;
}
