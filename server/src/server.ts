/**
 * SERVER.TS - Entry Point
 * ========================
 * Khởi động HTTP server và xử lý graceful shutdown.
 * Sử dụng DatabaseClient (Singleton) để đảm bảo chỉ có 1 kết nối DB.
 */

import app from "./app";
import DatabaseClient from "./config/database";

const PORT = process.env.PORT || 3000;

// Khởi động server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 [Server] WMS Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`📝 [Server] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 [Singleton] DatabaseClient đã được khởi tạo.\n`);
});

// =============================================
// GRACEFUL SHUTDOWN
// =============================================
// Đóng kết nối DB sạch sẽ khi server tắt
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  [Server] Nhận tín hiệu ${signal}. Đang tắt server...`);

  server.close(async () => {
    console.log("🔒 [Server] HTTP server đã đóng.");
    await DatabaseClient.disconnect();
    console.log("✅ [Server] Đã tắt hoàn toàn.");
    process.exit(0);
  });

  // Force exit nếu graceful shutdown quá lâu
  setTimeout(() => {
    console.error("❌ [Server] Graceful shutdown timeout. Force exit.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Xử lý unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ [Server] Unhandled Rejection at:", promise, "reason:", reason);
});
