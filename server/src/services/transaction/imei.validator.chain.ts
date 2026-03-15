import { PrismaClient } from "@prisma/client";

export interface ImeiContext {
  imeiList: string[];
  errors: Record<string, string>; // IMEI -> Error message
}

export abstract class ImeiValidationHandler {
  protected nextHandler?: ImeiValidationHandler;

  public setNext(handler: ImeiValidationHandler): ImeiValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(context: ImeiContext, prisma: PrismaClient): Promise<void> {
    await this.process(context, prisma);
    if (this.nextHandler && context.imeiList.length > 0) {
      await this.nextHandler.handle(context, prisma);
    }
  }

  protected abstract process(context: ImeiContext, prisma: PrismaClient): Promise<void>;
}

// Step 1: Format Regex Check
export class ImeiFormatHandler extends ImeiValidationHandler {
  protected async process(context: ImeiContext, prisma: PrismaClient): Promise<void> {
    const regex = /^[A-Za-z0-9]{10,20}$/; // Giả định định dạng hợp lệ
    const invalidImeis = context.imeiList.filter((imei) => !regex.test(imei));
    
    invalidImeis.forEach((imei) => {
      context.errors[imei] = "Định dạng IMEI không hợp lệ";
    });

    // Bỏ qua các IMEI lỗi ở bước tiếp theo
    context.imeiList = context.imeiList.filter((imei) => regex.test(imei));
  }
}

// Step 2: Check duplicates in the uploaded list
export class ImeiPayloadDuplicateHandler extends ImeiValidationHandler {
  protected async process(context: ImeiContext, prisma: PrismaClient): Promise<void> {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const imei of context.imeiList) {
      if (seen.has(imei)) {
        duplicates.add(imei);
        context.errors[imei] = "IMEI trùng lặp trong file CSV";
      } else {
        seen.add(imei);
      }
    }

    context.imeiList = context.imeiList.filter((imei) => !duplicates.has(imei));
  }
}

// Step 3: Check duplicates in Database
export class ImeiDatabaseDuplicateHandler extends ImeiValidationHandler {
  protected async process(context: ImeiContext, prisma: PrismaClient): Promise<void> {
    if (context.imeiList.length === 0) return;

    const existingItems = await prisma.productItem.findMany({
      where: {
        imei_serial: {
          in: context.imeiList,
        },
      },
      select: { imei_serial: true },
    });

    existingItems.forEach((item) => {
      context.errors[item.imei_serial] = "IMEI đã tồn tại trong hệ thống";
    });

    const existingImeis = new Set(existingItems.map((i) => i.imei_serial));
    context.imeiList = context.imeiList.filter((imei) => !existingImeis.has(imei));
  }
}
