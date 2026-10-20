import { pool, query } from '../../config/db';
import { USER_ROLES, LEDGER_ENTRY_TYPE } from '../../config/constants';
import { TokenPayload } from '../../utils/token';
import { CreateFeeStructureInput, RecordPaymentInput, FeeAdjustmentInput } from './fee.schema';

export class FeeService {
  async createFeeStructure(input: CreateFeeStructureInput) {
    const res = await query(
      `INSERT INTO fee_structures (program_id, academic_year_id, year, category, total_amount_paise)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (program_id, academic_year_id, year, category)
       DO UPDATE SET total_amount_paise = EXCLUDED.total_amount_paise
       RETURNING *`,
      [input.programId, input.academicYearId, input.year, input.category, input.totalAmountPaise]
    );
    return res.rows[0];
  }

  async recordPayment(input: RecordPaymentInput, user: TokenPayload) {
    const studentRes = await query(
      `SELECT id, roll_number, first_name, last_name FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [input.studentId]
    );

    if (studentRes.rowCount === 0) {
      throw new Error('Student not found');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const seqRes = await client.query(
        `SELECT get_next_receipt_number($1) as receipt_no`,
        [input.financialYear]
      );
      const receiptNumber = seqRes.rows[0].receipt_no;

      const ledgerRes = await client.query(
        `INSERT INTO fee_ledger_entries (
          student_id, financial_year, entry_type, amount_paise, receipt_number, 
          payment_mode, notes, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          input.studentId,
          input.financialYear,
          LEDGER_ENTRY_TYPE.PAYMENT,
          input.amountPaise,
          receiptNumber,
          input.paymentMode,
          input.notes || null,
          user.userId,
        ]
      );

      await client.query('COMMIT');

      const entry = ledgerRes.rows[0];
      return {
        ...entry,
        formattedAmountRupees: (parseInt(entry.amount_paise, 10) / 100).toFixed(2),
        receiptCode: `REC/${input.financialYear}/${String(receiptNumber).padStart(6, '0')}`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async recordAdjustment(input: FeeAdjustmentInput, user: TokenPayload) {
    const studentRes = await query(
      `SELECT id FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [input.studentId]
    );

    if (studentRes.rowCount === 0) {
      throw new Error('Student not found');
    }

    if (input.reversedEntryId) {
      const originalRes = await query(
        `SELECT id, reversed_entry_id FROM fee_ledger_entries WHERE id = $1`,
        [input.reversedEntryId]
      );
      if (originalRes.rowCount === 0) {
        throw new Error('Original ledger entry not found to reverse');
      }
    }

    const res = await query(
      `INSERT INTO fee_ledger_entries (
        student_id, financial_year, entry_type, amount_paise, notes, 
        created_by_user_id, reversed_entry_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.studentId,
        input.financialYear,
        input.entryType,
        input.amountPaise,
        input.notes,
        user.userId,
        input.reversedEntryId || null,
      ]
    );

    return res.rows[0];
  }

  async getStudentDues(studentId: string, user: TokenPayload) {
    if (user.role === USER_ROLES.STUDENT) {
      const studentRes = await query(
        `SELECT id FROM students WHERE id = $1 AND user_id = $2`,
        [studentId, user.userId]
      );
      if (studentRes.rowCount === 0) {
        throw new Error('Access denied to requested fee dues');
      }
    }

    const ledgerRes = await query(
      `SELECT entry_type, SUM(amount_paise)::bigint as total_paise
       FROM fee_ledger_entries
       WHERE student_id = $1
       GROUP BY entry_type`,
      [studentId]
    );

    const totals: Record<string, number> = {
      CHARGE: 0,
      PAYMENT: 0,
      WAIVER: 0,
      REFUND: 0,
      REVERSAL: 0,
    };

    for (const row of ledgerRes.rows) {
      totals[row.entry_type] = parseInt(row.total_paise, 10);
    }

    const totalCharges = totals.CHARGE;
    const totalPayments = totals.PAYMENT;
    const totalWaivers = totals.WAIVER;
    const totalRefunds = totals.REFUND;

    const outstandingBalancePaise = totalCharges - totalPayments - totalWaivers + totalRefunds;

    return {
      studentId,
      summary: {
        chargesPaise: totalCharges,
        chargesRupees: (totalCharges / 100).toFixed(2),
        paidPaise: totalPayments,
        paidRupees: (totalPayments / 100).toFixed(2),
        waiverPaise: totalWaivers,
        waiverRupees: (totalWaivers / 100).toFixed(2),
        refundPaise: totalRefunds,
        refundRupees: (totalRefunds / 100).toFixed(2),
        outstandingBalancePaise,
        outstandingBalanceRupees: (outstandingBalancePaise / 100).toFixed(2),
        isDefaulter: outstandingBalancePaise > 0,
      },
    };
  }

  async getStudentLedger(studentId: string, user: TokenPayload) {
    if (user.role === USER_ROLES.STUDENT) {
      const studentRes = await query(
        `SELECT id FROM students WHERE id = $1 AND user_id = $2`,
        [studentId, user.userId]
      );
      if (studentRes.rowCount === 0) {
        throw new Error('Access denied to requested fee records');
      }
    }

    const res = await query(
      `SELECT id, financial_year, entry_type, amount_paise, receipt_number, payment_mode, 
              notes, created_at, reversed_entry_id
       FROM fee_ledger_entries
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentId]
    );

    return res.rows.map((row) => ({
      ...row,
      amountRupees: (parseInt(row.amount_paise, 10) / 100).toFixed(2),
      receiptCode: row.receipt_number
        ? `REC/${row.financial_year}/${String(row.receipt_number).padStart(6, '0')}`
        : null,
    }));
  }
}

export const feeService = new FeeService();
