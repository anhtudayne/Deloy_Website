import { db as prisma } from "../../utils/database";
import {
  ImeiContext,
  ImeiFormatHandler,
  ImeiPayloadDuplicateHandler,
  ImeiDatabaseDuplicateHandler,
} from "./imei.validator.chain";
import { InboundItemDTO, InboundTransactionBuilder } from "./inbound.builder";
import { TransactionState } from "./transaction.state";
import { TransactionStatus, ProductItemStatus, InventoryStatus } from "@prisma/client";

export class InboundTransactionService {
  /**
   * Process inbound transaction using Atomic Transaction
   */
  public async handleInboundTransaction(
    userId: number,
    supplierId: number,
    warehouseId: number,
    notes: string,
    items: InboundItemDTO[]
  ) {
    // 1. Validation Chain cho IMEI
    const imeiFormatHandler = new ImeiFormatHandler();
    const payloadHandler = new ImeiPayloadDuplicateHandler();
    const dbHandler = new ImeiDatabaseDuplicateHandler();

    // Thiết lập chuỗi xử lý
    imeiFormatHandler.setNext(payloadHandler).setNext(dbHandler);

    let allErrors: Record<string, string> = {};
    const validItems: InboundItemDTO[] = [];

    // validate từng item
    for (const item of items) {
      const context: ImeiContext = {
        imeiList: item.imeiList,
        errors: {},
      };

      await imeiFormatHandler.handle(context, prisma);

      allErrors = { ...allErrors, ...context.errors };
      
      // Chỉ giữ lại những imei hợp lệ
      if (context.imeiList.length > 0) {
         validItems.push({
           ...item,
           imeiList: context.imeiList,
         });
      }
    }

    if (Object.keys(allErrors).length > 0) {
      throw {
        statusCode: 400,
        message: "Phát hiện lỗi IMEI vi phạm.",
        details: allErrors,
      };
    }

    if (validItems.length === 0) {
       throw { statusCode: 400, message: "Không có IMEI nào hợp lệ để nhập vào." };
    }

    // 2. State & Builder
    const transactionState = new TransactionState(TransactionStatus.DRAFT);
    transactionState.toPending();

    const builder = new InboundTransactionBuilder();
    builder
      .setCreator(userId)
      .setDestinationWarehouse(warehouseId)
      .setSupplier(supplierId)
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
         // 3.2 Create Details
         const detail = await tx.transactionDetail.create({
           data: {
             transaction_id: transaction.id,
             product_id: item.productId,
             quantity: item.imeiList.length,
             unit_price: item.unitPrice,
           }
         });

         // 3.3 Create ProductItems (hàng loạt)
         const productItemsData = item.imeiList.map((imei: string) => ({
           product_id: item.productId,
           warehouse_id: warehouseId,
           imei_serial: imei,
           status: ProductItemStatus.IN_STOCK
         }));
         
         await tx.productItem.createMany({
           data: productItemsData
         });

         // get the created product items to map to transaction_imei
         const createdItems = await tx.productItem.findMany({
           where: {
             imei_serial: {
               in: item.imeiList
             }
           }
         });

         const txImeis = createdItems.map((p: any) => ({
            transaction_detail_id: detail.id,
            product_item_id: p.id
         }));

         // 3.4 Create TransactionImei
         await tx.transactionImei.createMany({
            data: txImeis
         });

         // 3.5 Upsert Inventory
         const inventoryRecord = await tx.inventory.findFirst({
           where: {
             warehouse_id: warehouseId,
             product_id: item.productId,
             status: InventoryStatus.READY_TO_SELL
           }
         });

         if (inventoryRecord) {
           await tx.inventory.update({
             where: { id: inventoryRecord.id },
             data: { quantity: { increment: item.imeiList.length } }
           });
         } else {
           await tx.inventory.create({
             data: {
               warehouse_id: warehouseId,
               product_id: item.productId,
               status: InventoryStatus.READY_TO_SELL,
               quantity: item.imeiList.length
             }
           });
         }
      }

      // Update State to COMPLETED
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

export const inboundTransactionService = new InboundTransactionService();
