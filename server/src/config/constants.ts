export const USER_ROLES = {
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  ADMIN: 'ADMIN',
  ACCOUNTS: 'ACCOUNTS',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const STUDENT_STATUS = {
  ACTIVE: 'ACTIVE',
  DETAINED: 'DETAINED',
  ON_LEAVE: 'ON_LEAVE',
  GRADUATED: 'GRADUATED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS];

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const LEDGER_ENTRY_TYPE = {
  CHARGE: 'CHARGE',
  PAYMENT: 'PAYMENT',
  WAIVER: 'WAIVER',
  REFUND: 'REFUND',
  REVERSAL: 'REVERSAL',
} as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPE)[keyof typeof LEDGER_ENTRY_TYPE];
