import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../../config/constants';

const attendanceStatusEnum = z.enum([
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.ABSENT,
  ATTENDANCE_STATUS.LATE,
]);

export const createSessionSchema = z.object({
  body: z.object({
    facultyAssignmentId: z.string().uuid('Valid faculty assignment ID is required'),
    sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    sessionHour: z.number().int().min(1).max(10),
    topic: z.string().max(255).optional(),
  }),
});

export const recordAttendanceItemSchema = z.object({
  studentId: z.string().uuid('Valid student ID is required'),
  status: attendanceStatusEnum,
});

export const submitBulkAttendanceSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Valid session ID is required'),
    records: z.array(recordAttendanceItemSchema).min(1, 'At least one student record is required'),
  }),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type SubmitBulkAttendanceInput = z.infer<typeof submitBulkAttendanceSchema>['body'];
