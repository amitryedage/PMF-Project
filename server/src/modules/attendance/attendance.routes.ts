import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { USER_ROLES } from '../../config/constants';
import { createSessionSchema, submitBulkAttendanceSchema } from './attendance.schema';

const router = Router();

router.post(
  '/sessions',
  authenticate,
  authorizeRoles(USER_ROLES.FACULTY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createSessionSchema),
  (req, res) => attendanceController.createSession(req, res)
);

router.post(
  '/records',
  authenticate,
  authorizeRoles(USER_ROLES.FACULTY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(submitBulkAttendanceSchema),
  (req, res) => attendanceController.submitBulkAttendance(req, res)
);

router.get('/student/:studentId', authenticate, (req, res) =>
  attendanceController.getStudentSummary(req, res)
);

export default router;
