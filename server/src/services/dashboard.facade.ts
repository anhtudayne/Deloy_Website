import { db } from '../utils/database';
import { HealthCalculationStrategy, DefectRateStrategy, ProcessSpeedStrategy, StorageDensityStrategy } from './dashboard.strategy';
import { InventoryStatus, TransactionType, TransactionStatus } from '@prisma/client';

export class DashboardFacade {
  
  public async getStats(warehouseId?: number) {
    const filter = warehouseId ? { warehouse_id: warehouseId } : {};
    
    // total models: distinct products (Models) registered in inventory for this warehouse
    const totalModelsList = await db.inventory.findMany({
      where: filter,
      select: { product_id: true },
      distinct: ['product_id']
    });
    const totalModels = totalModelsList.length;

    const inventoryAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: { ...filter, status: InventoryStatus.READY_TO_SELL }
    });
    const totalStock = inventoryAgg._sum.quantity || 0;
    
    const defectiveAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: { ...filter, status: InventoryStatus.DEFECTIVE }
    });
    const defective = defectiveAgg._sum.quantity || 0;

    const inventoryByCategoryRaw = await db.inventory.findMany({
      where: { ...filter, status: InventoryStatus.READY_TO_SELL },
      include: {
        product: { select: { category: { select: { name: true } } } }
      }
    });

    const categoryStock: Record<string, number> = {};
    for (const item of inventoryByCategoryRaw) {
      const cname = item.product?.category?.name;
      if (cname) {
        categoryStock[cname] = (categoryStock[cname] || 0) + item.quantity;
      }
    }

    // New: Count Pending Inbound Transactions
    const inboundPending = await db.transaction.count({
      where: {
        ...(warehouseId ? { dest_warehouse_id: warehouseId } : {}),
        type: TransactionType.INBOUND,
        status: TransactionStatus.PENDING
      }
    });

    // New: Count Sold Items by Category
    const soldByCategoryRaw = await db.productItem.findMany({
      where: {
        ...(warehouseId ? { warehouse_id: warehouseId } : {}),
        status: 'SOLD'
      },
      include: {
        product: { select: { category: { select: { name: true } } } }
      }
    });

    const categorySold: Record<string, number> = {};
    for (const item of soldByCategoryRaw) {
      const cname = item.product?.category?.name;
      if (cname) {
        categorySold[cname] = (categorySold[cname] || 0) + 1;
      }
    }

    // New: Calculate Storage Density using Strategy
    const storageDensityStrategy = new StorageDensityStrategy();
    const densityResult = await storageDensityStrategy.calculateHealth(warehouseId);

    const inTransitAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: { ...filter, status: InventoryStatus.IN_TRANSIT }
    });
    const inTransit = inTransitAgg._sum.quantity || 0;

    return {
      totalModels, // Updated name
      totalStock,
      defective,
      inTransit,
      readyToSell: totalStock - defective,
      categoryStock,
      categorySold,
      inboundPending,
      storageDensity: densityResult
    };
  }

  public async getHealth(warehouseId?: number, strategyType: 'speed' | 'defect' | 'density' = 'defect') {
    let strategy: HealthCalculationStrategy;
    if (strategyType === 'speed') {
      strategy = new ProcessSpeedStrategy();
    } else if (strategyType === 'density') {
      strategy = new StorageDensityStrategy();
    } else {
      strategy = new DefectRateStrategy();
    }
    return await strategy.calculateHealth(warehouseId);
  }

  public async getActivities(warehouseId?: number) {
    const filter = warehouseId ? {
      OR: [
        { source_warehouse_id: warehouseId },
        { dest_warehouse_id: warehouseId }
      ]
    } : {};

    return await db.transaction.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        creator: { select: { full_name: true } }
      }
    });
  }

  public async getAlerts(warehouseId?: number) {
    const filter = warehouseId ? { warehouse_id: warehouseId } : {};
    
    const lowStockItems = await db.inventory.findMany({
      where: {
        ...filter,
        status: InventoryStatus.READY_TO_SELL,
        quantity: { lt: 10, gt: 0 }
      },
      include: { product: true }
    });

    const outOfStockItems = await db.inventory.findMany({
      where: {
        ...filter,
        status: InventoryStatus.READY_TO_SELL,
        quantity: 0
      },
      include: { product: true }
    });

    const alerts = [
      ...lowStockItems.map(item => ({
        message: `Low stock for ${item.product?.name}: only ${item.quantity} left`,
        level: 'WARNING',
        type: 'LOW_STOCK'
      })),
      ...outOfStockItems.map(item => ({
        message: `Out of stock for ${item.product?.name}`,
        level: 'CRITICAL',
        type: 'OUT_OF_STOCK'
      }))
    ];

    return alerts;
  }
}
