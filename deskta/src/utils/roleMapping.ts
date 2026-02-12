export const ROLE_MAPPING: Record<string, string> = {
  'Peserta Didik': 'Siswa',
  'Guru': 'Guru',
  'Wali Kelas': 'wakel',
  'Admin': 'Admin',
  'Waka': 'WakaStaff',
  'Staff': 'WakaStaff', // In case backend sends 'Staff'
  'Kepala Sekolah': 'KepalaSekolah'
};

export const normalizeRole = (backendRole: string): string => {
  if (!backendRole) return '';
  return ROLE_MAPPING[backendRole] || backendRole;
};
