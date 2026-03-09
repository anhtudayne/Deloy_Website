/**
 * PRODUCT TYPES
 * ==============
 * Định nghĩa tất cả TypeScript interfaces & types cho module Product.
 * Tuân thủ strict mode và Clean Code.
 */

// =============================================
// Enums
// =============================================
export enum ProductCategoryName {
  PHONE = 'Điện thoại',
  LAPTOP = 'Laptop',
  ACCESSORY = 'Phụ kiện',
}

export enum InventoryStatus {
  READY_TO_SELL = 'READY_TO_SELL',
  DEFECTIVE = 'DEFECTIVE',
  IN_TRANSIT = 'IN_TRANSIT',
}

// =============================================
// Specifications (JSON) - Factory Method Output
// =============================================
export interface PhoneSpec {
  display: string;       // Màn hình
  os: string;            // Hệ điều hành
  camera: string;        // Camera
  chip: string;          // Chip / CPU
  ram: string;           // RAM
  battery: string;       // Pin
  storage?: string;
}

export interface LaptopSpec {
  cpu: string;           // CPU
  ram: string;           // RAM
  storage: string;       // Ổ cứng
  vga: string;           // VGA / GPU
  ports: string;         // Cổng kết nối
  display?: string;
}

export interface AccessorySpec {
  type: string;          // Loại phụ kiện
  compatibility: string; // Thiết bị tương thích
  color?: string;
  material?: string;
  battery?: string;
}

export type ProductSpecifications = PhoneSpec | LaptopSpec | AccessorySpec;

// =============================================
// DTOs - Request / Response
// =============================================
export interface CreateProductDto {
  name: string;
  sku: string;
  category_id: number;
  image_url?: string;
  specifications: ProductSpecifications;
  // warehouse_id removed: Đăng ký Model là Master Data.
  // Facade tự động khởi tạo Inventory cho TẤT CẢ kho.
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  category_id?: number;
  image_url?: string;
  specifications?: Partial<ProductSpecifications>;
}

export interface ProductQueryDto {
  category_id?: number;
  warehouse_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================
// Response Shape
// =============================================
export interface ProductWithInventory {
  id: number;
  name: string;
  sku: string;
  image_url: string | null;
  specifications: ProductSpecifications | null;
  created_at: Date;
  category: {
    id: number;
    name: string;
  } | null;
  inventory: Array<{
    id: number;
    warehouse_id: number | null;
    quantity: number;
    status: string;
  }>;
}

export interface CategoryStatsDto {
  category_name: string;
  category_id: number;
  model_count: number;    // Thay thế product_count: Số lượng Model (iPhone 15, Dell XPS...)
  total_quantity: number; // Tổng số máy tồn kho (Inventory quantity sum)
  sold_count: number;     // Tổng số máy đã rời kho (ProductItem SOLD count)
}

export interface ProductStatsDto {
  phones: CategoryStatsDto;
  laptops: CategoryStatsDto;
  accessories: CategoryStatsDto;
  total_models: number;   // Thay thế total_products
  total_quantity: number;
}

// =============================================
// Factory output type
// =============================================
export interface ProductTemplate {
  categoryName: ProductCategoryName;
  defaultSpecifications: ProductSpecifications;
  requiredFields: string[];
}
