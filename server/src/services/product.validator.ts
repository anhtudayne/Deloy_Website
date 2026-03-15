/**
 * PRODUCT VALIDATOR - STRATEGY PATTERN
 * ======================================
 * Strategy Pattern: Định nghĩa các thuật toán validation khác nhau cho field
 * `specifications` JSON, đóng gói từng thuật toán trong class riêng (Strategy),
 * và cho phép hoán đổi chúng tại runtime dựa vào category.
 *
 * - Context: `SpecificationValidatorContext`
 * - Abstract Strategy: `ISpecificationValidator`
 * - Concrete Strategies:
 *   + `PhoneSpecValidator`     → Điện thoại
 *   + `LaptopSpecValidator`    → Laptop
 *   + `AccessorySpecValidator` → Phụ kiện
 */

import { ProductSpecifications, PhoneSpec, LaptopSpec, AccessorySpec } from '../types/product.types';
import { ProductFactory } from './product.factory';

// =============================================
// Validation Result Type
// =============================================
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// =============================================
// Abstract Strategy Interface
// =============================================
interface ISpecificationValidator {
  validate(spec: unknown): ValidationResult;
  getCategoryName(): string;
}

// =============================================
// Helper
// =============================================
function checkRequiredStringFields(spec: Record<string, unknown>, fields: string[]): string[] {
  const errors: string[] = [];
  for (const field of fields) {
    const value = spec[field];
    if (value === undefined || value === null) {
      errors.push(`Thiếu trường bắt buộc: "${field}"`);
    } else if (typeof value !== 'string') {
      errors.push(`Trường "${field}" phải là chuỗi ký tự`);
    } else if ((value as string).trim() === '') {
      errors.push(`Trường "${field}" không được để trống`);
    }
  }
  return errors;
}

// =============================================
// Concrete Strategy 1: Điện thoại Validator
// Phone phải có: display, os, camera, chip, ram, battery
// =============================================
class PhoneSpecValidator implements ISpecificationValidator {
  getCategoryName(): string {
    return 'Điện thoại';
  }

  validate(spec: unknown): ValidationResult {
    const errors: string[] = [];

    if (!spec || typeof spec !== 'object') {
      return { isValid: false, errors: ['Thông số kỹ thuật phải là một object JSON'] };
    }

    const s = spec as Record<string, unknown>;
    const requiredFields = ProductFactory.getRequiredFields('Điện thoại');
    // ['display', 'os', 'camera', 'chip', 'ram', 'battery']

    const fieldErrors = checkRequiredStringFields(s, requiredFields);
    errors.push(...fieldErrors);

    // Business rule: RAM phải có format hợp lệ (e.g. "8 GB", "16GB")
    if (s['ram'] && typeof s['ram'] === 'string') {
      const ramValue = s['ram'] as string;
      if (!/\d+\s*(GB|MB|TB)/i.test(ramValue)) {
        errors.push('RAM phải có định dạng hợp lệ (ví dụ: "8 GB", "16GB")');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// =============================================
// Concrete Strategy 2: Laptop Validator
// Laptop phải có: cpu, ram, storage, vga, ports
// =============================================
class LaptopSpecValidator implements ISpecificationValidator {
  getCategoryName(): string {
    return 'Laptop';
  }

  validate(spec: unknown): ValidationResult {
    const errors: string[] = [];

    if (!spec || typeof spec !== 'object') {
      return { isValid: false, errors: ['Thông số kỹ thuật phải là một object JSON'] };
    }

    const s = spec as Record<string, unknown>;
    const requiredFields = ProductFactory.getRequiredFields('Laptop');
    // ['cpu', 'ram', 'storage', 'vga', 'ports']

    const fieldErrors = checkRequiredStringFields(s, requiredFields);
    errors.push(...fieldErrors);

    // Business rule: Storage phải đề cập đến dung lượng
    if (s['storage'] && typeof s['storage'] === 'string') {
      const storageValue = s['storage'] as string;
      if (!/\d+\s*(GB|TB|SSD|HDD)/i.test(storageValue)) {
        errors.push('Ổ cứng phải có thông tin dung lượng (ví dụ: "512 GB SSD", "1 TB")');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// =============================================
// Concrete Strategy 3: Phụ kiện Validator
// Phụ kiện phải có: type, compatibility
// =============================================
class AccessorySpecValidator implements ISpecificationValidator {
  getCategoryName(): string {
    return 'Phụ kiện';
  }

  validate(spec: unknown): ValidationResult {
    const errors: string[] = [];

    if (!spec || typeof spec !== 'object') {
      return { isValid: false, errors: ['Thông số kỹ thuật phải là một object JSON'] };
    }

    const s = spec as Record<string, unknown>;
    const requiredFields = ProductFactory.getRequiredFields('Phụ kiện');
    // ['type', 'compatibility']

    const fieldErrors = checkRequiredStringFields(s, requiredFields);
    errors.push(...fieldErrors);

    return { isValid: errors.length === 0, errors };
  }
}

// =============================================
// Context - Lựa chọn Strategy tại runtime
// =============================================
/**
 * SpecificationValidatorContext nhận vào tên category và tự động
 * chọn Strategy phù hợp. Client code không cần biết Strategy nào đang chạy.
 */
export class SpecificationValidatorContext {
  private strategy: ISpecificationValidator;

  private static readonly strategyMap: Record<string, ISpecificationValidator> = {
    'Điện thoại': new PhoneSpecValidator(),
    'Laptop': new LaptopSpecValidator(),
    'Phụ kiện': new AccessorySpecValidator(),
  };

  constructor(categoryName: string) {
    const strategy = SpecificationValidatorContext.strategyMap[categoryName];
    if (!strategy) {
      throw new Error(
        `[SpecificationValidatorContext] Không có Validation Strategy cho category: "${categoryName}". ` +
        `Hỗ trợ: ${Object.keys(SpecificationValidatorContext.strategyMap).join(', ')}`
      );
    }
    this.strategy = strategy;
    console.log(`🎯 [Strategy] Using ${categoryName} validation strategy`);
  }

  /**
   * Thực thi strategy đang được chọn.
   */
  validate(specifications: unknown): ValidationResult {
    return this.strategy.validate(specifications);
  }

  /**
   * Đổi strategy tại runtime nếu cần.
   */
  setStrategy(categoryName: string): void {
    const strategy = SpecificationValidatorContext.strategyMap[categoryName];
    if (!strategy) {
      throw new Error(`Không tìm thấy strategy cho: "${categoryName}"`);
    }
    this.strategy = strategy;
  }
}

export {
  PhoneSpecValidator,
  LaptopSpecValidator,
  AccessorySpecValidator,
};
