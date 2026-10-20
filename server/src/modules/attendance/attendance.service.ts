import { pool, query } from '../../config/db';
import { USER_ROLES } from '../../config/constants';
import { TokenPayload } from '../../utils/token';
import { CreateSessionInput, SubmitBulkAttendanceInput } from './attendance.schema';

export class AttendanceService {
  async createSession(input: CreateSessionInput, user: TokenPayload) {
    if (user.role === USER_ROLES.FACULTY) {
      const assignCheck = await query(
        `SELECT id FROM faculty_assignments 
         WHERE id = $1 AND faculty_user_id = $2`,
        [input.facultyAssignmentId, user.userId]
      );
      if (assignCheck.rowCount === 0) {
        throw new Error('You are not assigned to this class and subject');
      }
    }

    const res = await query(
      `INSERT INTO attendance_sessions (faculty_assignment_id, session_date, session_hour, topic)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (faculty_assignment_id, session_date, session_hour) 
       DO UPDATE SET topic = EXCLUDED.topic, updated_at = NOW()
       RETURNING *`,
      [input.facultyAssignmentId, input.sessionDate, input.sessionHour, input.topic || null]
    );

    return res.rows[0];
  }

  async submitBulkAttendance(input: SubmitBulkAttendanceInput, user: TokenPayload) {
    const sessionRes = await query(
      `SELECT s.id, s.session_date, f.faculty_user_id 
       FROM attendance_sessions s
       JOIN faculty_assignments f ON f.id = s.faculty_assignment_id
       WHERE s.id = $1`,
      [input.sessionId]
    );

    if (sessionRes.rowCount === 0) {
      throw new Error('Attendance session not found');
    }

    const session = sessionRes.rows[0];

    if (user.role === USER_ROLES.FACULTY && session.faculty_user_id !== user.userId) {
      throw new Error('Unauthorized to record attendance for this session');
    }

    // 7-day edit window constraint
    const sessionDate = new Date(session.session_date);
    const diffDays = (Date.now() - sessionDate.getTime()) / (1000 * 3600 * 24);
    if (diffDays > 7 && ![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role as any)) {
      throw new Error('Attendance edit window of 7 days has expired. Admin override required.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const rec of input.records) {
        await client.query(
          `INSERT INTO attendance_records (session_id, student_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, student_id)
           DO UPDATE SET status = EXCLUDED.status`,
          [input.sessionId, rec.studentId, rec.status]
        );
      }

      await client.query(
        `UPDATE attendance_sessions SET version = version + 1, updated_at = NOW() WHERE id = $1`,
        [input.sessionId]
      );

      await client.query('COMMIT');
      return { message: 'Attendance recorded successfully', count: input.records.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getStudentAttendanceSummary(studentId: string, user: TokenPayload) {
    if (user.role === USER_ROLES.STUDENT) {
      const studentRes = await query(
        `SELECT id FROM students WHERE id = $1 AND user_id = $2`,
        [studentId, user.userId]
      );
      if (studentRes.rowCount === 0) {
        throw new Error('Access denied to attendance record');
      }
    }

    const res = await query(
      `SELECT sub.id as subject_id, sub.code as subject_code, sub.name as subject_name,
              COUNT(ar.id)::int as total_sessions,
              COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::int as attended_sessions,
              CASE 
                WHEN COUNT(ar.id) > 0 
                THEN ROUND((COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::numeric / COUNT(ar.id)) * 100, 2)
                ELSE 0.00
              END as percentage
       FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       JOIN faculty_assignments fa ON fa.id = s.faculty_assignment_id
       JOIN subjects sub ON sub.id = fa.subject_id
       WHERE ar.student_id = $1
       GROUP BY sub.id, sub.code, sub.name
       ORDER BY sub.code ASC`,
      [studentId]
    );

    const subjectStats = res.rows.map((row) => ({
      ...row,
      isBelowThreshold: parseFloat(row.percentage) < 75.0,
    }));

    const totalSessions = subjectStats.reduce((acc, curr) => acc + curr.total_sessions, 0);
    const totalAttended = subjectStats.reduce((acc, curr) => acc + curr.attended_sessions, 0);
    const overallPercentage =
      totalSessions > 0 ? parseFloat(((totalAttended / totalSessions) * 100).toFixed(2)) : 0;

    return {
      studentId,
      overallPercentage,
      isOverallBelowThreshold: overallPercentage < 75.0,
      subjectStats,
    };
  }
}

export const attendanceService = new AttendanceService();
