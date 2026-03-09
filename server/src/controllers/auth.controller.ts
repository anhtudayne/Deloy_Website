/**
 * AUTH CONTROLLER - PRESENTATION LAYER
 * =======================================
 * Controller chỉ xử lý HTTP: nhận request, gọi service, trả về response.
 * Không chứa business logic.
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService, InvalidCredentialsError, AccountLockedError, AccountInactiveError } from "../services/auth.service";

// =============================================
// Zod Schema - Validation đầu vào
// =============================================
const loginSchema = z.object({
  username: z
    .string({ required_error: "Username là bắt buộc." })
    .min(3, "Username phải có ít nhất 3 ký tự."),
  password: z
    .string({ required_error: "Password là bắt buộc." })
    .min(6, "Password phải có ít nhất 6 ký tự."),
});

class AuthController {
  /**
   * POST /api/auth/login
   * Đăng nhập và trả về JWT token.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Bước 1: Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ.",
          errors: validationResult.error.flatten().fieldErrors,
        });
        return;
      }

      // Bước 2: Gọi service để xử lý đăng nhập
      const result = await authService.login(validationResult.data);

      // Bước 3: Trả về kết quả thành công
      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công.",
        data: result,
      });
    } catch (error) {
      // Bước 4: Xử lý các lỗi nghiệp vụ cụ thể
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ success: false, message: error.message });
        return;
      }
      if (error instanceof AccountLockedError) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }
      if (error instanceof AccountInactiveError) {
        res.status(403).json({ success: false, message: error.message });
        return;
      }

      // Lỗi không xác định → chuyển sang global error handler
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Lấy thông tin user hiện tại từ token (đã được middleware xác thực).
   */
  async getMe(req: Request, res: Response): Promise<void> {
    // user đã được gắn vào req bởi authenticateToken middleware
    const user = (req as any).user;
    res.status(200).json({
      success: true,
      data: user,
    });
  }
}

// Export singleton instance
export const authController = new AuthController();
