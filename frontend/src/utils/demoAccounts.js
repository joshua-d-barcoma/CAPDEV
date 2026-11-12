const PROFILE_STORAGE_PREFIX = 'benchflow_demo_profile:';

export const DEMO_ACCOUNTS = Object.freeze([
  {
    initials: 'JM',
    name: 'Juan Marcos Garcia',
    role: 'Individual · L6 · Azure PaaS',
    color: '#9300ff',
    email: 'juan.marcos@accenture.com',
    accountType: 'individual',
    redirectTo: '/user/dashboard',
    profile: {
      attendanceEmployeeId: 'demo-juan-marcos-garcia',
      employeeId: 'DEMO-JM-001',
      role: 'Individual',
      level: 'L6',
      capability: 'Azure PaaS',
      location: 'Cebu City',
      team: 'Cloud Operations',
      skills: 'Azure PaaS, Cloud Support, SRE',
      bio: 'Cloud support professional working across application support, automation, and reliability engineering.',
    },
  },
  {
    initials: 'KC',
    name: 'Karoline S. Cayetano',
    role: 'People Lead · L8 · Cloud Ops',
    color: '#149b78',
    email: 'karoline.cayetano@accenture.com',
    accountType: 'people-lead',
    redirectTo: '/user/dashboard',
    profile: {
      attendanceEmployeeId: 'demo-karoline-cayetano',
      employeeId: 'DEMO-KC-002',
      role: 'People Lead',
      level: 'L8',
      capability: 'Cloud Ops',
      location: '',
      team: 'Cloud Ops',
      skills: '',
      bio: '',
    },
  },
  {
    initials: 'OP',
    name: 'Oscar R. Punsalan',
    role: 'Managing Director · L10 · IIS Philippines',
    color: '#6c6bd9',
    email: 'oscar.punsalan@accenture.com',
    accountType: 'managing-director',
    redirectTo: '/user/dashboard',
    profile: {
      attendanceEmployeeId: 'demo-oscar-punsalan',
      employeeId: 'DEMO-OP-003',
      role: 'Managing Director',
      level: 'L10',
      capability: 'IIS Philippines',
      location: '',
      team: 'IIS Philippines',
      skills: '',
      bio: '',
    },
  },
  {
    initials: 'AD',
    name: 'Admin User',
    role: 'Administrator · Demo Admin',
    color: '#62738c',
    email: 'admin@accenture.com',
    accountType: 'admin',
    redirectTo: '/admin/dashboard',
    profile: {
      role: 'Administrator',
      level: '',
      capability: '',
      location: '',
      team: 'BenchFlow Administration',
      employeeId: '',
      skills: '',
      bio: '',
    },
  },
]);

export function getDemoAccount(email) {
  const normalizedEmail = email?.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail) ?? null;
}

export function getDemoProfile(email) {
  const account = getDemoAccount(email);
  if (!account) return null;

  const profile = {
    name: account.name,
    email: account.email,
    ...account.profile,
  };

  try {
    const storedProfile = window.localStorage.getItem(
      `${PROFILE_STORAGE_PREFIX}${account.email}`,
    );
    if (!storedProfile) return profile;

    const parsedProfile = JSON.parse(storedProfile);
    if (!parsedProfile || typeof parsedProfile !== 'object' || Array.isArray(parsedProfile)) {
      throw new Error('Saved demo profile has an invalid format.');
    }

    return { ...profile, ...parsedProfile, email: account.email };
  } catch (error) {
    console.error('Unable to load the saved demo profile:', error);
    throw new Error('Unable to load your saved demo profile. Please check browser storage.');
  }
}

export function saveDemoProfile(email, profile) {
  const account = getDemoAccount(email);
  if (!account) {
    throw new Error('This profile is not one of the configured demo accounts.');
  }

  const savedProfile = { ...profile, email: account.email };
  window.localStorage.setItem(
    `${PROFILE_STORAGE_PREFIX}${account.email}`,
    JSON.stringify(savedProfile),
  );
  return savedProfile;
}
