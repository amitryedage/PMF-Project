import { Request, Response } from 'express';
import { feeService } from './fee.service';
import { sendSuccess, sendError } from '../../utils/response';

export class FeeController {
  async createFeeStructure(req: Request, res: Response) {
    try {
      const structure = await feeService.createFeeStructure(req.body);
      return sendSuccess(res, structure, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async recordPayment(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const payment = await feeService.recordPayment(req.body, req.user);
      return sendSuccess(res, payment, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async recordAdjustment(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const adjustment = await feeService.recordAdjustment(req.body, req.user);
      return sendSuccess(res, adjustment, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getStudentDues(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const dues = await feeService.getStudentDues(req.params.studentId, req.user);
      return sendSuccess(res, dues);
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 400;
      return sendError(res, err.message, status);
    }
  }

  async getStudentLedger(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const ledger = await feeService.getStudentLedger(req.params.studentId, req.user);
      return sendSuccess(res, ledger);
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 400;
      return sendError(res, err.message, status);
    }
  }
}

export const feeController = new FeeController();
