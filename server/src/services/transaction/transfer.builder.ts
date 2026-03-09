import { TransactionType, TransactionStatus, Prisma } from "@prisma/client";

export interface TransferItemDTO {
  productId: number;
  imeiList: string[];
}

export class TransferTransactionBuilder {
  private type: TransactionType = TransactionType.TRANSFER;
  private status: TransactionStatus = TransactionStatus.PENDING;
  private createdBy!: number;
  private sourceWarehouseId!: number;
  private destWarehouseId!: number;
  private items: TransferItemDTO[] = [];
  private notes?: string;
  private code!: string;

  constructor() {
    this.code = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  public setCreator(userId: number) {
    this.createdBy = userId;
    return this;
  }

  public setSourceWarehouse(warehouseId: number) {
    this.sourceWarehouseId = warehouseId;
    return this;
  }

  public setDestWarehouse(warehouseId: number) {
    this.destWarehouseId = warehouseId;
    return this;
  }

  public setItems(items: TransferItemDTO[]) {
    this.items = items;
    return this;
  }

  public setNotes(notes?: string) {
    this.notes = notes;
    return this;
  }

  public setStatus(status: TransactionStatus) {
    this.status = status;
    return this;
  }

  public build() {
    return {
      code: this.code,
      type: this.type,
      status: this.status,
      created_by: this.createdBy,
      source_warehouse_id: this.sourceWarehouseId,
      dest_warehouse_id: this.destWarehouseId,
      total_amount: 0,
    };
  }

  public getItems() {
    return this.items;
  }
}
