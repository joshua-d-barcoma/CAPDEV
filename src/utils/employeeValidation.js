export function validateEmployee(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter an employee name.';
  if (!values.capability.trim()) errors.capability = 'Enter a capability.';
  if (!values.careerLevel) errors.careerLevel = 'Select a career level.';
  if (!values.workLocation) errors.workLocation = 'Select a work location.';
  if (!values.rollInDate) errors.rollInDate = 'Select a roll-in date.';
  return errors;
}
