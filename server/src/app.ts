/**
 * APP.TS - Express Application Setup
 * =====================================
 * Khởi tạo Express app, đăng ký middleware và routes.
 * Tách biệt khỏi server.ts để dễ test.
 */

import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import warehouseRoutes from "./routes/warehouse.routes";
import dashboardRoutes from "./routes/dashboard.routes";

// Middlewares
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware";

// Load environment variables
dotenv.config();

const app: Application = express();

// =============================================
// GLOBAL MIDDLEWARES
// =============================================

// CORS - Cho phép frontend truy cập API
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (chỉ trong development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =============================================
// HEALTH CHECK
// =============================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 WMS Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// API ROUTES
// =============================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes); // Warehouse module
app.use("/api/dashboard", dashboardRoutes);

import transactionRoutes from "./routes/transaction.routes";
import supplierRoutes from "./routes/supplier.routes";
import customerRoutes from "./routes/customer.routes";

// TODO: Thêm các routes khác tại đây
app.use("/api/transactions", transactionRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);

// =============================================
// ERROR HANDLING (phải đặt SAU các routes)
// =============================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
