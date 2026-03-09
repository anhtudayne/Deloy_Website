import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/database';

export const authorizeWarehouseAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const requestedWarehouseIdStr = req.query.warehouse_id as string;
    const requestedWarehouseId = requestedWarehouseIdStr ? Number(requestedWarehouseIdStr) : undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User missing' });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (user?.role?.name === 'Admin') {
      (req as any).allowedWarehouseId = requestedWarehouseId;
      return next();
    }

    const userWarehouses = await db.userWarehouse.findMany({
      where: { user_id: userId }
    });
    
    const assignedIds = userWarehouses.map(uw => uw.warehouse_id);

    if (requestedWarehouseId) {
      if (!assignedIds.includes(requestedWarehouseId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this warehouse' });
      }
      (req as any).allowedWarehouseId = requestedWarehouseId;
    } else {
      // If Admin and no specific warehouse requested, let them see all (undefined allowedWarehouseId)
      if (user?.role?.name === 'Admin') {
        (req as any).allowedWarehouseId = undefined;
      } else {
        if (assignedIds.length === 0) {
          return res.status(403).json({ error: 'Forbidden: No assigned warehouses' });
        }
        (req as any).allowedWarehouseId = assignedIds[0];
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error enforcing warehouse proxy access' });
  }
};
