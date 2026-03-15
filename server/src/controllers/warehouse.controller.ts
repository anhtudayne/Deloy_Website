/**
 * WAREHOUSE CONTROLLER - PRESENTATION LAYER
 * ===========================================
 * Controller xử lý HTTP: validate input, gọi service, trả về response.
 * Không chứa business logic.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { warehouseService, WarehouseNotFoundError } from '../services/warehouse.service';

// =============================================
// Zod Schemas
// =============================================
const createWarehouseSchema = z.object({
  name: z.string({ required_error: 'Tên kho là bắt buộc' }).min(1, 'Tên kho không được trống'),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

const assignUserSchema = z.object({
  user_id: z.number({ required_error: 'user_id là bắt buộc' }).int().positive(),
});

// =============================================
// Warehouse Controller
// =============================================
class WarehouseController {
  /**
   * GET /api/warehouses
   * Lấy danh sách tất cả kho hàng (Owner only).
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await warehouseService.getAllWarehouses();
      res.status(200).json({ success: true, data: warehouses });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/warehouses/:id
   * Lấy chi tiết một kho.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id']!, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID kho không hợp lệ' });
        return;
      }
      const warehouse = await warehouseService.getWarehouseById(id);
      res.status(200).json({ success: true, data: warehouse });
    } catch (error) {
      if (error instanceof WarehouseNotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/warehouses
   * Tạo kho mới (Owner only).
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = createWarehouseSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      const warehouse = await warehouseService.createWarehouse(result.data);
      res.status(201).json({
        success: true,
        message: `✦ Tạo kho "${warehouse.name}" thành công!`,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/warehouses/:id
   * Cập nhật kho (Owner only).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id']!, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID kho không hợp lệ' });
        return;
      }
      const result = updateWarehouseSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      const warehouse = await warehouseService.updateWarehouse(id, result.data);
      res.status(200).json({ success: true, message: 'Cập nhật kho thành công', data: warehouse });
    } catch (error) {
      if (error instanceof WarehouseNotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/warehouses/:id
   * Xóa kho (Owner only).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params['id']!, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID kho không hợp lệ' });
        return;
      }
      await warehouseService.deleteWarehouse(id);
      res.status(200).json({ success: true, message: `Đã xóa kho #${id} thành công` });
    } catch (error) {
      if (error instanceof WarehouseNotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/warehouses/:id/users
   * Phân công user vào kho (Owner only).
   */
  async assignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouseId = parseInt(req.params['id']!, 10);
      if (isNaN(warehouseId)) {
        res.status(400).json({ success: false, message: 'ID kho không hợp lệ' });
        return;
      }
      const result = assignUserSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      await warehouseService.assignUser(warehouseId, result.data);
      res.status(200).json({ success: true, message: `Phân công user #${result.data.user_id} vào kho #${warehouseId} thành công` });
    } catch (error) {
      if (error instanceof WarehouseNotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/warehouses/:id/users/:userId
   * Gỡ user khỏi kho (Owner only).
   */
  async removeUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouseId = parseInt(req.params['id']!, 10);
      const userId = parseInt(req.params['userId']!, 10);
      if (isNaN(warehouseId) || isNaN(userId)) {
        res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        return;
      }
      await warehouseService.removeUser(warehouseId, userId);
      res.status(200).json({ success: true, message: `Đã gỡ user #${userId} khỏi kho #${warehouseId}` });
    } catch (error) {
      if (error instanceof WarehouseNotFoundError) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const warehouseController = new WarehouseController();
