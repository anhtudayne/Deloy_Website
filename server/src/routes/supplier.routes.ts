import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Toàn bộ route supplier cần đăng nhập
router.use(authenticateToken);

router.get("/", SupplierController.getAllSuppliers);
router.post("/", SupplierController.createSupplier);
router.get("/:id", SupplierController.getSupplierById);
router.put("/:id", SupplierController.updateSupplier);
router.delete("/:id", SupplierController.deleteSupplier);

export default router;
