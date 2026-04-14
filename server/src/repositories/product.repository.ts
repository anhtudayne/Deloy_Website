/**
 * PRODUCT REPOSITORY - DATA ACCESS LAYER
 * =========================================
 * Repository chịu trách nhiệm giao tiếp với DB qua Prisma (Singleton).
 * Không chứa business logic, chỉ có CRUD và query.
 */

import { prisma } from '../config/database';
import { InventoryStatus, ProductItemStatus } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ProductWithInventory } from '../types/product.types';

class ProductRepository {
  /**
   * Lấy danh sách sản phẩm với filter và pagination.
   * Bao gồm: category và inventory tổng hợp.
   */
  async findAll(query: ProductQueryDto): Promise<ProductWithInventory[]> {
    const { category_id, warehouse_id, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    return prisma.product.findMany({
      where: {
        ...(category_id ? { category_id } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
              ],
            }
          : {}),
        ...(warehouse_id
          ? {
              inventory: {
                some: { warehouse_id },
              },
            }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        inventory: {
          where: warehouse_id ? { warehouse_id } : {},
          select: {
            id: true,
            warehouse_id: true,
            quantity: true,
            status: true,
          },
        },
        product_items: {
          where: warehouse_id ? { warehouse_id } : {},
          select: {
            id: true,
            imei_serial: true,
            status: true,
            warehouse_id: true,
          },
          take: 10,
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }) as unknown as ProductWithInventory[];
  }

  /**
   * Tìm sản phẩm theo ID.
   */
  async findById(id: number): Promise<ProductWithInventory | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        inventory: {
          select: {
            id: true,
            warehouse_id: true,
            quantity: true,
            status: true,
          },
        },
        product_items: {
          select: {
            id: true,
            imei_serial: true,
            status: true,
            warehouse_id: true,
          },
          take: 20,
        },
      },
    }) as unknown as ProductWithInventory | null;
  }

  /**
   * Tìm sản phẩm theo SKU.
   */
  async findBySku(sku: string): Promise<{ id: number; sku: string } | null> {
    return prisma.product.findUnique({
      where: { sku },
      select: { id: true, sku: true },
    });
  }

  /**
   * Tạo sản phẩm mới (chỉ save vào bảng products).
   * Việc tạo Inventory sẽ do ProductFacade đảm nhận.
   */
  async create(dto: Omit<CreateProductDto, 'warehouse_id'>): Promise<{ id: number; name: string; sku: string }> {
    return prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        category_id: dto.category_id,
        image_url: dto.image_url ?? null,
        specifications: dto.specifications as object,
      },
      select: { id: true, name: true, sku: true },
    });
  }

  /**
   * Cập nhật thông tin sản phẩm.
   */
  async update(id: number, dto: UpdateProductDto): Promise<ProductWithInventory> {
    return prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
        ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
        ...(dto.image_url !== undefined ? { image_url: dto.image_url } : {}),
        ...(dto.specifications !== undefined ? { specifications: dto.specifications as object } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        inventory: {
          select: { id: true, warehouse_id: true, quantity: true, status: true },
        },
        product_items: {
          select: {
            id: true,
            imei_serial: true,
            status: true,
            warehouse_id: true,
          },
          take: 20,
        },
      },
    }) as unknown as ProductWithInventory;
  }

  /**
   * Xóa sản phẩm (chỉ Owner/Manager).
   */
  async delete(id: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { product_id: id } });
      await tx.productItem.deleteMany({ where: { product_id: id } });
      await tx.product.delete({ where: { id } });
    });
  }

  /**
   * Kiểm tra sản phẩm đã phát sinh dữ liệu giao dịch hay chưa.
   * Nếu đã phát sinh lịch sử, không cho xóa cứng để tránh mất tính toàn vẹn dữ liệu.
   */
  async hasDeleteDependencies(id: number): Promise<boolean> {
    const [detailCount, imeiTraceCount] = await Promise.all([
      prisma.transactionDetail.count({ where: { product_id: id } }),
      prisma.transactionImei.count({
        where: {
          product_item: {
            product_id: id,
          },
        },
      }),
    ]);

    return detailCount > 0 || imeiTraceCount > 0;
  }

  /**
   * Khởi tạo bản ghi Inventory ban đầu cho sản phẩm tại một kho.
   * Được gọi bởi ProductFacade sau khi tạo Product.
   */
  async createInitialInventory(productId: number, warehouseId: number): Promise<void> {
    // Dùng upsert để tránh duplicate nếu bản ghi đã tồn tại
    await prisma.inventory.upsert({
      where: {
        warehouse_id_product_id_status: {
          warehouse_id: warehouseId,
          product_id: productId,
          status: 'READY_TO_SELL',
        },
      },
      update: {}, // Không cập nhật nếu đã tồn tại
      create: {
        warehouse_id: warehouseId,
        product_id: productId,
        quantity: 0,
        status: 'READY_TO_SELL',
      },
    });
  }

  /**
   * Thống kê số lượng sản phẩm và tổng tồn kho theo từng category.
   * Tối ưu: Dùng groupBy ở Prisma level thay vì xử lý trong code.
   */
  async getCategoryStats(warehouseId?: number): Promise<
    Array<{
      category_id: number;
      category_name: string;
      model_count: number;    // Rename from product_count
      total_quantity: number;
      sold_count: number;
    }>
  > {
    const productSelect = {
      id: true,
      inventory: {
        where: {
          status: InventoryStatus.READY_TO_SELL,
          ...(warehouseId ? { warehouse_id: warehouseId } : {}),
        },
        select: { quantity: true },
      },
      product_items: {
        where: {
          status: ProductItemStatus.SOLD,
          ...(warehouseId ? { warehouse_id: warehouseId } : {}),
        },
        select: { id: true }
      }
    };

    // Query category gốc + category con để thống kê theo "nhóm cha"
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { products: { some: {} } }, // Có product gắn trực tiếp
          { children: { some: { products: { some: {} } } } }, // Hoặc có product ở category con
        ],
        parent_id: null,        // Chỉ lấy category gốc
      },
      select: {
        id: true,
        name: true,
        products: { select: productSelect },
        children: {
          select: {
            id: true,
            products: { select: productSelect },
          },
        },
      },
    });

    return categories.map((cat: any) => {
      // Gom products từ category cha + tất cả category con
      const groupedProducts = [
        ...cat.products,
        ...cat.children.flatMap((child: any) => child.products),
      ];

      // Đếm các Model (Products) có tồn kho hoặc có lịch sử bán
      const activeModels = groupedProducts.filter((p: any) => p.inventory.length > 0 || p.product_items.length > 0);
      return {
        category_id: cat.id,
        category_name: cat.name,
        model_count: activeModels.length,
        total_quantity: activeModels.reduce(
          (sum: number, p: any) =>
            sum + p.inventory.reduce((s: number, inv: any) => s + inv.quantity, 0),
          0
        ),
        sold_count: groupedProducts.reduce(
          (sum: number, p: any) => sum + p.product_items.length,
          0
        )
      };
    });
  }

  /**
   * Lấy danh sách tất cả Category (dùng cho form dropdown).
   */
  async findAllCategories(): Promise<Array<{ id: number; name: string; parent_id: number | null }>> {
    return prisma.category.findMany({
      select: { id: true, name: true, parent_id: true },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Lấy danh sách tất cả Supplier (dùng cho form dropdown).
   */
  async findAllSuppliers(): Promise<Array<{ id: number; company_name: string }>> {
    return prisma.supplier.findMany({
      select: { id: true, company_name: true },
      orderBy: { company_name: 'asc' },
    });
  }

  /**
   * Lấy danh sách Warehouse (dùng cho form dropdown).
   */
  async findAllWarehouses(): Promise<Array<{ id: number; name: string }>> {
    return prisma.warehouse.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Lấy tất cả warehouse IDs.
   * Dùng bởi ProductFacade để khởi tạo Inventory cho TẤT CẢ kho khi đăng ký Model mới.
   */
  async findAllWarehouseIds(): Promise<number[]> {
    const warehouses = await prisma.warehouse.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return warehouses.map((w) => w.id);
  }

  /**
   * Đếm tổng số sản phẩm (phục vụ pagination).
   * C2 Fix: bao gồm warehouse_id filter để totalPages đúng khi filter theo kho.
   */
  async count(query: Omit<ProductQueryDto, 'page' | 'limit'>): Promise<number> {
    const { category_id, warehouse_id, search } = query; // ← thêm warehouse_id
    return prisma.product.count({
      where: {
        ...(category_id ? { category_id } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
              ],
            }
          : {}),
        ...(warehouse_id // ← thêm điều kiện luọ theo kho
          ? { inventory: { some: { warehouse_id } } }
          : {}),
      },
    });
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
