import { Request, Response } from 'express';
import { DashboardFacade } from '../services/dashboard.facade';

const facade = new DashboardFacade();

export const getStats = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req as any).allowedWarehouseId;
    const stats = await facade.getStats(warehouseId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getHealth = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req as any).allowedWarehouseId;
    const strategy = req.query.strategy as 'speed' | 'defect' || 'defect';
    const health = await facade.getHealth(warehouseId, strategy);
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req as any).allowedWarehouseId;
    const activities = await facade.getActivities(warehouseId);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const warehouseId = (req as any).allowedWarehouseId;
    const alerts = await facade.getAlerts(warehouseId);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};
