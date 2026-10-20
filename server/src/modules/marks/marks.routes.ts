import { Router } from 'express';
import { marksController } from './marks.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { USER_ROLES } from '../../config/constants';
import { createExamSchema, submitMarksSchema, reviseMarkSchema } from './marks.schema';

const router = Router();

router.post(
  '/exams',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createExamSchema),
  (req, res) => marksController.createExam(req, res)
);

router.post(
  '/entry',
  authenticate,
  authorizeRoles(USER_ROLES.FACULTY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(submitMarksSchema),
  (req, res) => marksController.submitMarks(req, res)
);

router.post(
  '/exams/:examId/publish',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res) => marksController.publishExam(req, res)
);

router.post(
  '/revise',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(reviseMarkSchema),
  (req, res) => marksController.reviseMark(req, res)
);

router.get('/student/:studentId', authenticate, (req, res) =>
  marksController.getStudentResults(req, res)
);

export default router;
