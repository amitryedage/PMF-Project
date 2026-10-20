import { Request, Response } from 'express';
import { reportService, arrayToCsv } from './report.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AttendanceReportQuery, GradeReportQuery, FeeDefaultersQuery, AuditLogQuery } from './report.schema';

export class ReportController {
  async getAttendanceReport(req: Request, res: Response) {
    try {
      const query = req.query as unknown as AttendanceReportQuery;
      const data = await reportService.getAttendanceReport(query);

      if (query.format === 'csv') {
        const columns = [
          { key: 'roll_number', header: 'Roll Number' },
          { key: 'fullName', header: 'Student Name' },
          { key: 'program_code', header: 'Program' },
          { key: 'current_year', header: 'Year' },
          { key: 'current_division', header: 'Division' },
          { key: 'total_sessions', header: 'Total Sessions' },
          { key: 'attended_sessions', header: 'Attended Sessions' },
          { key: 'percentage', header: 'Attendance %' },
          { key: 'isDefaulter', header: 'Below 75%' },
        ];
        const csv = arrayToCsv(columns, data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
        return res.send(csv);
      }

      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getGradeReport(req: Request, res: Response) {
    try {
      const query = req.query as unknown as GradeReportQuery;
      const data = await reportService.getGradeReport(query);

      if (query.format === 'csv') {
        const columns = [
          { key: 'roll_number', header: 'Roll Number' },
          { key: 'fullName', header: 'Student Name' },
          { key: 'subject_code', header: 'Subject Code' },
          { key: 'subject_name', header: 'Subject Name' },
          { key: 'exam_name', header: 'Exam' },
          { key: 'score', header: 'Score' },
          { key: 'max_marks', header: 'Max Marks' },
          { key: 'percentage', header: 'Percentage' },
          { key: 'status', header: 'Result Status' },
        ];
        const csv = arrayToCsv(columns, data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="grade_report.csv"');
        return res.send(csv);
      }

      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getFeeDefaultersReport(req: Request, res: Response) {
    try {
      const query = req.query as unknown as FeeDefaultersQuery;
      const data = await reportService.getFeeDefaultersReport(query);

      if (query.format === 'csv') {
        const columns = [
          { key: 'rollNumber', header: 'Roll Number' },
          { key: 'fullName', header: 'Student Name' },
          { key: 'phone', header: 'Student Phone' },
          { key: 'guardianName', header: 'Guardian Name' },
          { key: 'guardianPhone', header: 'Guardian Phone' },
          { key: 'programCode', header: 'Program' },
          { key: 'currentYear', header: 'Year' },
          { key: 'chargesRupees', header: 'Total Dues (₹)' },
          { key: 'paidRupees', header: 'Total Paid (₹)' },
          { key: 'outstandingBalanceRupees', header: 'Balance Outstanding (₹)' },
        ];
        const csv = arrayToCsv(columns, data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="fee_defaulters.csv"');
        return res.send(csv);
      }

      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getAuditLogs(req: Request, res: Response) {
    try {
      const query = req.query as unknown as AuditLogQuery;
      const result = await reportService.getAuditLogs(query);
      return sendSuccess(res, result.logs, 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}

export const reportController = new ReportController();
