import { Request, Response } from 'express';
import { studentService } from './student.service';
import { sendSuccess, sendError } from '../../utils/response';
import { StudentQueryParams } from './student.schema';

export class StudentController {
  async listStudents(req: Request, res: Response) {
    try {
      const result = await studentService.listStudents(req.query as unknown as StudentQueryParams);
      return sendSuccess(res, result.students, 200, result.pagination);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getStudentById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }
      const student = await studentService.getStudentById(req.params.id, req.user);
      return sendSuccess(res, student);
    } catch (err: any) {
      const status = err.message.includes('Access denied') ? 403 : 404;
      return sendError(res, err.message, status);
    }
  }

  async createStudent(req: Request, res: Response) {
    try {
      const student = await studentService.createStudent(req.body);
      return sendSuccess(res, student, 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async updateStudent(req: Request, res: Response) {
    try {
      const student = await studentService.updateStudent(req.params.id, req.body);
      return sendSuccess(res, student);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async deleteStudent(req: Request, res: Response) {
    try {
      const result = await studentService.deleteStudent(req.params.id);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}

export const studentController = new StudentController();
