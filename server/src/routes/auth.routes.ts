/**
 * AUTH ROUTES
 * ============
 * Định nghĩa các route cho module xác thực.
 */

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập, nhận JWT token
 * @access  Public
 */
router.post("/login", (req, res, next) => authController.login(req, res, next));

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
router.post("/register", (req, res, next) => authController.register(req, res, next));

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user đang đăng nhập
 * @access  Private (Cần JWT hợp lệ)
 */
router.get("/me", authenticateToken, (req, res) => authController.getMe(req, res));

export default router;
