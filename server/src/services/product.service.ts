/**
 * PRODUCT SERVICE - BUSINESS LOGIC LAYER
 * =========================================
 * Service điều phối toàn bộ logic nghiệp vụ:
 * - Gọi Facade để tạo sản phẩm (Create)
 * - Gọi Repository trực tiếp cho các thao tác đơn giản (Get/Update/Delete)
 * - Tổng hợp stats cho Dashboard
 *
 * Không biết gì về HTTP. Không biết gì về Database syntax.
 */

import { productRepository } from '../repositories/product.repository';
import { productFacade } from './product.facade';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductWithInventory,
  ProductStatsDto,
  CategoryStatsDto,
} from '../types/product.types';

export class ProductNotFoundError extends Error {
  constructor(id: number) {
    super(`Sản phẩm với ID #${id} không tồn tại.`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductInUseError extends Error {
  constructor(id: number) {
    super(`Sản phẩm #${id} đã phát sinh giao dịch/IMEI, không thể xóa cứng.`);
    this.name = 'ProductInUseError';
  }
}

// Re-export errors từ facade để controller import một chỗ
export { DuplicateSkuError, InvalidCategoryError, InvalidWarehouseError, SpecificationValidationError } from './product.facade';

class ProductService {
  /**
   * Tạo sản phẩm mới.
   * Delegate toàn bộ complexity cho ProductFacade.
   */
  async createProduct(dto: CreateProductDto): Promise<ProductWithInventory> {
    return productFacade.createProduct(dto);
  }

  /**
   * Lấy danh sách sản phẩm với filter và pagination.
   */
  async getProducts(query: ProductQueryDto): Promise<{
    data: ProductWithInventory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await Promise.all([
      productRepository.findAll(query),
      productRepository.count(query),
    ]);

    return {
      data,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    };
  }

  /**
   * Lấy chi tiết một sản phẩm theo ID.
   */
  async getProductById(id: number): Promise<ProductWithInventory> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }

  /**
   * Cập nhật sản phẩm.
   */
  async updateProduct(id: number, dto: UpdateProductDto): Promise<ProductWithInventory> {
    // Kiểm tra product tồn tại
    await this.getProductById(id);
    return productRepository.update(id, dto);
  }

  /**
   * Xóa sản phẩm.
   */
  async deleteProduct(id: number): Promise<void> {
    await this.getProductById(id);
    const inUse = await productRepository.hasDeleteDependencies(id);
    if (inUse) {
      throw new ProductInUseError(id);
    }
    await productRepository.delete(id);
  }

  /**
   * Lấy thống kê số lượng và tổng tồn kho theo danh mục.
   * Dùng để render 3 ô thống kê ở Dashboard và ProductPage.
   *
   * H3 Fix: dùng ProductFactory.getSupportedCategories() thay vì hard-code
   * → tân thủ Open/Closed Principle (thêm category mới chỉ cần thêm Creator mới trong Factory)
   */
  async getProductStats(warehouseId?: number): Promise<ProductStatsDto> {
    const rawStats = await productRepository.getCategoryStats(warehouseId);

    const repairMojibake = (name: string) => {
      try {
        const repaired = Buffer.from(name, 'latin1').toString('utf8');
        return repaired.includes('�') ? name : repaired;
      } catch {
        return name;
      }
    };

    const normalize = (name: string) =>
      repairMojibake(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const findByAliases = (
      aliases: string[],
      fallbackName: string,
      fallbackCategoryId?: number,
    ): CategoryStatsDto => {
      const normalizedAliases = aliases.map(normalize);
      const row =
        rawStats.find((r) => normalizedAliases.includes(normalize(r.category_name))) ??
        (fallbackCategoryId != null
          ? rawStats.find((r) => r.category_id === fallbackCategoryId)
          : undefined);
      return {
        category_name: row?.category_name ?? fallbackName,
        category_id: row?.category_id ?? (fallbackCategoryId ?? 0),
        model_count: row?.model_count ?? 0,    // Updated from product_count
        total_quantity: row?.total_quantity ?? 0,
        sold_count: row?.sold_count ?? 0,
      };
    };

    const phones = findByAliases(['Điện thoại', 'Phone'], 'Điện thoại', 1);
    const laptops = findByAliases(['Laptop'], 'Laptop', 2);
    const accessories = findByAliases(['Phụ kiện', 'Accessory'], 'Phụ kiện', 3);

    const total_models = rawStats.reduce((s, r) => s + r.model_count, 0); // Rename from total_products
    const total_quantity = rawStats.reduce((s, r) => s + r.total_quantity, 0);

    return { phones, laptops, accessories, total_models, total_quantity };
  }

  /**
   * Helper: Lấy danh sách categories, suppliers, warehouses cho form.
   */
  async getFormOptions(): Promise<{
    categories: Array<{ id: number; name: string; parent_id: number | null }>;
    warehouses: Array<{ id: number; name: string }>;
  }> {
    const [categories, warehouses] = await Promise.all([
      productRepository.findAllCategories(),
      productRepository.findAllWarehouses(),
    ]);
    return { categories, warehouses };
  }
}

// Export singleton instance
export const productService = new ProductService();
