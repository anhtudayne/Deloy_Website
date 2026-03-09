import { db as prisma } from "../../utils/database";
import { ITransactionStrategy } from "./transaction.strategy";
import { TransferItemDTO, TransferTransactionBuilder } from "./transfer.builder";
import { OutboundImeiContext, ImeiExistenceHandler, ImeiWarehouseMatchHandler, ImeiStatusMatchHandler } from "./outbound.imei.validator";
import { TransactionState } from "./transaction.state";
import { TransactionStatus, ProductItemStatus, InventoryStatus } from "@prisma/client";

export interface TransferInputData {
  userId: number;
  sourceWarehouseId: number;
  destWarehouseId: number;
  notes?: string;
  items: TransferItemDTO[];
}

export class TransferStrategy implements ITransactionStrategy<TransferInputData, any> {
  public async execute(data: TransferInputData): Promise<any> {
    const { userId, sourceWarehouseId, destWarehouseId, notes, items } = data;

    if (sourceWarehouseId === destWarehouseId) {
      throw { statusCode: 400, message: "Kho nguồn và kho đích phải khác nhau." };
    }

    // 1. Chain of Responsibility for IMEI (Reusing Outbound validators)
    const existenceHandler = new ImeiExistenceHandler();
    const warehouseHandler = new ImeiWarehouseMatchHandler();
    const statusHandler = new ImeiStatusMatchHandler();

    existenceHandler.setNext(warehouseHandler).setNext(statusHandler);

    let allErrors: Record<string, string> = {};
    const validItems: TransferItemDTO[] = [];
    const validDbProductItems: any[] = [];

    for (const item of items) {
      const context: OutboundImeiContext = {
        warehouseId: sourceWarehouseId,
        productId: item.productId,
        imeiList: item.imeiList,
        errors: {},
        validImeis: [],
      };

      await existenceHandler.handle(context, prisma);

      allErrors = { ...allErrors, ...context.errors };

      if (context.imeiList.length > 0) {
        validItems.push({
          ...item,
          imeiList: context.imeiList,
        });
        validDbProductItems.push(...context.validImeis);
      }
    }

    if (Object.keys(allErrors).length > 0) {
      throw {
        statusCode: 400,
        message: "Phát hiện lỗi IMEI vi phạm điều kiện chuyển kho.",
        details: allErrors,
      };
    }

    if (validItems.length === 0) {
      throw { statusCode: 400, message: "Không có IMEI nào hợp lệ để chuyển kho." };
    }

    // 2. Builder & State
    const transactionState = new TransactionState(TransactionStatus.DRAFT);
    transactionState.toPending();

    const builder = new TransferTransactionBuilder();
    builder
      .setCreator(userId)
      .setSourceWarehouse(sourceWarehouseId)
      .setDestWarehouse(destWarehouseId)
      .setItems(validItems)
      .setNotes(notes)
      .setStatus(transactionState.getStatus());

    const transactionData = builder.build();

    // 3. Atomic Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 3.1 Create Transaction
      const transaction = await tx.transaction.create({
        data: transactionData,
      });

      for (const item of builder.getItems()) {
        // 3.2 Create Transaction Detail
        const detail = await tx.transactionDetail.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            quantity: item.imeiList.length,
            unit_price: 0,
          }
        });

        const productItemIds = validDbProductItems
             .filter(dbItem => item.imeiList.includes(dbItem.imei_serial) && dbItem.product_id === item.productId)
             .map(dbItem => dbItem.id);

        const txImeis = productItemIds.map(pId => ({
          transaction_detail_id: detail.id,
          product_item_id: pId
        }));

        // 3.3 Create Transaction_Imei link
        await tx.transactionImei.createMany({
          data: txImeis
        });

        // 3.4 Update ProductItems status -> IN_TRANSIT
        await tx.productItem.updateMany({
          where: { id: { in: productItemIds } },
          data: { status: 'IN_TRANSIT' as any }
        });

        // 3.5 Deduct Inventory Source (READY_TO_SELL)
        const sourceInventoryRecord = await tx.inventory.findFirst({
           where: {
             warehouse_id: sourceWarehouseId,
             product_id: item.productId,
             status: 'READY_TO_SELL' as any
           }
        });

        if (!sourceInventoryRecord || sourceInventoryRecord.quantity < item.imeiList.length) {
           throw { 
             statusCode: 400, 
             message: `Kho nguồn không đủ số lượng cho sản phẩm ID: ${item.productId}. Cần chuyển: ${item.imeiList.length}` 
           };
        }

        await tx.inventory.update({
          where: { id: sourceInventoryRecord.id },
          data: { quantity: { decrement: item.imeiList.length } }
        });

        // 3.6 Increase Inventory Dest (IN_TRANSIT)
        const destInventoryRecord = await tx.inventory.findFirst({
            where: {
              warehouse_id: destWarehouseId,
              product_id: item.productId,
              status: 'IN_TRANSIT' as any
            }
        });

        if (destInventoryRecord) {
            await tx.inventory.update({
                where: { id: destInventoryRecord.id },
                data: { quantity: { increment: item.imeiList.length } }
            });
        } else {
            await tx.inventory.create({
                data: {
                    warehouse_id: destWarehouseId,
                    product_id: item.productId,
                    status: 'IN_TRANSIT' as any,
                    quantity: item.imeiList.length
                }
            });
        }
      }

      return transaction;
    });

    return result;
  }
}
