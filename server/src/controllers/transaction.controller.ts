import { Request, Response, NextFunction } from "express";
import { inboundTransactionService } from "../services/transaction/inbound.service";
import { RoleName } from "../types/auth.types";
import { db as prisma } from "../utils/database";

export class TransactionController {
  public async handleInboundTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: "Chưa xác thực." });
        return;
      }

      const { supplierId, warehouseId, notes, items } = req.body;

      if (!warehouseId || !items || !Array.isArray(items)) {
         res.status(400).json({ success: false, message: "Dữ liệu payload không hợp lệ." });
         return;
      }

      // Proxy Pattern (RBAC): Kiểm tra quyền hạn Warehouse từ Body
      if (user.role !== RoleName.OWNER) {
        const hasAccess = user.assignedWarehouses.includes(Number(warehouseId));
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: `Bạn không có quyền nhập hàng vào kho #${warehouseId}.`
          });
          return;
        }
      }

      // Gọi service
      const transaction = await inboundTransactionService.handleInboundTransaction(
        user.userId,
        supplierId,
        warehouseId,
        notes,
        items
      );

      res.status(201).json({
        success: true,
        data: transaction,
        message: "Phiếu nhập kho đã hoàn tất thành công.",
      });
    } catch (error: any) {
      if (error.statusCode === 400 && error.details) {
         res.status(400).json({
           success: false,
           message: error.message,
           errors: error.details,
         });
         return;
      }
      next(error);
    }
  }

  public async getPendingTransfers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
         res.status(401).json({ success: false, message: "Chưa xác thực." });
         return;
      }
      
      const warehouseIdStr = req.query.warehouseId as string;
      if (!warehouseIdStr) {
         res.status(400).json({ success: false, message: "Thiếu ID kho." });
         return;
      }
      
      const warehouseId = parseInt(warehouseIdStr, 10);
      
      if (user.role !== RoleName.OWNER) {
        if (!user.assignedWarehouses.includes(warehouseId)) {
          res.status(403).json({ success: false, message: "Bạn không có quyền thao tác trên kho này." });
          return;
        }
      }

      const pendingTransfers = await prisma.transaction.findMany({
         where: {
            type: "TRANSFER",
            status: "PENDING",
            dest_warehouse_id: warehouseId
         },
         include: {
            source_warehouse: true,
            details: {
               include: {
                  product: true,
                  imeis: true
               }
            }
         },
         orderBy: { created_at: "desc" }
      });

      res.status(200).json({
        success: true,
        data: pendingTransfers,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
