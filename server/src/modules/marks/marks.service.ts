import { pool, query } from '../../config/db';
import { USER_ROLES } from '../../config/constants';
import { TokenPayload } from '../../utils/token';
import { CreateExamInput, SubmitMarksInput, ReviseMarkInput } from './marks.schema';

const calculateGradeAndPoints = (percentage: number) => {
  if (percentage >= 90) return { grade: 'O', gradePoint: 10 };
  if (percentage >= 80) return { grade: 'A+', gradePoint: 9 };
  if (percentage >= 70) return { grade: 'A', gradePoint: 8 };
  if (percentage >= 60) return { grade: 'B+', gradePoint: 7 };
  if (percentage >= 50) return { grade: 'B', gradePoint: 6 };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5 };
  return { grade: 'F', gradePoint: 0 };
};

export class MarksService {
  async createExam(input: CreateExamInput) {
    const res = await query(
      `INSERT INTO exams (class_id, subject_id, name, exam_type, max_marks, exam_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.classId, input.subjectId, input.name, input.examType, input.maxMarks, input.examDate]
    );
    return res.rows[0];
  }

  async submitMarks(input: SubmitMarksInput, user: TokenPayload) {
    const examRes = await query(
      `SELECT id, max_marks, is_published, class_id, subject_id 
       FROM exams 
       WHERE id = $1`,
      [input.examId]
    );

    if (examRes.rowCount === 0) {
      throw new Error('Exam not found');
    }

    const exam = examRes.rows[0];

    if (exam.is_published) {
      throw new Error('Results are locked and published. Use the revision workflow.');
    }

    const maxMarks = parseFloat(exam.max_marks);

    for (const rec of input.records) {
      if (!rec.isAbsent && rec.score !== undefined && rec.score > maxMarks) {
        throw new Error(`Score (${rec.score}) cannot exceed maximum marks (${maxMarks})`);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const rec of input.records) {
        const scoreVal = rec.isAbsent ? null : rec.score ?? null;
        await client.query(
          `INSERT INTO marks (exam_id, student_id, score, is_absent, remarks)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (exam_id, student_id)
           DO UPDATE SET score = EXCLUDED.score, 
                         is_absent = EXCLUDED.is_absent, 
                         remarks = EXCLUDED.remarks,
                         version = marks.version + 1,
                         updated_at = NOW()`,
          [input.examId, rec.studentId, scoreVal, rec.isAbsent, rec.remarks || null]
        );
      }

      await client.query('COMMIT');
      return { message: 'Marks saved successfully', count: input.records.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async publishExam(examId: string, adminUserId: string) {
    const res = await query(
      `UPDATE exams 
       SET is_published = TRUE, published_at = NOW() 
       WHERE id = $1 AND is_published = FALSE
       RETURNING *`,
      [examId]
    );

    if (res.rowCount === 0) {
      throw new Error('Exam not found or already published');
    }

    return { message: 'Results published and locked successfully', exam: res.rows[0] };
  }

  async reviseMark(input: ReviseMarkInput, user: TokenPayload) {
    const markRes = await query(
      `SELECT m.id, m.score, m.is_absent, m.exam_id, e.max_marks, e.is_published
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       WHERE m.id = $1`,
      [input.markId]
    );

    if (markRes.rowCount === 0) {
      throw new Error('Mark record not found');
    }

    const mark = markRes.rows[0];
    const maxMarks = parseFloat(mark.max_marks);

    if (!input.newAbsent && input.newScore !== undefined && input.newScore > maxMarks) {
      throw new Error(`Revised score cannot exceed maximum marks (${maxMarks})`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO result_revisions (
          mark_id, previous_score, new_score, previous_absent, new_absent, reason, revised_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          mark.id,
          mark.score,
          input.newAbsent ? null : input.newScore ?? null,
          mark.is_absent,
          input.newAbsent,
          input.reason,
          user.userId,
        ]
      );

      const updateRes = await client.query(
        `UPDATE marks 
         SET score = $1, is_absent = $2, version = version + 1, updated_at = NOW() 
         WHERE id = $3
         RETURNING *`,
        [input.newAbsent ? null : input.newScore ?? null, input.newAbsent, mark.id]
      );

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getStudentResults(studentId: string, user: TokenPayload) {
    if (user.role === USER_ROLES.STUDENT) {
      const studentRes = await query(
        `SELECT id FROM students WHERE id = $1 AND user_id = $2`,
        [studentId, user.userId]
      );
      if (studentRes.rowCount === 0) {
        throw new Error('Access denied to requested results');
      }
    }

    const marksRes = await query(
      `SELECT m.id as mark_id, m.score, m.is_absent, m.version,
              e.id as exam_id, e.name as exam_name, e.exam_type, e.max_marks, e.exam_date, e.is_published,
              sub.id as subject_id, sub.code as subject_code, sub.name as subject_name, sub.credits
       FROM marks m
       JOIN exams e ON e.id = m.exam_id
       JOIN subjects sub ON sub.id = e.subject_id
       WHERE m.student_id = $1 AND (e.is_published = TRUE OR $2 != 'STUDENT')
       ORDER BY sub.code ASC, e.exam_date ASC`,
      [studentId, user.role]
    );

    let totalCredits = 0;
    let totalGradePointsEarned = 0;

    const results = marksRes.rows.map((row) => {
      const max = parseFloat(row.max_marks);
      const score = row.is_absent ? 0 : parseFloat(row.score ?? '0');
      const percentage = max > 0 ? (score / max) * 100 : 0;
      const { grade, gradePoint } = row.is_absent ? { grade: 'AB', gradePoint: 0 } : calculateGradeAndPoints(percentage);

      const credits = parseInt(row.credits, 10) || 3;
      if (row.exam_type === 'END_TERM') {
        totalCredits += credits;
        totalGradePointsEarned += gradePoint * credits;
      }

      return {
        ...row,
        score: row.score ? parseFloat(row.score) : null,
        maxMarks: max,
        percentage: parseFloat(percentage.toFixed(2)),
        grade,
        gradePoint,
      };
    });

    const sgpa = totalCredits > 0 ? parseFloat((totalGradePointsEarned / totalCredits).toFixed(2)) : 0.0;

    return {
      studentId,
      sgpa,
      totalCredits,
      results,
    };
  }
}

export const marksService = new MarksService();
