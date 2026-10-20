import { Router } from 'express';
import { studentController } from './student.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { USER_ROLES } from '../../config/constants';
import { createStudentSchema, updateStudentSchema, studentQuerySchema } from './student.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY, USER_ROLES.ACCOUNTS),
  validateRequest(studentQuerySchema),
  (req, res) => studentController.listStudents(req, res)
);

router.get('/:id', authenticate, (req, res) => studentController.getStudentById(req, res));

router.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createStudentSchema),
  (req, res) => studentController.createStudent(req, res)
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(updateStudentSchema),
  (req, res) => studentController.updateStudent(req, res)
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res) => studentController.deleteStudent(req, res)
);

export default router;
