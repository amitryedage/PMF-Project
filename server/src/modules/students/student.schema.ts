import { z } from 'zod';
import { STUDENT_STATUS } from '../../config/constants';

const studentStatusEnum = z.enum([
  STUDENT_STATUS.ACTIVE,
  STUDENT_STATUS.DETAINED,
  STUDENT_STATUS.ON_LEAVE,
  STUDENT_STATUS.GRADUATED,
  STUDENT_STATUS.WITHDRAWN,
]);

export const createStudentSchema = z.object({
  body: z.object({
    rollNumber: z.string().min(1, 'Roll number is required'),
    enrollmentNumber: z.string().min(1, 'Enrollment number is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    fullNameMarathi: z.string().optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: z.string().optional(),
    personalEmail: z.string().email('Invalid personal email').optional().or(z.literal('')),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
    guardianName: z.string().min(1, 'Guardian name is required'),
    guardianPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid guardian mobile number'),
    guardianRelation: z.string().min(1, 'Guardian relation is required'),
    guardianConsentRecorded: z.boolean().default(false),
    programId: z.string().min(1, 'Valid program ID is required'),
    currentYear: z.number().int().min(1).max(5),
    currentDivision: z.string().min(1).default('A'),
    status: studentStatusEnum.default(STUDENT_STATUS.ACTIVE),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    fullNameMarathi: z.string().optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: z.string().optional(),
    personalEmail: z.string().email().optional().or(z.literal('')),
    phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
    guardianName: z.string().optional(),
    guardianPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
    guardianRelation: z.string().optional(),
    guardianConsentRecorded: z.boolean().optional(),
    programId: z.string().min(1).optional(),
    currentYear: z.number().int().min(1).max(5).optional(),
    currentDivision: z.string().optional(),
    status: studentStatusEnum.optional(),
  }),
});

export const studentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 25)),
    search: z.string().optional(),
    programId: z.string().optional(),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    division: z.string().optional(),
    status: studentStatusEnum.optional(),
  }),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>['body'];
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>['body'];
export type StudentQueryParams = z.infer<typeof studentQuerySchema>['query'];
