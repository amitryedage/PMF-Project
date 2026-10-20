import { Router } from 'express';
import { feeController } from './fee.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { USER_ROLES } from '../../config/constants';
import { createFeeStructureSchema, recordPaymentSchema, feeAdjustmentSchema } from './fee.schema';

const router = Router();

router.post(
  '/structures',
  authenticate,
  authorizeRoles(USER_ROLES.ACCOUNTS, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createFeeStructureSchema),
  (req, res) => feeController.createFeeStructure(req, res)
);

router.post(
  '/payments',
  authenticate,
  authorizeRoles(USER_ROLES.ACCOUNTS, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(recordPaymentSchema),
  (req, res) => feeController.recordPayment(req, res)
);

router.post(
  '/adjustments',
  authenticate,
  authorizeRoles(USER_ROLES.ACCOUNTS, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(feeAdjustmentSchema),
  (req, res) => feeController.recordAdjustment(req, res)
);

router.get('/student/:studentId/dues', authenticate, (req, res) =>
  feeController.getStudentDues(req, res)
);

router.get('/student/:studentId/ledger', authenticate, (req, res) =>
  feeController.getStudentLedger(req, res)
);

export default router;
