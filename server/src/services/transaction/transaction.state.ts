import { TransactionStatus } from "@prisma/client";

export class TransactionState {
  private status: TransactionStatus;

  constructor(initialStatus: TransactionStatus = TransactionStatus.DRAFT) {
    this.status = initialStatus;
  }

  public getStatus(): TransactionStatus {
    return this.status;
  }

  public toPending(): void {
    if (this.status !== TransactionStatus.DRAFT) {
      throw new Error(`Cannot transition to PENDING from ${this.status}`);
    }
    this.status = TransactionStatus.PENDING;
  }

  public toCompleted(): void {
    if (this.status !== TransactionStatus.PENDING) {
      throw new Error(`Cannot transition to COMPLETED from ${this.status}`);
    }
    this.status = TransactionStatus.COMPLETED;
  }

  public toCancelled(): void {
    this.status = TransactionStatus.CANCELLED;
  }
}
