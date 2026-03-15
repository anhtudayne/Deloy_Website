/**
 * PRODUCT FACADE - FACADE PATTERN
 * =================================
 * Facade Pattern: Cung cấp một interface đơn giản để đăng ký Model mới,
 * che giấu sự phức tạp của nhiều bước bên trong:
 *
 * Tư duy Master Data: Một Model (Product) là độc lập với kho.
 * Khi đăng ký Model mới, hệ thống tự động khởi tạo Inventory tại TẤT CẢ kho
 * hiện có với quantity=0 và status='READY_TO_SELL'.
 *
 * 1. Validate category_id → lấy tên category (+ tra cứu parent nếu là subcategory)
 * 2. Dùng ProductFactory tạo template + validate cấu trúc spec (Strategy)
 * 3. Kiểm tra SKU duplicate
 * 4. Trong một Prisma Transaction duy nhất:
 *    a. Lưu sản phẩm vào bảng `products`
 *    b. Lấy tất cả warehouse IDs
 *    c. Upsert bản ghi `inventory` cho TẤT CẢ kho (quantity=0, READY_TO_SELL)
 *
 * Client chỉ cần gọi: `productFacade.createProduct(dto)` — không cần biết gì thêm.
 */

import { prisma } from '../config/database';
import { productRepository } from '../repositories/product.repository';
import { ProductFactory } from './product.factory';
import { SpecificationValidatorContext } from './product.validator';
import { CreateProductDto, ProductWithInventory } from '../types/product.types';

// =============================================
// Custom Errors dành riêng cho Product module
// =============================================
export class DuplicateSkuError extends Error {
  constructor(sku: string) {
    super(`Mã SKU "${sku}" đã tồn tại trong hệ thống. Vui lòng chọn mã SKU khác.`);
    this.name = 'DuplicateSkuError';
  }
}

export class InvalidCategoryError extends Error {
  constructor(categoryId: number) {
    super(`Danh mục với ID #${categoryId} không tồn tại.`);
    this.name = 'InvalidCategoryError';
  }
}

export class InvalidWarehouseError extends Error {
  constructor(warehouseId: number) {
    super(`Kho với ID #${warehouseId} không tồn tại.`);
    this.name = 'InvalidWarehouseError';
  }
}

export class SpecificationValidationError extends Error {
  public readonly validationErrors: string[];
  constructor(errors: string[]) {
    super(`Thông số kỹ thuật không hợp lệ: ${errors.join('; ')}`);
    this.name = 'SpecificationValidationError';
    this.validationErrors = errors;
  }
}

// =============================================
// Product Facade
// =============================================
class ProductFacade {
  /**
   * ⭐ Hàm FACADE chính: Đăng ký Model mới (Master Data)
   *
   * Orchestrates:
   * - Factory Method → xác định loại sản phẩm (tự tra cứu parent nếu là subcategory)
   * - Strategy Pattern → validate spec theo category
   * - Prisma Transaction → đảm bảo toàn vẹn dữ liệu
   * - Auto-init Inventory cho TẤT CẢ kho với quantity=0
   */
  async createProduct(dto: Omit<CreateProductDto, 'warehouse_id'>): Promise<ProductWithInventory> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏗️ [Facade] createProduct() initiated for SKU: ${dto.sku}`);
    }

    // ── Bước 1: Validate category tồn tại trong DB ──
    const category = await prisma.category.findUnique({
      where: { id: dto.category_id },
      select: { id: true, name: true, parent_id: true },
    });

    if (!category) {
      throw new InvalidCategoryError(dto.category_id);
    }

    // ── Bước 2: H1 Fix — Dùng Factory để lấy required fields ──
    // Nếu category không có trong Factory (là subcategory), tra cứu parent_id để tìm Strategy cha
    let effectiveCategoryName = category.name;
    const supportedCategories = ProductFactory.getSupportedCategories();

    if (!supportedCategories.includes(category.name) && category.parent_id !== null) {
      // Đây là subcategory → tra cứu category cha
      const parentCategory = await prisma.category.findUnique({
        where: { id: category.parent_id },
        select: { id: true, name: true },
      });

      if (parentCategory && supportedCategories.includes(parentCategory.name)) {
        effectiveCategoryName = parentCategory.name;
        if (process.env.NODE_ENV === 'development') {
          console.log(`   🔍 Step 2: Subcategory "${category.name}" → resolved to parent Strategy "${parentCategory.name}"`);
        }
      } else {
        // Không tìm thấy Strategy cho cả category con lẫn cha → lỗi rõ ràng
        throw new InvalidCategoryError(dto.category_id);
      }
    }

    // Tạo Factory template với effectiveCategoryName
    let _template;
    try {
      _template = ProductFactory.createByName(effectiveCategoryName);
    } catch (_err) {
      // Category chưa có trong Factory (cả parent cũng không hỗ trợ)
      if (process.env.NODE_ENV === 'development') {
        console.log(`   ⚠️ Step 2: No Factory template for "${effectiveCategoryName}", skipping spec validation`);
      }
    }

    // ── Bước 3: Dùng Strategy để validate specifications JSON ──
    try {
      const validator = new SpecificationValidatorContext(effectiveCategoryName);
      const validationResult = validator.validate(dto.specifications);

      if (!validationResult.isValid) {
        throw new SpecificationValidationError(validationResult.errors);
      }
    } catch (err) {
      if (err instanceof SpecificationValidationError) throw err;
      // Không có strategy → bỏ qua validation (category chưa được định nghĩa)
    }

    // ── Bước 4: Kiểm tra SKU duplicate (trước transaction để fail early) ──
    const existingProduct = await productRepository.findBySku(dto.sku);
    if (existingProduct) {
      throw new DuplicateSkuError(dto.sku);
    }

    // ── Bước 5: Prisma Transaction — đảm bảo toàn vẹn dữ liệu ──
    // Builder Pattern: Xây dựng chuỗi operations: insert Product → batch upsert Inventory cho TẤT CẢ kho
    const newProductId = await prisma.$transaction(async (tx) => {
      // 5a. Lưu Model vào bảng products
      const created = await tx.product.create({
        data: {
          name: dto.name,
          sku: dto.sku,
          category_id: dto.category_id,
          image_url: dto.image_url ?? null,
          specifications: dto.specifications as object,
        },
        select: { id: true },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`   ✅ Step 5a: Product "${dto.name}" created with ID #${created.id}`);
      }

      // 5b. Lấy TẤT CẢ warehouse IDs hiện có
      const allWarehouses = await tx.warehouse.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`   📦 Step 5b: Found ${allWarehouses.length} warehouse(s) to initialize inventory`);
      }

      // 5c. Upsert Inventory cho TỪNG kho với quantity=0, status='READY_TO_SELL'
      // Observer Pattern: Đăng ký Model tự động "thông báo" đến tất cả kho → spawn inventory records
      await Promise.all(
        allWarehouses.map((w) =>
          tx.inventory.upsert({
            where: {
              warehouse_id_product_id_status: {
                warehouse_id: w.id,
                product_id: created.id,
                status: 'READY_TO_SELL',
              },
            },
            update: {}, // Không cập nhật nếu đã tồn tại
            create: {
              warehouse_id: w.id,
              product_id: created.id,
              quantity: 0,
              status: 'READY_TO_SELL',
            },
          }),
        ),
      );

      if (process.env.NODE_ENV === 'development') {
        console.log(`   ✅ Step 5c: Inventory initialized for ${allWarehouses.length} warehouse(s)`);
      }

      return created.id;
    });

    // ── Bước 6: Lấy sản phẩm hoàn chỉnh để trả về ──
    const created = await productRepository.findById(newProductId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎉 [Facade] createProduct() DONE: "${dto.name}" (ID #${newProductId})`);
    }

    return created!;
  }
}

// Export singleton instance của Facade
export const productFacade = new ProductFacade();
