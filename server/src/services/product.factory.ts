/**
 * PRODUCT FACTORY - FACTORY METHOD PATTERN
 * ==========================================
 * Factory Method Pattern: Tạo các đối tượng Product theo từng loại danh mục.
 * Dựa vào `category_id` (hoặc tên), Factory trả về một ProductCreator phù hợp,
 * mỗi Creator biết cách khởi tạo `specifications` JSON chuẩn cho loại đó.
 *
 * Benefit: Thêm loại sản phẩm mới chỉ cần thêm Creator mới, không sửa code cũ.
 */

import {
  ProductCategoryName,
  PhoneSpec,
  LaptopSpec,
  AccessorySpec,
  ProductSpecifications,
  ProductTemplate,
} from '../types/product.types';

// =============================================
// Abstract Creator
// =============================================
abstract class ProductCreator {
  /** Factory Method - mỗi subclass tự implement */
  abstract createTemplate(): ProductTemplate;

  /** Tạo default specifications rỗng (các field bắt buộc với giá trị placeholder) */
  abstract buildDefaultSpec(): ProductSpecifications;

  /** Trả về danh sách tên field JSON bắt buộc theo nghiệp vụ */
  abstract getRequiredFields(): string[];
}

// =============================================
// Concrete Creator 1: Điện thoại
// =============================================
class PhoneCreator extends ProductCreator {
  createTemplate(): ProductTemplate {
    return {
      categoryName: ProductCategoryName.PHONE,
      defaultSpecifications: this.buildDefaultSpec(),
      requiredFields: this.getRequiredFields(),
    };
  }

  buildDefaultSpec(): PhoneSpec {
    return {
      display: '',  // Màn hình
      os: '',       // Hệ điều hành
      camera: '',   // Camera
      chip: '',     // Chip / CPU
      ram: '',      // RAM
      battery: '',  // Dung lượng Pin
      storage: '',
    };
  }

  getRequiredFields(): string[] {
    // Theo nghiệp vụ: Điện thoại phải có 6 trường này
    return ['display', 'os', 'camera', 'chip', 'ram', 'battery'];
  }
}

// =============================================
// Concrete Creator 2: Laptop
// =============================================
class LaptopCreator extends ProductCreator {
  createTemplate(): ProductTemplate {
    return {
      categoryName: ProductCategoryName.LAPTOP,
      defaultSpecifications: this.buildDefaultSpec(),
      requiredFields: this.getRequiredFields(),
    };
  }

  buildDefaultSpec(): LaptopSpec {
    return {
      cpu: '',      // CPU
      ram: '',      // RAM
      storage: '',  // Ổ cứng
      vga: '',      // VGA / GPU
      ports: '',    // Cổng kết nối
      display: '',
    };
  }

  getRequiredFields(): string[] {
    // Laptop phải có 5 trường này
    return ['cpu', 'ram', 'storage', 'vga', 'ports'];
  }
}

// =============================================
// Concrete Creator 3: Phụ kiện
// =============================================
class AccessoryCreator extends ProductCreator {
  createTemplate(): ProductTemplate {
    return {
      categoryName: ProductCategoryName.ACCESSORY,
      defaultSpecifications: this.buildDefaultSpec(),
      requiredFields: this.getRequiredFields(),
    };
  }

  buildDefaultSpec(): AccessorySpec {
    return {
      type: '',           // Loại phụ kiện
      compatibility: '',  // Thiết bị tương thích
      color: '',
      material: '',
      battery: '',
    };
  }

  getRequiredFields(): string[] {
    // Phụ kiện phải có 2 trường này
    return ['type', 'compatibility'];
  }
}

// =============================================
// Product Factory - The Factory Itself
// =============================================
/**
 * ProductFactory là entry point.
 * Nhận vào category_name hoặc category_id và trả về đúng ProductCreator.
 */
class ProductFactory {
  private static readonly creatorMap: Record<string, ProductCreator> = {
    [ProductCategoryName.PHONE]: new PhoneCreator(),
    [ProductCategoryName.LAPTOP]: new LaptopCreator(),
    [ProductCategoryName.ACCESSORY]: new AccessoryCreator(),
  };

  /**
   * Tạo ProductTemplate dựa vào tên danh mục.
   * @param categoryName - Tên category từ DB
   * @throws Error nếu không tìm thấy Creator phù hợp
   */
  static createByName(categoryName: string): ProductTemplate {
    const creator = this.creatorMap[categoryName];
    if (!creator) {
      throw new Error(
        `[ProductFactory] Không tìm thấy Product Creator cho danh mục: "${categoryName}". ` +
        `Các danh mục hỗ trợ: ${Object.keys(this.creatorMap).join(', ')}`
      );
    }
    console.log(`🏭 [Factory] Creating template for category: "${categoryName}"`);
    return creator.createTemplate();
  }

  /**
   * Trả về default spec trống dựa vào tên category.
   * Dùng khi người dùng chọn category trong form.
   */
  static getDefaultSpec(categoryName: string): ProductSpecifications {
    const template = this.createByName(categoryName);
    return template.defaultSpecifications;
  }

  /**
   * Trả về danh sách required fields theo category.
   * Dùng trong Validation Strategy.
   */
  static getRequiredFields(categoryName: string): string[] {
    const template = this.createByName(categoryName);
    return template.requiredFields;
  }

  /**
   * Lấy tất cả tên category được hỗ trợ.
   */
  static getSupportedCategories(): string[] {
    return Object.keys(this.creatorMap);
  }
}

export {
  ProductFactory,
  PhoneCreator,
  LaptopCreator,
  AccessoryCreator,
  ProductCreator,
};
