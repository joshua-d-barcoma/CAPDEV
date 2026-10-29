import { useState } from 'react';

export function getRoleFromSession(user) {
  return user?.accountType === 'admin' ? 'admin' : 'user';
}

function getInitialRole() {
  const serializedUser = sessionStorage.getItem('benchflow_user');
  if (!serializedUser) return 'user';

  return getRoleFromSession(JSON.parse(serializedUser));
}

export function useRole() {
  const [role] = useState(getInitialRole);

  return { role };
}
