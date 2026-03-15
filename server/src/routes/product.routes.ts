/**
 * PRODUCT ROUTES
 * ================
 * Định nghĩa tất cả routes cho Product Management module.
 * Áp dụng RBAC middleware (Proxy Pattern) để phân quyền.
 *
 * C3 Fix: authorizeWarehouseAccess() được gắn vào TẤT CẢ routes (cả Read lẫn Write)
 * để bảo vệ dữ liệu Model theo từng kho.
 */

import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateToken, authorizeRoles, authorizeWarehouseAccess } from '../middlewares/auth.middleware';
import { RoleName } from '../types/auth.types';

const router: Router = Router();

// Tất cả product routes đều yêu cầu đăng nhập
router.use(authenticateToken);

// ── Read Operations (Manager + Owner + Staff) ──
// authorizeWarehouseAccess() kiểm tra warehouse_id từ req.query, block truy cập kho không được phân công
router.get('/', authorizeWarehouseAccess(), (req, res, next) => productController.getProducts(req, res, next));
router.get('/stats', authorizeWarehouseAccess(), (req, res, next) => productController.getStats(req, res, next));
router.get('/trace/:imei', (req, res, next) => productController.getImeiTrace(req, res, next));
router.get('/form-options', (req, res, next) => productController.getFormOptions(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));

// ── Write Operations (chỉ Owner và Manager, bảo vệ bởi Proxy Pattern) ──
router.post(
  '/',
  authorizeWarehouseAccess(),
  authorizeRoles(RoleName.OWNER, RoleName.MANAGER),
  (req, res, next) => productController.createProduct(req, res, next)
);

router.put(
  '/:id',
  authorizeWarehouseAccess(),
  authorizeRoles(RoleName.OWNER, RoleName.MANAGER),
  (req, res, next) => productController.updateProduct(req, res, next)
);

router.delete(
  '/:id',
  authorizeWarehouseAccess(),
  authorizeRoles(RoleName.OWNER, RoleName.MANAGER),
  (req, res, next) => productController.deleteProduct(req, res, next)
);

export default router;
