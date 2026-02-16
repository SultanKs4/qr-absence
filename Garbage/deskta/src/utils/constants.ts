// API Base URL - can be overridden by environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const STORAGE_BASE_URL = API_BASE_URL + '/storage';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  ME: '/api/me',

  // Settings
  PUBLIC_SETTINGS: '/api/settings/public',
  SETTINGS: '/api/settings',
  SETTINGS_BULK: '/api/settings/bulk',

  // Admin
  ADMIN_SUMMARY: '/api/admin/summary',
  ATTENDANCE_SUMMARY: '/api/attendance/summary',

  // Students
  STUDENTS: '/api/students',
  STUDENTS_IMPORT: '/api/students/import',

  // Teachers
  TEACHERS: '/api/teachers',
  TEACHERS_IMPORT: '/api/teachers/import',
  TEACHER_SCHEDULE_IMAGE: (id: number) => `/api/teachers/${id}/schedule-image`,
  TEACHER_ATTENDANCE: (id: number) => `/api/teachers/${id}/attendance`,

  // Classes
  CLASSES: '/api/classes',
  CLASS_SCHEDULE_IMAGE: (id: number) => `/api/classes/${id}/schedule-image`,
  CLASS_SCHEDULES: (id: number) => `/api/classes/${id}/schedules`,
  CLASS_ATTENDANCE: (id: number) => `/api/classes/${id}/attendance`,
  CLASS_STUDENTS_SUMMARY: (id: number) => `/api/classes/${id}/students/attendance-summary`,

  // Majors
  MAJORS: '/api/majors',

  // Schedules
  SCHEDULES: '/api/schedules',
  ME_SCHEDULES: '/api/me/schedules',
  SCHEDULES_BY_TEACHER: (id: number) => `/api/teachers/${id}/schedules`,
  SCHEDULES_BY_CLASS: (id: number) => `/api/classes/${id}/schedules`,

  // Attendance
  ATTENDANCE_SCAN: '/api/attendance/scan',
  ATTENDANCE_BY_SCHEDULE: (id: number) => `/api/attendance/schedules/${id}`,
  ATTENDANCE_EXCUSE: (id: number) => `/api/attendance/${id}/excuse`,
  ATTENDANCE_DOCUMENT: (id: number) => `/api/attendance/${id}/document`,
  ME_ATTENDANCE: '/api/me/attendance',
  ME_ATTENDANCE_SUMMARY: '/api/me/attendance/summary',
  ATTENDANCE_MANUAL: '/api/attendance/manual',
  ATTENDANCE_SCAN_STUDENT: '/api/attendance/scan-student',

  // QR Codes
  QR_GENERATE: '/api/qrcodes/generate',
  QR_ACTIVE: '/api/qrcodes/active',
  QR_REVOKE: (token: string) => `/api/qrcodes/${token}/revoke`,

  // Homeroom (Wali Kelas)
  ME_HOMEROOM: '/api/me/homeroom',
  ME_HOMEROOM_SCHEDULES: '/api/me/homeroom/schedules',
  ME_HOMEROOM_ATTENDANCE: '/api/me/homeroom/attendance',
  ME_HOMEROOM_ATTENDANCE_SUMMARY: '/api/me/homeroom/attendance/summary',
  ME_HOMEROOM_STUDENTS: '/api/me/homeroom/students',

  // Class Officer (Pengurus Kelas)
  ME_CLASS: '/api/me/class',
  ME_CLASS_SCHEDULES: '/api/me/class/schedules',
  ME_CLASS_ATTENDANCE: '/api/me/class/attendance',
  ME_CLASS_QR_TOKEN: '/api/me/class/qr-token',

  // Waka (Wakil Kepala Sekolah)
  WAKA_ATTENDANCE_SUMMARY: '/api/waka/attendance/summary',
  WAKA_DASHBOARD_SUMMARY: '/api/waka/dashboard/summary',
  TEACHERS_DAILY_ATTENDANCE: '/api/attendance/teachers/daily',
  STUDENTS_ABSENCES: '/api/students/absences',
  ABSENCE_REQUESTS: '/api/absence-requests',

  // Mobile Dashboard
  DASHBOARD_STUDENT: '/api/me/dashboard/summary',
  DASHBOARD_TEACHER: '/api/me/dashboard/teacher-summary',
  DASHBOARD_HOMEROOM: '/api/me/homeroom/dashboard',

  // Subjects
  SUBJECTS: '/api/subjects',

  // Follow-up
  STUDENTS_FOLLOW_UP: '/api/me/students/follow-up',
} as const;

// Token storage key
export const TOKEN_KEY = 'auth_token';

// Role mappings
export const ROLES = {
  ADMIN: 'admin',
  GURU: 'guru',
  SISWA: 'siswa',
  PENGURUS_KELAS: 'pengurus_kelas',
  WAKA: 'waka',
  WAKEL: 'wakel',
} as const;
