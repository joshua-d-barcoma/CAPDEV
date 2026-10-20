import { useState } from 'react';
import { validateEmployee } from '../utils/employeeValidation.js';
import { Dialog } from './Dialog.jsx';

const blankEmployee = {
  name: '',
  careerLevel: '',
  workLocation: '',
  capability: '',
  skills: [],
  attendanceStatus: 'Present',
  absenceDays: 0,
  joiningDate: '',
  rollInDate: '',
};

export function EmployeeForm({ employee, onSubmit, onClose }) {
  const [values, setValues] = useState(() =>
    employee ? { ...employee, skills: [...employee.skills] } : blankEmployee,
  );
  const [errors, setErrors] = useState({});
  const editing = Boolean(employee);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]:
        name === 'skills'
          ? value
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean)
          : value,
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = validateEmployee(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      ...values,
      skills: Array.isArray(values.skills) ? values.skills : [],
      absenceDays: Number(values.absenceDays) || 0,
    });
  }

  return (
    <Dialog
      title={editing ? 'Edit employee' : 'Add employee'}
      description="Enter the employee's profile details."
      onClose={onClose}
      className="employee-dialog"
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <label className="field">
          <span>
            Full name <b aria-hidden="true">*</b>
          </span>
          <input
            name="name"
            value={values.name}
            onChange={updateField}
            autoFocus
            required
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </label>
        <label className="field">
          <span>
            Capability <b aria-hidden="true">*</b>
          </span>
          <input
            name="capability"
            value={values.capability}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.capability)}
          />
          {errors.capability && <small className="field-error">{errors.capability}</small>}
        </label>
        <label className="field">
          <span>
            Career level <b aria-hidden="true">*</b>
          </span>
          <select
            name="careerLevel"
            value={values.careerLevel}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.careerLevel)}
          >
            <option value="">Select level</option>
            {['CL5', 'CL6', 'CL7', 'CL8', 'CL9', 'CL10'].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
          {errors.careerLevel && <small className="field-error">{errors.careerLevel}</small>}
        </label>
        <label className="field">
          <span>
            Work location <b aria-hidden="true">*</b>
          </span>
          <select
            name="workLocation"
            value={values.workLocation}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.workLocation)}
          >
            <option value="">Select location</option>
            <option>Manila</option>
            <option>Cebu</option>
          </select>
          {errors.workLocation && <small className="field-error">{errors.workLocation}</small>}
        </label>
        <label className="field">
          <span>
            Roll-in date <b aria-hidden="true">*</b>
          </span>
          <input
            name="rollInDate"
            type="date"
            value={values.rollInDate}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.rollInDate)}
          />
          {errors.rollInDate && <small className="field-error">{errors.rollInDate}</small>}
        </label>
        <label className="field">
          <span>Joining date</span>
          <input name="joiningDate" type="date" value={values.joiningDate} onChange={updateField} />
        </label>
        <label className="field field-wide">
          <span>
            Skills <small>Separate skills with commas</small>
          </span>
          <input
            name="skills"
            value={values.skills.join(', ')}
            onChange={updateField}
            placeholder="AWS, Kubernetes, Python"
          />
        </label>
        <div className="form-actions field-wide">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button-primary">
            {editing ? 'Save changes' : 'Add employee'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
