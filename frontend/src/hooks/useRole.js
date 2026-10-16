import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';

export function useRole() {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');

  const switchRole = useCallback(() => {
    const nextRole = role === 'admin' ? 'user' : 'admin';
    setRole(nextRole);
    navigate(nextRole === 'admin' ? ROUTES.adminDashboard : ROUTES.userDashboard);
  }, [navigate, role]);

  return { role, switchRole };
}
