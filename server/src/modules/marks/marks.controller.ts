import { Request, Response } from 'express';
import { marksService } from './marks.service';
import { sendSuccess, sendError } from '../../utils/response';

export class MarksController {
  async createExam(req: Request, res: Response) {
    try {
      const exam = await marksService.createExam(req.body);
      return sendSuccess(res, exam, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async submitMarks(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const result = await marksService.submitMarks(req.body, req.user);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async publishExam(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const result = await marksService.publishExam(req.params.examId, req.user.userId);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async reviseMark(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const revision = await marksService.reviseMark(req.body, req.user);
      return sendSuccess(res, revision);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getStudentResults(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const results = await marksService.getStudentResults(req.params.studentId, req.user);
      return sendSuccess(res, results);
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 400;
      return sendError(res, err.message, status);
    }
  }
}

export const marksController = new MarksController();
