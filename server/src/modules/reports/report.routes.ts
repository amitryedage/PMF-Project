import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { USER_ROLES } from '../../config/constants';
import {
  attendanceReportQuerySchema,
  gradeReportQuerySchema,
  feeDefaultersQuerySchema,
  auditLogQuerySchema,
} from './report.schema';

const router = Router();

router.get(
  '/attendance',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY),
  validateRequest(attendanceReportQuerySchema),
  (req, res) => reportController.getAttendanceReport(req, res)
);

router.get(
  '/grades',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY),
  validateRequest(gradeReportQuerySchema),
  (req, res) => reportController.getGradeReport(req, res)
);

router.get(
  '/defaulters',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ACCOUNTS),
  validateRequest(feeDefaultersQuerySchema),
  (req, res) => reportController.getFeeDefaultersReport(req, res)
);

router.get(
  '/audit',
  authenticate,
  authorizeRoles(USER_ROLES.SUPER_ADMIN),
  validateRequest(auditLogQuerySchema),
  (req, res) => reportController.getAuditLogs(req, res)
);

export default router;
