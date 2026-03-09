import { db as prisma } from "../../utils/database";
import { ITransactionStrategy } from "./transaction.strategy";
import { TransactionState } from "./transaction.state";
import { TransactionStatus, ProductItemStatus, InventoryStatus } from "@prisma/client";

export interface TransferConfirmInputData {
  userId: number;
  transactionId: number;
  warehouseId: number;
}

export class TransferConfirmStrategy implements ITransactionStrategy<TransferConfirmInputData, any> {
  public async execute(data: TransferConfirmInputData): Promise<any> {
    const { userId, transactionId, warehouseId } = data;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        details: {
          include: {
            imeis: true
          }
        }
      }
    });

    if (!transaction) {
      throw { statusCode: 404, message: "Không tìm thấy phiếu chuyển kho." };
    }

    if (transaction.type !== 'TRANSFER') {
      throw { statusCode: 400, message: "Giao dịch không phải là phiếu chuyển kho." };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw { statusCode: 400, message: `Phiếu ở trạng thái ${transaction.status}, không thể xác nhận.` };
    }

    const destWarehouseId = transaction.dest_warehouse_id;
    if (!destWarehouseId) {
      throw { statusCode: 400, message: "Phiếu chuyển kho không có kho đích." };
    }

    if (destWarehouseId !== warehouseId) {
      throw { statusCode: 403, message: "Bạn không có quyền xác nhận phiếu cho kho đích này." };
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Collect product item ids and quantities
      const productItemIds: number[] = [];
      const productQuantities: Record<number, number> = {};

      for (const detail of transaction.details) {
        if (!detail.product_id) continue;
        
        const q = detail.quantity;
        productQuantities[detail.product_id] = (productQuantities[detail.product_id] || 0) + q;

        for (const ti of detail.imeis) {
          if (ti.product_item_id) {
            productItemIds.push(ti.product_item_id);
          }
        }
      }

      // 1. Update ProductItems: status -> IN_STOCK, warehouse_id -> destWarehouseId
      if (productItemIds.length > 0) {
         await tx.productItem.updateMany({
           where: { id: { in: productItemIds } },
           data: { 
             status: 'IN_STOCK' as any,
             warehouse_id: destWarehouseId
           }
         });
      }

      // 2. Update Inventory Dest
      for (const [productIdStr, quantity] of Object.entries(productQuantities)) {
        const productId = parseInt(productIdStr, 10);

        // Giảm IN_TRANSIT
        const inTransitRecord = await tx.inventory.findFirst({
           where: {
             warehouse_id: destWarehouseId,
             product_id: productId,
             status: 'IN_TRANSIT' as any
           }
        });

        if (inTransitRecord) {
           await tx.inventory.update({
             where: { id: inTransitRecord.id },
             data: { quantity: { decrement: quantity } }
           });
        }

        // Tăng READY_TO_SELL
        const readyRecord = await tx.inventory.findFirst({
           where: {
             warehouse_id: destWarehouseId,
             product_id: productId,
             status: 'READY_TO_SELL' as any
           }
        });

        if (readyRecord) {
           await tx.inventory.update({
             where: { id: readyRecord.id },
             data: { quantity: { increment: quantity } }
           });
        } else {
           await tx.inventory.create({
             data: {
               warehouse_id: destWarehouseId,
               product_id: productId,
               status: 'READY_TO_SELL' as any,
               quantity: quantity
             }
           });
        }
      }

      // 3. Update Transaction Status and Confirmed info
      const transactionState = new TransactionState(TransactionStatus.PENDING);
      transactionState.toCompleted();

      const finalTx = await tx.transaction.update({
        where: { id: transactionId },
        data: { 
          status: transactionState.getStatus(),
          confirmed_by: userId,
          confirmed_at: new Date()
        }
      });

      return finalTx;
    });

    return result;
  }
}
