import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { sendSuccess, sendError } from '../../utils/response';

export class AttendanceController {
  async createSession(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const session = await attendanceService.createSession(req.body, req.user);
      return sendSuccess(res, session, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async submitBulkAttendance(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const result = await attendanceService.submitBulkAttendance(req.body, req.user);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getStudentSummary(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const studentId = req.params.studentId;
      const summary = await attendanceService.getStudentAttendanceSummary(studentId, req.user);
      return sendSuccess(res, summary);
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 400;
      return sendError(res, err.message, status);
    }
  }
}

export const attendanceController = new AttendanceController();
