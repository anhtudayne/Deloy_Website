import { PrismaClient } from "@prisma/client";

export interface OutboundImeiContext {
  warehouseId: number;
  productId: number; // Thêm productId để query chính xác
  imeiList: string[];
  errors: Record<string, string>;
  validImeis: any[]; // Lưu trữ thông tin imei đã load từ DB để dùng lại
}

export abstract class OutboundImeiValidationHandler {
  protected nextHandler?: OutboundImeiValidationHandler;

  public setNext(handler: OutboundImeiValidationHandler): OutboundImeiValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(context: OutboundImeiContext, prisma: PrismaClient): Promise<void> {
    await this.process(context, prisma);
    if (this.nextHandler && context.imeiList.length > 0) {
      await this.nextHandler.handle(context, prisma);
    }
  }

  protected abstract process(context: OutboundImeiContext, prisma: PrismaClient): Promise<void>;
}

// 1. ExistenceCheck
export class ImeiExistenceHandler extends OutboundImeiValidationHandler {
  protected async process(context: OutboundImeiContext, prisma: PrismaClient): Promise<void> {
    if (context.imeiList.length === 0) return;

    const items = await prisma.productItem.findMany({
      where: {
        imei_serial: { in: context.imeiList },
        product_id: context.productId // Đảm bảo đúng Product
      },
      select: { id: true, imei_serial: true, warehouse_id: true, status: true }
    });

    const foundImeis = new Set(items.map(i => i.imei_serial));

    context.imeiList.forEach(imei => {
      if (!foundImeis.has(imei)) {
        context.errors[imei] = "IMEI không tồn tại hoặc không thuộc sản phẩm này.";
      }
    });

    // Cập nhật ds hợp lệ và data để chain sau dùng
    context.imeiList = context.imeiList.filter(imei => foundImeis.has(imei));
    context.validImeis = items;
  }
}

// 2. WarehouseMatch
export class ImeiWarehouseMatchHandler extends OutboundImeiValidationHandler {
  protected async process(context: OutboundImeiContext, prisma: PrismaClient): Promise<void> {
    const invalidImeis = new Set<string>();

    context.validImeis.forEach(item => {
      if (item.warehouse_id !== context.warehouseId) {
        context.errors[item.imei_serial] = `IMEI thuộc kho khác (#${item.warehouse_id}), không thể xuất.`;
        invalidImeis.add(item.imei_serial);
      }
    });

    context.imeiList = context.imeiList.filter(imei => !invalidImeis.has(imei));
    context.validImeis = context.validImeis.filter(item => !invalidImeis.has(item.imei_serial));
  }
}

// 3. StatusCheck
export class ImeiStatusMatchHandler extends OutboundImeiValidationHandler {
  protected async process(context: OutboundImeiContext, prisma: PrismaClient): Promise<void> {
    const invalidImeis = new Set<string>();

    context.validImeis.forEach(item => {
      // ProductItemStatus.IN_STOCK in model corresponds to READY_TO_SELL requirement
      if (item.status !== "IN_STOCK") {
        context.errors[item.imei_serial] = `IMEI đang ở trạng thái ${item.status}, không thể xuất.`;
        invalidImeis.add(item.imei_serial);
      }
    });

    context.imeiList = context.imeiList.filter(imei => !invalidImeis.has(imei));
    context.validImeis = context.validImeis.filter(item => !invalidImeis.has(item.imei_serial));
  }
}
