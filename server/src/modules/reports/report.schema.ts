import { z } from 'zod';

export const attendanceReportQuerySchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    programId: z.string().uuid().optional(),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    format: z.enum(['json', 'csv']).default('json'),
  }),
});

export const gradeReportQuerySchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    examId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    format: z.enum(['json', 'csv']).default('json'),
  }),
});

export const feeDefaultersQuerySchema = z.object({
  query: z.object({
    programId: z.string().uuid().optional(),
    year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    financialYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
    format: z.enum(['json', 'csv']).default('json'),
  }),
});

export const auditLogQuerySchema = z.object({
  query: z.object({
    actorUserId: z.string().uuid().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 25)),
  }),
});

export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>['query'];
export type GradeReportQuery = z.infer<typeof gradeReportQuerySchema>['query'];
export type FeeDefaultersQuery = z.infer<typeof feeDefaultersQuerySchema>['query'];
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>['query'];
