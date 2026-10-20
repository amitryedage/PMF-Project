export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'ACCOUNTS' | 'SUPER_ADMIN';

export interface User {
  id: string;
  student_id?: string;
  email: string;
  rollNumber?: string;
  role: UserRole;
  mustChangePassword?: boolean;
  first_name?: string;
  last_name?: string;
  current_year?: number;
  current_division?: string;
  program_name?: string;
  program_code?: string;
}

export interface Student {
  id: string;
  user_id: string;
  roll_number: string;
  enrollment_number: string;
  first_name: string;
  last_name: string;
  full_name_marathi?: string;
  dob: string;
  gender: string;
  blood_group?: string;
  personal_email?: string;
  phone?: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relation: string;
  guardian_consent_recorded: boolean;
  program_id: string;
  program_name?: string;
  program_code?: string;
  current_year: number;
  current_division: string;
  status: 'ACTIVE' | 'DETAINED' | 'ON_LEAVE' | 'GRADUATED' | 'WITHDRAWN';
  created_at: string;
}

export interface AttendanceSummary {
  studentId: string;
  overallPercentage: number;
  isOverallBelowThreshold: boolean;
  subjectStats: {
    subject_id: string;
    subject_code: string;
    subject_name: string;
    total_sessions: number;
    attended_sessions: number;
    percentage: number;
    isBelowThreshold: boolean;
  }[];
}

export interface StudentResultSummary {
  studentId: string;
  sgpa: number;
  totalCredits: number;
  results: {
    mark_id: string;
    score: number | null;
    is_absent: boolean;
    exam_id: string;
    exam_name: string;
    exam_type: string;
    maxMarks: number;
    percentage: number;
    grade: string;
    gradePoint: number;
    subject_code: string;
    subject_name: string;
    credits: number;
  }[];
}

export interface FeeDuesSummary {
  studentId: string;
  summary: {
    chargesPaise: number;
    chargesRupees: string;
    paidPaise: number;
    paidRupees: string;
    waiverPaise: number;
    waiverRupees: string;
    refundPaise: number;
    refundRupees: string;
    outstandingBalancePaise: number;
    outstandingBalanceRupees: string;
    isDefaulter: boolean;
  };
}
