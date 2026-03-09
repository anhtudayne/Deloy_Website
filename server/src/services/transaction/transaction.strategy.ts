export interface ITransactionStrategy<TInput, TOutput> {
  execute(data: TInput): Promise<TOutput>;
}

export class TransactionServiceContext<TInput, TOutput> {
  private strategy: ITransactionStrategy<TInput, TOutput>;

  constructor(strategy: ITransactionStrategy<TInput, TOutput>) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: ITransactionStrategy<TInput, TOutput>) {
    this.strategy = strategy;
  }

  public async executeStrategy(data: TInput): Promise<TOutput> {
    return this.strategy.execute(data);
  }
}
