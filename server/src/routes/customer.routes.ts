import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Toàn bộ route customer cần đăng nhập
router.use(authenticateToken);

router.get("/", CustomerController.getAllCustomers);
router.post("/", CustomerController.createCustomer);
router.get("/:id", CustomerController.getCustomerById);
router.put("/:id", CustomerController.updateCustomer);
router.delete("/:id", CustomerController.deleteCustomer);

export default router;
