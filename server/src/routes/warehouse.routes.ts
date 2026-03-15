/**
 * WAREHOUSE ROUTES
 * =================
 * Định nghĩa tất cả routes cho Warehouse Management module.
 * Áp dụng Proxy Pattern (authenticateToken + authorizeRoles) để phân quyền.
 *
 * Owner: Toàn quyền CRUD + quản lý phân công user.
 * Manager/Staff: Chỉ xem (GET) kho được phân công (via middleware).
 */

import { Router } from 'express';
import { warehouseController } from '../controllers/warehouse.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { RoleName } from '../types/auth.types';

const router: Router = Router();

// Tất cả warehouse routes đều yêu cầu đăng nhập
router.use(authenticateToken);

// ── Read Operations (Owner only — warehouse data là sensitive) ──
router.get('/', authorizeRoles(RoleName.OWNER, RoleName.MANAGER), (req, res, next) => warehouseController.getAll(req, res, next));
router.get('/:id', authorizeRoles(RoleName.OWNER, RoleName.MANAGER), (req, res, next) => warehouseController.getById(req, res, next));

// ── Write Operations (Owner only) ──
router.post(
  '/',
  authorizeRoles(RoleName.OWNER),
  (req, res, next) => warehouseController.create(req, res, next)
);

router.put(
  '/:id',
  authorizeRoles(RoleName.OWNER),
  (req, res, next) => warehouseController.update(req, res, next)
);

router.delete(
  '/:id',
  authorizeRoles(RoleName.OWNER),
  (req, res, next) => warehouseController.delete(req, res, next)
);

// ── User Assignment (Owner only) ──
router.post(
  '/:id/users',
  authorizeRoles(RoleName.OWNER),
  (req, res, next) => warehouseController.assignUser(req, res, next)
);

router.delete(
  '/:id/users/:userId',
  authorizeRoles(RoleName.OWNER),
  (req, res, next) => warehouseController.removeUser(req, res, next)
);

export default router;
