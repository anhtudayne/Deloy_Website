import { db as prisma } from "../../utils/database";
import { ITransactionStrategy } from "./transaction.strategy";
import { OutboundItemDTO, OutboundTransactionBuilder } from "./outbound.builder";
import { OutboundImeiContext, ImeiExistenceHandler, ImeiWarehouseMatchHandler, ImeiStatusMatchHandler } from "./outbound.imei.validator";
import { TransactionState } from "./transaction.state";
import { TransactionStatus, ProductItemStatus, InventoryStatus } from "@prisma/client";

export interface OutboundInputData {
  userId: number;
  warehouseId: number;
  customerId?: number;
  notes?: string;
  items: OutboundItemDTO[];
}

export class OutboundStrategy implements ITransactionStrategy<OutboundInputData, any> {
  public async execute(data: OutboundInputData): Promise<any> {
    const { userId, warehouseId, customerId, notes, items } = data;

    // 1. Chain of Responsibility for IMEI
    const existenceHandler = new ImeiExistenceHandler();
    const warehouseHandler = new ImeiWarehouseMatchHandler();
    const statusHandler = new ImeiStatusMatchHandler();

    existenceHandler.setNext(warehouseHandler).setNext(statusHandler);

    let allErrors: Record<string, string> = {};
    const validItems: OutboundItemDTO[] = [];
    const validDbProductItems: any[] = [];

    for (const item of items) {
      const context: OutboundImeiContext = {
        warehouseId,
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
        message: "Phát hiện lỗi IMEI vi phạm điều kiện xuất kho.",
        details: allErrors,
      };
    }

    if (validItems.length === 0) {
      throw { statusCode: 400, message: "Không có IMEI nào hợp lệ để xuất kho." };
    }

    // 2. Builder & State
    const transactionState = new TransactionState(TransactionStatus.DRAFT);
    transactionState.toPending();

    const builder = new OutboundTransactionBuilder();
    builder
      .setCreator(userId)
      .setSourceWarehouse(warehouseId)
      .setCustomer(customerId)
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
            unit_price: item.sellingPrice,
          }
        });

        // get product_item IDs for mapping
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

        // 3.4 Update ProductItems status -> SOLD
        await tx.productItem.updateMany({
          where: { id: { in: productItemIds } },
          data: { status: ProductItemStatus.SOLD }
        });

        // 3.5 Deduct Inventory
        const inventoryRecord = await tx.inventory.findFirst({
           where: {
             warehouse_id: warehouseId,
             product_id: item.productId,
             status: InventoryStatus.READY_TO_SELL
           }
        });

        if (!inventoryRecord || inventoryRecord.quantity < item.imeiList.length) {
           throw { 
             statusCode: 400, 
             message: `Kho không đủ số lượng cho sản phẩm ID: ${item.productId}. Hiện có: ${inventoryRecord?.quantity || 0}, Cần xuất: ${item.imeiList.length}` 
           };
        }

        await tx.inventory.update({
          where: { id: inventoryRecord.id },
          data: { quantity: { decrement: item.imeiList.length } }
        });
      }

      transactionState.toCompleted();
      const finalTx = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: transactionState.getStatus() }
      });

      return finalTx;
    });

    return result;
  }
}
