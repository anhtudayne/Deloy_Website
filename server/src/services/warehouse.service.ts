/**
 * WAREHOUSE SERVICE - BUSINESS LOGIC LAYER
 * ==========================================
 * Điều phối logic nghiệp vụ cho Warehouse module.
 * Gọi Repository cho DB và ném Custom Errors cho Controller xử lý.
 */

import { warehouseRepository } from '../repositories/warehouse.repository';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseDto, AssignUserDto } from '../types/warehouse.types';

export class WarehouseNotFoundError extends Error {
  constructor(id: number) {
    super(`Kho với ID #${id} không tồn tại.`);
    this.name = 'WarehouseNotFoundError';
  }
}

class WarehouseService {
  /**
   * Lấy danh sách tất cả kho hàng.
   */
  async getAllWarehouses(): Promise<WarehouseDto[]> {
    return warehouseRepository.findAll();
  }

  /**
   * Lấy chi tiết một kho theo ID.
   */
  async getWarehouseById(id: number): Promise<WarehouseDto> {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new WarehouseNotFoundError(id);
    }
    return warehouse;
  }

  /**
   * Tạo kho hàng mới.
   */
  async createWarehouse(dto: CreateWarehouseDto): Promise<WarehouseDto> {
    return warehouseRepository.create(dto);
  }

  /**
   * Cập nhật thông tin kho.
   */
  async updateWarehouse(id: number, dto: UpdateWarehouseDto): Promise<WarehouseDto> {
    // Kiểm tra kho tồn tại trước
    await this.getWarehouseById(id);
    const updated = await warehouseRepository.update(id, dto);
    return updated!;
  }

  /**
   * Xóa kho hàng.
   */
  async deleteWarehouse(id: number): Promise<void> {
    await this.getWarehouseById(id);
    await warehouseRepository.delete(id);
  }

  /**
   * Phân công user vào kho.
   */
  async assignUser(warehouseId: number, dto: AssignUserDto): Promise<void> {
    await this.getWarehouseById(warehouseId);
    await warehouseRepository.assignUser(warehouseId, dto.user_id);
  }

  /**
   * Gỡ user khỏi kho.
   */
  async removeUser(warehouseId: number, userId: number): Promise<void> {
    await this.getWarehouseById(warehouseId);
    await warehouseRepository.removeUser(warehouseId, userId);
  }
}

export const warehouseService = new WarehouseService();
