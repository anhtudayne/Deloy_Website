import { TransactionType, TransactionStatus } from "@prisma/client";

export interface InboundItemDTO {
  productId: number;
  unitPrice: number;
  imeiList: string[];
}

export class InboundTransactionBuilder {
  private type: TransactionType = TransactionType.INBOUND;
  private status: TransactionStatus = TransactionStatus.PENDING;
  private createdBy!: number;
  private destWarehouseId!: number;
  private totalAmount: number = 0;
  private items: InboundItemDTO[] = [];
  private notes?: string;
  private code!: string;
  private supplierId?: number;

  constructor() {
    this.code = `INB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  public setCreator(userId: number) {
    this.createdBy = userId;
    return this;
  }

  public setDestinationWarehouse(warehouseId: number) {
    this.destWarehouseId = warehouseId;
    return this;
  }

  public setSupplier(supplierId: number) {
    this.supplierId = supplierId;
    return this;
  }

  public setItems(items: InboundItemDTO[]) {
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
      return sum + item.unitPrice * item.imeiList.length;
    }, 0);
  }

  public build() {
    return {
      code: this.code,
      type: this.type,
      status: this.status,
      created_by: this.createdBy,
      dest_warehouse_id: this.destWarehouseId,
      supplier_id: this.supplierId,
      total_amount: this.totalAmount,
    };
  }

  public getItems() {
    return this.items;
  }
}
