import { z } from 'zod';
import { LEDGER_ENTRY_TYPE } from '../../config/constants';

export const createFeeStructureSchema = z.object({
  body: z.object({
    programId: z.string().min(1, 'Valid program ID is required'),
    academicYearId: z.string().min(1, 'Valid academic year ID is required'),
    year: z.number().int().min(1).max(5),
    category: z.string().min(1).default('OPEN'),
    totalAmountPaise: z.number().int().positive('Amount in paise must be positive'),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Valid student ID is required'),
    financialYear: z.string().regex(/^\d{4}-\d{4}$/, 'Financial year format must be YYYY-YYYY (e.g. 2026-2027)'),
    amountPaise: z.number().int().positive('Payment amount must be positive'),
    paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'DEMAND_DRAFT']),
    notes: z.string().max(255).optional(),
  }),
});

export const feeAdjustmentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Valid student ID is required'),
    financialYear: z.string().regex(/^\d{4}-\d{4}$/, 'Financial year format must be YYYY-YYYY'),
    entryType: z.enum([
      LEDGER_ENTRY_TYPE.CHARGE,
      LEDGER_ENTRY_TYPE.WAIVER,
      LEDGER_ENTRY_TYPE.REFUND,
      LEDGER_ENTRY_TYPE.REVERSAL,
    ]),
    amountPaise: z.number().int().positive('Adjustment amount must be positive'),
    notes: z.string().min(3, 'Detailed justification note is required'),
    reversedEntryId: z.string().min(1).optional(),
  }),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>['body'];
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>['body'];
export type FeeAdjustmentInput = z.infer<typeof feeAdjustmentSchema>['body'];
