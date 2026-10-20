import crypto from 'crypto';
import { pool, query } from '../../config/db';
import { hashPassword } from '../../utils/crypto';
import { USER_ROLES, UserRole } from '../../config/constants';
import { TokenPayload } from '../../utils/token';
import { CreateStudentInput, UpdateStudentInput, StudentQueryParams } from './student.schema';

export class StudentService {
  async listStudents(params: StudentQueryParams) {
    const page = Number(params?.page) || 1;
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 25));
    const offset = (page - 1) * limit;
    const { search, programId, year, division, status } = params || {};

    const conditions: string[] = ['s.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(
        `(s.roll_number ILIKE $${paramIndex} OR s.enrollment_number ILIKE $${paramIndex} OR (s.first_name || ' ' || s.last_name) ILIKE $${paramIndex})`
      );
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (programId) {
      conditions.push(`s.program_id = $${paramIndex}`);
      values.push(programId);
      paramIndex++;
    }

    if (year) {
      conditions.push(`s.current_year = $${paramIndex}`);
      values.push(year);
      paramIndex++;
    }

    if (division) {
      conditions.push(`s.current_division = $${paramIndex}`);
      values.push(division);
      paramIndex++;
    }

    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM students s ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT s.id, s.user_id, s.roll_number, s.enrollment_number, s.first_name, s.last_name, 
              s.full_name_marathi, s.dob, s.gender, s.personal_email, s.phone,
              s.guardian_name, s.guardian_phone, s.guardian_relation,
              s.current_year, s.current_division, s.status, s.created_at,
              p.id as program_id, p.name as program_name, p.code as program_code
       FROM students s
       JOIN programs p ON p.id = s.program_id
       ${whereClause}
       ORDER BY s.roll_number ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      students: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentById(id: string, requester: TokenPayload) {
    const res = await query(
      `SELECT s.*, p.name as program_name, p.code as program_code, p.department
       FROM students s
       JOIN programs p ON p.id = s.program_id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id]
    );

    if (res.rowCount === 0) {
      throw new Error('Student not found');
    }

    const student = res.rows[0];

    // IDOR check: Student can only view their own record
    if (requester.role === USER_ROLES.STUDENT && student.user_id !== requester.userId) {
      throw new Error('Access denied to requested student profile');
    }

    return student;
  }

  async createStudent(input: CreateStudentInput) {
    const existingCheck = await query(
      `SELECT id, roll_number, enrollment_number FROM students 
       WHERE (roll_number = $1 OR enrollment_number = $2) AND deleted_at IS NULL`,
      [input.rollNumber, input.enrollmentNumber]
    );

    if (existingCheck.rowCount && existingCheck.rowCount > 0) {
      const match = existingCheck.rows[0];
      if (match.roll_number === input.rollNumber) {
        throw new Error(`Roll number '${input.rollNumber}' is already registered`);
      }
      throw new Error(`Enrollment number '${input.enrollmentNumber}' is already registered`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const defaultPassword = 'Student@123';
      const passwordHash = await hashPassword(defaultPassword);
      const studentEmail = `${input.rollNumber.toLowerCase()}@adcet.in`;
      const userId = crypto.randomUUID();
      const studentId = crypto.randomUUID();

      await client.query(
        `INSERT INTO users (id, email, roll_number, password_hash, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [userId, studentEmail, input.rollNumber, passwordHash, USER_ROLES.STUDENT]
      );

      const studentRes = await client.query(
        `INSERT INTO students (
          id, user_id, roll_number, enrollment_number, first_name, last_name, full_name_marathi,
          dob, gender, blood_group, personal_email, phone, guardian_name, guardian_phone,
          guardian_relation, guardian_consent_recorded, program_id, current_year,
          current_division, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *`,
        [
          studentId,
          userId,
          input.rollNumber,
          input.enrollmentNumber,
          input.firstName,
          input.lastName,
          input.fullNameMarathi || null,
          input.dob,
          input.gender,
          input.bloodGroup || null,
          input.personalEmail || null,
          input.phone || null,
          input.guardianName,
          input.guardianPhone,
          input.guardianRelation,
          input.guardianConsentRecorded ? 1 : 0,
          input.programId,
          input.currentYear,
          input.currentDivision,
          input.status,
        ]
      );

      await client.query('COMMIT');
      return studentRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStudent(id: string, input: UpdateStudentInput) {
    const current = await query(
      `SELECT id FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (current.rowCount === 0) {
      throw new Error('Student not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      fullNameMarathi: 'full_name_marathi',
      dob: 'dob',
      gender: 'gender',
      bloodGroup: 'blood_group',
      personalEmail: 'personal_email',
      phone: 'phone',
      guardianName: 'guardian_name',
      guardianPhone: 'guardian_phone',
      guardianRelation: 'guardian_relation',
      guardianConsentRecorded: 'guardian_consent_recorded',
      programId: 'program_id',
      currentYear: 'current_year',
      currentDivision: 'current_division',
      status: 'status',
    };

    for (const [key, dbColumn] of Object.entries(fieldMap)) {
      if ((input as any)[key] !== undefined) {
        updates.push(`${dbColumn} = $${idx}`);
        values.push((input as any)[key]);
        idx++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields provided for update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE students 
      SET ${updates.join(', ')} 
      WHERE id = $${idx} AND deleted_at IS NULL 
      RETURNING *`;

    const res = await query(updateQuery, values);
    return res.rows[0];
  }

  async deleteStudent(id: string) {
    const res = await query(
      `UPDATE students 
       SET deleted_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND deleted_at IS NULL 
       RETURNING id, user_id`,
      [id]
    );

    if (res.rowCount === 0) {
      throw new Error('Student not found or already deleted');
    }

    const userId = res.rows[0].user_id;
    if (userId) {
      await query(
        `UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = $1`,
        [userId]
      );
    }

    return { id, message: 'Student soft-deleted successfully' };
  }
}

export const studentService = new StudentService();
