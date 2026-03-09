/**
 * ERROR HANDLER MIDDLEWARE
 * ==========================
 * Global error handler - bắt tất cả lỗi không xử lý được từ các middleware/controller.
 * Phải đặt CUỐI CÙNG trong Express app (sau tất cả routes).
 */

import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ nội bộ.";

  // Log lỗi trong development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ [Error Handler]:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * 404 Handler - Đặt trước global error handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
};
