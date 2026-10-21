import { query } from '../../config/db';
import { AttendanceReportQuery, GradeReportQuery, FeeDefaultersQuery, AuditLogQuery } from './report.schema';

export const sanitizeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Escape Excel formula injection
  if (/^[=@+\-\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const arrayToCsv = (columns: { key: string; header: string }[], data: any[]): string => {
  const headerRow = columns.map((col) => sanitizeCsvCell(col.header)).join(',');
  const dataRows = data.map((row) =>
    columns.map((col) => sanitizeCsvCell(row[col.key])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

export class ReportService {
  async getAttendanceReport(params: AttendanceReportQuery) {
    const { classId, subjectId, programId, year } = params;

    const conditions: string[] = ['s.deleted_at IS NULL'];
    const values: any[] = [];
    let idx = 1;

    if (classId) {
      conditions.push(`ce.class_id = $${idx}`);
      values.push(classId);
      idx++;
    }

    if (programId) {
      conditions.push(`s.program_id = $${idx}`);
      values.push(programId);
      idx++;
    }

    if (year) {
      conditions.push(`s.current_year = $${idx}`);
      values.push(year);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name, 
             s.current_year, s.current_division, p.code as program_code,
             COUNT(ar.id)::int as total_sessions,
             COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::int as attended_sessions,
             CASE 
               WHEN COUNT(ar.id) > 0 
               THEN ROUND((COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::numeric / COUNT(ar.id)) * 100, 2)
               ELSE 0.00
             END as percentage
      FROM students s
      JOIN programs p ON p.id = s.program_id
      LEFT JOIN class_enrollments ce ON ce.student_id = s.id
      LEFT JOIN attendance_records ar ON ar.student_id = s.id
      ${whereClause}
      GROUP BY s.id, s.roll_number, s.first_name, s.last_name, s.current_year, s.current_division, p.code
      ORDER BY s.roll_number ASC`;

    const res = await query(sql, values);

    return res.rows.map((row) => ({
      ...row,
      percentage: parseFloat(row.percentage),
      isDefaulter: parseFloat(row.percentage) < 75.0,
      fullName: `${row.first_name} ${row.last_name}`,
    }));
  }

  async getGradeReport(params: GradeReportQuery) {
    const { classId, examId, subjectId } = params;

    const conditions: string[] = ['s.deleted_at IS NULL'];
    const values: any[] = [];
    let idx = 1;

    if (classId) {
      conditions.push(`e.class_id = $${idx}`);
      values.push(classId);
      idx++;
    }

    if (examId) {
      conditions.push(`e.id = $${idx}`);
      values.push(examId);
      idx++;
    }

    if (subjectId) {
      conditions.push(`e.subject_id = $${idx}`);
      values.push(subjectId);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name,
             e.id as exam_id, e.name as exam_name, e.max_marks,
             sub.code as subject_code, sub.name as subject_name,
             m.score, m.is_absent
      FROM students s
      JOIN marks m ON m.student_id = s.id
      JOIN exams e ON e.id = m.exam_id
      JOIN subjects sub ON sub.id = e.subject_id
      ${whereClause}
      ORDER BY s.roll_number ASC, sub.code ASC`;

    const res = await query(sql, values);

    return res.rows.map((row) => {
      const max = parseFloat(row.max_marks);
      const score = row.is_absent ? 0 : parseFloat(row.score ?? '0');
      const pct = max > 0 ? (score / max) * 100 : 0;
      return {
        ...row,
        score: row.score !== null ? parseFloat(row.score) : null,
        percentage: parseFloat(pct.toFixed(2)),
        status: row.is_absent ? 'ABSENT' : pct >= 40 ? 'PASS' : 'FAIL',
        fullName: `${row.first_name} ${row.last_name}`,
      };
    });
  }

  async getFeeDefaultersReport(params: FeeDefaultersQuery) {
    const { programId, year, financialYear } = params;

    const conditions: string[] = ['s.deleted_at IS NULL'];
    const values: any[] = [];
    let idx = 1;

    if (programId) {
      conditions.push(`s.program_id = $${idx}`);
      values.push(programId);
      idx++;
    }

    if (year) {
      conditions.push(`s.current_year = $${idx}`);
      values.push(year);
      idx++;
    }

    let fyCondition = '';
    if (financialYear) {
      fyCondition = `AND fle.financial_year = $${idx}`;
      values.push(financialYear);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name, s.phone,
             s.guardian_name, s.guardian_phone, s.current_year, s.current_division,
             p.code as program_code,
             COALESCE(SUM(CASE WHEN fle.entry_type = 'CHARGE' THEN fle.amount_paise ELSE 0 END), 0)::bigint as total_charges,
             COALESCE(SUM(CASE WHEN fle.entry_type = 'PAYMENT' THEN fle.amount_paise ELSE 0 END), 0)::bigint as total_payments,
             COALESCE(SUM(CASE WHEN fle.entry_type = 'WAIVER' THEN fle.amount_paise ELSE 0 END), 0)::bigint as total_waivers,
             COALESCE(SUM(CASE WHEN fle.entry_type = 'REFUND' THEN fle.amount_paise ELSE 0 END), 0)::bigint as total_refunds
      FROM students s
      JOIN programs p ON p.id = s.program_id
      LEFT JOIN fee_ledger_entries fle ON fle.student_id = s.id ${fyCondition}
      ${whereClause}
      GROUP BY s.id, s.roll_number, s.first_name, s.last_name, s.phone, s.guardian_name, s.guardian_phone, s.current_year, s.current_division, p.code
      HAVING (
        COALESCE(SUM(CASE WHEN fle.entry_type = 'CHARGE' THEN fle.amount_paise ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN fle.entry_type = 'PAYMENT' THEN fle.amount_paise ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN fle.entry_type = 'WAIVER' THEN fle.amount_paise ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN fle.entry_type = 'REFUND' THEN fle.amount_paise ELSE 0 END), 0)
      ) > 0
      ORDER BY s.roll_number ASC`;

    const res = await query(sql, values);

    return res.rows.map((row) => {
      const charges = parseInt(row.total_charges, 10);
      const payments = parseInt(row.total_payments, 10);
      const waivers = parseInt(row.total_waivers, 10);
      const refunds = parseInt(row.total_refunds, 10);
      const balancePaise = charges - payments - waivers + refunds;

      return {
        studentId: row.student_id,
        rollNumber: row.roll_number,
        fullName: `${row.first_name} ${row.last_name}`,
        phone: row.phone,
        guardianName: row.guardian_name,
        guardianPhone: row.guardian_phone,
        currentYear: row.current_year,
        currentDivision: row.current_division,
        programCode: row.program_code,
        chargesRupees: (charges / 100).toFixed(2),
        paidRupees: (payments / 100).toFixed(2),
        waiverRupees: (waivers / 100).toFixed(2),
        outstandingBalanceRupees: (balancePaise / 100).toFixed(2),
      };
    });
  }

  async getAuditLogs(params: AuditLogQuery) {
    const { actorUserId, action, entityType } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (actorUserId) {
      conditions.push(`al.actor_user_id = $${idx}`);
      values.push(actorUserId);
      idx++;
    }

    if (action) {
      conditions.push(`al.action ILIKE $${idx}`);
      values.push(`%${action}%`);
      idx++;
    }

    if (entityType) {
      conditions.push(`al.entity_type = $${idx}`);
      values.push(entityType);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM audit_logs al ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const sql = `
      SELECT al.*, u.email as actor_email, u.role as actor_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`;

    const res = await query(sql, [...values, limit, offset]);

    return {
      logs: res.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const reportService = new ReportService();
