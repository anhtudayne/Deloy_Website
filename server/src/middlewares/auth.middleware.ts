/**
 * AUTH MIDDLEWARE - PROXY PATTERN
 * ================================
 * Proxy Pattern: Kiểm soát quyền truy cập TRƯỚC KHI request đến Controller.
 * Hoạt động như một "lớp bảo vệ" đứng giữa Client và Resource.
 *
 * Có 3 cấp Proxy được định nghĩa ở đây:
 * 1. `authenticateToken`  - Verify JWT, xác thực danh tính
 * 2. `authorizeRoles`     - Kiểm tra role có đủ quyền không (RBAC)
 * 3. `authorizeWarehouse` - Kiểm tra quyền truy cập kho cụ thể (Owner bypass)
 */

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { JwtPayload, RoleName } from "../types/auth.types";

// Mở rộng Express Request để TypeScript nhận biết `req.user`
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// =============================================
// PROXY 1: Xác thực Token (Authentication)
// =============================================
/**
 * Middleware kiểm tra JWT trong Authorization header.
 * Nếu hợp lệ → gắn payload vào `req.user` và cho đi tiếp.
 * Nếu không → block ngay với 401.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Lấy token từ "Bearer <token>"

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Truy cập bị từ chối. Không tìm thấy token xác thực.",
    });
    return;
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn.",
    });
  }
};

// =============================================
// PROXY 2: Kiểm tra Role (Authorization - RBAC)
// =============================================
/**
 * Factory function tạo middleware kiểm tra role.
 * Sử dụng: `authorizeRoles(RoleName.OWNER, RoleName.MANAGER)`
 *
 * Ví dụ: Chỉ Owner và Manager mới được xóa sản phẩm.
 */
export const authorizeRoles = (...allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: "Chưa xác thực." });
      return;
    }

    const hasRole = allowedRoles.some(
      (role) => role === (user.role as RoleName)
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu role: [${allowedRoles.join(", ")}].`,
      });
      return;
    }

    next();
  };
};

// =============================================
// PROXY 3: Kiểm tra quyền truy cập Kho (Warehouse Access Control)
// =============================================
/**
 * Middleware kiểm tra quyền truy cập kho dựa trên:
 * 1. Route param (mặc định `req.params.warehouseId`)
 * 2. Query param `req.query.warehouse_id` (cho các route listing như GET /products)
 *
 * Logic RBAC:
 * - Owner → Bypass, truy cập TẤT CẢ kho
 * - Manager/Staff → Chỉ truy cập kho trong `assignedWarehouses` của token
 *   • Nếu request chỉ định warehouse_id cụ thể → kiểm tra quyền
 *   • Nếu không chỉ định → cho đi tiếp, controller tự enforce filter
 *
 * Sử dụng:
 *   `router.get('/', authorizeWarehouseAccess(), controller.getProducts)`
 *   `router.get('/:warehouseId/items', authorizeWarehouseAccess('warehouseId'), ...)`
 */
export const authorizeWarehouseAccess = (paramName: string = "warehouseId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: "Chưa xác thực." });
      return;
    }

    // ⭐ Owner bypass: Chủ sở hữu có quyền truy cập tất cả kho
    if (user.role === RoleName.OWNER) {
      next();
      return;
    }

    // Xác định warehouse_id được yêu cầu từ route param HOẶC query param
    const paramValue = req.params[paramName];
    const queryValue = req.query['warehouse_id'] as string | undefined;
    const rawId = paramValue ?? queryValue;

    if (!rawId) {
      // Không chỉ định warehouse cụ thể → cho đi tiếp, controller tự lọc
      next();
      return;
    }

    const requestedWarehouseId = parseInt(rawId, 10);

    if (isNaN(requestedWarehouseId)) {
      res.status(400).json({
        success: false,
        message: "Warehouse ID không hợp lệ.",
      });
      return;
    }

    // Kiểm tra quyền truy cập kho được yêu cầu
    const hasAccess = user.assignedWarehouses.includes(requestedWarehouseId);

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập kho #${requestedWarehouseId}. Chỉ được truy cập kho đã được phân công.`,
      });
      return;
    }

    next();
  };
};

// =============================================
// PROXY 4: Lọc dữ liệu theo kho (Response Filtering Helper)
// =============================================
/**
 * Utility function (không phải middleware) dùng trong Service layer.
 * Trả về danh sách warehouse_id mà user được phép truy cập.
 *
 * - Owner → `undefined` (không filter, lấy tất cả)
 * - Others → Mảng warehouse_id từ token
 */
export const getAccessibleWarehouseIds = (user: JwtPayload): number[] | undefined => {
  if (user.role === RoleName.OWNER) {
    return undefined; // Prisma sẽ không filter, lấy all
  }
  return user.assignedWarehouses;
};
