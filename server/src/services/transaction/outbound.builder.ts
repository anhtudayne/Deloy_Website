import { TransactionType, TransactionStatus, Prisma } from "@prisma/client";

export interface OutboundItemDTO {
  productId: number;
  sellingPrice: number;
  imeiList: string[];
}

export class OutboundTransactionBuilder {
  private type: TransactionType = TransactionType.OUTBOUND;
  private status: TransactionStatus = TransactionStatus.PENDING;
  private createdBy!: number;
  private sourceWarehouseId!: number;
  private totalAmount: number = 0;
  private items: OutboundItemDTO[] = [];
  private notes?: string;
  private code!: string;
  private customerId?: number;

  constructor() {
    this.code = `OUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  public setCreator(userId: number) {
    this.createdBy = userId;
    return this;
  }

  public setSourceWarehouse(warehouseId: number) {
    this.sourceWarehouseId = warehouseId;
    return this;
  }

  public setCustomer(id?: number) {
    this.customerId = id;
    return this;
  }

  public setItems(items: OutboundItemDTO[]) {
    this.items = items;
    this.calculateTotal();
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

  private calculateTotal() {
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + item.sellingPrice * item.imeiList.length;
    }, 0);
  }

  public build() {
    return {
      code: this.code,
      type: this.type,
      status: this.status,
      created_by: this.createdBy,
      source_warehouse_id: this.sourceWarehouseId,
      customer_id: this.customerId,
      total_amount: this.totalAmount,
    };
  }

  public getItems() {
    return this.items;
  }
}
