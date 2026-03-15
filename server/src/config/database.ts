/**
 * DATABASE CONFIG - SINGLETON PATTERN
 * =====================================
 * Đảm bảo chỉ có MỘT thực thể PrismaClient duy nhất tồn tại trong suốt
 * vòng đời ứng dụng. Tránh việc tạo quá nhiều connection pool.
 */

import { PrismaClient } from "@prisma/client";

class DatabaseClient {
  private static instance: PrismaClient | null = null;

  // Constructor private: Ngăn chặn việc tạo instance từ bên ngoài
  private constructor() {}

  /**
   * Phương thức static duy nhất để lấy instance của PrismaClient.
   * Nếu chưa có instance, tạo mới. Nếu đã có, trả về instance cũ.
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
      });
      console.log("✅ [Singleton] DatabaseClient: New PrismaClient instance created.");
    }
    return DatabaseClient.instance;
  }

  /**
   * Ngắt kết nối database một cách an toàn khi server shutdown.
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
      console.log("🔌 [Singleton] DatabaseClient: Disconnected.");
    }
  }
}

// Export một instance duy nhất để sử dụng xuyên suốt ứng dụng
export const prisma = DatabaseClient.getInstance();
export default DatabaseClient;
