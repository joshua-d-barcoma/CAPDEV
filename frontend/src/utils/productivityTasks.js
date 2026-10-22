export function getTaskStatus(task, currentDate = new Date()) {
  if (task.status === 'Completed') return 'Completed';

  const due = typeof task.due === 'string' ? task.due.trim() : '';
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  let dueDate;

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due);
  if (isoDate) {
    dueDate = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  } else {
    const monthDate = /^([A-Za-z]{3,})\s+(\d{1,2})(?:,\s*(\d{4}))?$/.exec(due);
    if (monthDate) {
      const month = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ].indexOf(monthDate[1].slice(0, 3).toLowerCase());
      if (month !== -1) {
        let year = Number(monthDate[3] ?? today.getFullYear());
        if (!monthDate[3]) {
          const monthDifference = month - today.getMonth();
          if (monthDifference > 6) year -= 1;
          if (monthDifference < -6) year += 1;
        }
        dueDate = new Date(year, month, Number(monthDate[2]));
      }
    }
  }

  if (dueDate && dueDate < today) return 'Overdue';
  return task.status;
}

export function getTasksForDistribution(tasks, currentDate = new Date()) {
  return tasks.filter(
    (task) =>
      !task.assigneeId &&
      (task.status === 'Not Started' || getTaskStatus(task, currentDate) === 'Overdue'),
  );
}
