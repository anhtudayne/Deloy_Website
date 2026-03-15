/**
 * WAREHOUSE REPOSITORY - DATA ACCESS LAYER
 * ==========================================
 * Repository chịu trách nhiệm giao tiếp với DB qua Prisma (Singleton).
 * Không chứa business logic, chỉ có CRUD và query.
 */

import { prisma } from '../config/database';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseDto } from '../types/warehouse.types';

class WarehouseRepository {
  /**
   * Lấy tất cả kho hàng (kèm danh sách user được phân công).
   */
  async findAll(): Promise<WarehouseDto[]> {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                username: true,
                role: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return warehouses.map((wh) => ({
      id: wh.id,
      name: wh.name,
      address: wh.address,
      capacity: wh.capacity,
      assignedUsers: wh.users.map((uw) => ({
        userId: uw.user.id,
        fullName: uw.user.full_name,
        username: uw.user.username,
        role: uw.user.role?.name ?? 'Unknown',
      })),
    }));
  }

  /**
   * Lấy chi tiết một kho theo ID.
   */
  async findById(id: number): Promise<WarehouseDto | null> {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                username: true,
                role: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!wh) return null;

    return {
      id: wh.id,
      name: wh.name,
      address: wh.address,
      capacity: wh.capacity,
      assignedUsers: wh.users.map((uw) => ({
        userId: uw.user.id,
        fullName: uw.user.full_name,
        username: uw.user.username,
        role: uw.user.role?.name ?? 'Unknown',
      })),
    };
  }

  /**
   * Tạo kho mới.
   */
  async create(dto: CreateWarehouseDto): Promise<WarehouseDto> {
    const wh = await prisma.warehouse.create({
      data: {
        name: dto.name,
        address: dto.address ?? null,
        capacity: dto.capacity ?? null,
      },
      select: { id: true, name: true, address: true, capacity: true },
    });
    return { ...wh, assignedUsers: [] };
  }

  /**
   * Cập nhật thông tin kho.
   */
  async update(id: number, dto: UpdateWarehouseDto): Promise<WarehouseDto | null> {
    const wh = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      },
      select: { id: true, name: true, address: true, capacity: true },
    });
    return { ...wh, assignedUsers: [] };
  }

  /**
   * Xóa kho (chỉ khi không còn Inventory).
   */
  async delete(id: number): Promise<void> {
    await prisma.warehouse.delete({ where: { id } });
  }

  /**
   * Phân công user vào kho (upsert để an toàn khi gọi nhiều lần).
   */
  async assignUser(warehouseId: number, userId: number): Promise<void> {
    await prisma.userWarehouse.upsert({
      where: { user_id_warehouse_id: { user_id: userId, warehouse_id: warehouseId } },
      update: {},
      create: { user_id: userId, warehouse_id: warehouseId },
    });
  }

  /**
   * Gỡ user khỏi kho.
   */
  async removeUser(warehouseId: number, userId: number): Promise<void> {
    await prisma.userWarehouse.delete({
      where: { user_id_warehouse_id: { user_id: userId, warehouse_id: warehouseId } },
    });
  }
}

export const warehouseRepository = new WarehouseRepository();
