import { db } from '../utils/database';
import { InventoryStatus, TransactionType, TransactionStatus } from '@prisma/client';

export interface HealthCalculationStrategy {
  calculateHealth(warehouseId?: number): Promise<any>;
}

export class ProcessSpeedStrategy implements HealthCalculationStrategy {
  async calculateHealth(warehouseId?: number) {
    const filter = warehouseId ? { source_warehouse_id: warehouseId } : {};
    
    const transactions = await db.transaction.count({
      where: {
        ...filter,
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      metric: "Process Speed",
      value: `${transactions} tx/week`,
      status: transactions >= 5 ? "Good" : "Needs Improvement",
      details: { transactions }
    };
  }
}

export class DefectRateStrategy implements HealthCalculationStrategy {
  async calculateHealth(warehouseId?: number) {
    const filter = warehouseId ? { warehouse_id: warehouseId } : {};
    
    const totalInventoryAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: filter
    });
    
    const defectiveInventoryAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: { ...filter, status: InventoryStatus.DEFECTIVE }
    });

    const total = totalInventoryAgg._sum.quantity || 0;
    const defective = defectiveInventoryAgg._sum.quantity || 0;
    const rate = total === 0 ? 0 : (defective / total) * 100;

    return {
      metric: "Defect Rate",
      value: `${rate.toFixed(2)}%`,
      status: rate < 5 ? "Good" : (rate < 15 ? "Warning" : "Critical"),
      details: { total, defective, rate }
    };
  }
}

export class StorageDensityStrategy implements HealthCalculationStrategy {
  async calculateHealth(warehouseId?: number) {
    const invFilter = warehouseId ? { warehouse_id: warehouseId } : {};
    
    const totalInventoryAgg = await db.inventory.aggregate({
      _sum: { quantity: true },
      where: invFilter
    });
    const totalQuantity = totalInventoryAgg._sum.quantity || 0;

    let totalCapacity = 0;
    if (warehouseId) {
      const wh = await db.warehouse.findUnique({ where: { id: warehouseId } });
      totalCapacity = wh?.capacity || 0;
    } else {
      const capAgg = await db.warehouse.aggregate({ _sum: { capacity: true } });
      totalCapacity = capAgg._sum.capacity || 0;
    }

    const density = totalCapacity === 0 ? 0 : (totalQuantity / totalCapacity) * 100;

    return {
      metric: "Storage Density",
      value: `${density.toFixed(1)}%`,
      status: density < 70 ? "Good" : (density < 90 ? "Warning" : "Critical"),
      details: { totalQuantity, totalCapacity, density }
    };
  }
}
