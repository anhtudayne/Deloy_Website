import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { transactionController } from "../controllers/transaction.controller";

const router = Router();

// Endpoint POST /api/transactions/inbound
// Sử dụng authenticateToken, sau đó controller sẽ đóng vai trò Proxy kiểm tra quyền truy cập warehouse (từ body).
router.post("/inbound", authenticateToken, transactionController.handleInboundTransaction);

// Endpoint POST /api/transactions/outbound
router.post("/outbound", authenticateToken, transactionController.handleOutboundTransaction);

// Endpoint POST /api/transactions/transfer/out
router.post("/transfer/out", authenticateToken, transactionController.handleTransferOut);

// Endpoint POST /api/transactions/transfer/confirm
router.post("/transfer/confirm", authenticateToken, transactionController.handleTransferConfirm);

// Endpoint GET /api/transactions/transfer/pending
router.get("/transfer/pending", authenticateToken, transactionController.getPendingTransfers);

export default router;
