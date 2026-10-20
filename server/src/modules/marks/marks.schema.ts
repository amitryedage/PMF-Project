import { z } from 'zod';

const examTypeEnum = z.enum(['INTERNAL_1', 'INTERNAL_2', 'MID_TERM', 'END_TERM', 'PRACTICAL']);

export const createExamSchema = z.object({
  body: z.object({
    classId: z.string().min(1, 'Valid class ID is required'),
    subjectId: z.string().min(1, 'Valid subject ID is required'),
    name: z.string().min(1, 'Exam name is required'),
    examType: examTypeEnum,
    maxMarks: z.number().positive('Max marks must be greater than 0'),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  }),
});

export const markEntryItemSchema = z.object({
  studentId: z.string().min(1, 'Valid student ID is required'),
  score: z.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().max(255).optional(),
});

export const submitMarksSchema = z.object({
  body: z.object({
    examId: z.string().min(1, 'Valid exam ID is required'),
    records: z.array(markEntryItemSchema).min(1, 'At least one student mark entry is required'),
  }),
});

export const reviseMarkSchema = z.object({
  body: z.object({
    markId: z.string().min(1, 'Valid mark ID is required'),
    newScore: z.number().min(0).optional(),
    newAbsent: z.boolean().default(false),
    reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  }),
});

export type CreateExamInput = z.infer<typeof createExamSchema>['body'];
export type SubmitMarksInput = z.infer<typeof submitMarksSchema>['body'];
export type ReviseMarkInput = z.infer<typeof reviseMarkSchema>['body'];
