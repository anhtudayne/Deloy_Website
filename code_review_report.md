# 📋 BÁO CÁO RÀ SOÁT MÃ NGUỒN — F4 Warehouse
**Vai trò:** Senior Software Architect & Lead QA  
**Ngày:** 2026-03-20  
**Scope:** Toàn bộ Backend (Node.js/TypeScript) + Frontend (React/TypeScript)  
**Tài liệu đối chiếu:** [backEnd_skill.md](file:///Users/vuthang/Desktop/ccptpm/backEnd_skill.md), [frontend-guidelines.md](file:///Users/vuthang/Desktop/ccptpm/frontend-guidelines.md), [db.sql](file:///Users/vuthang/Desktop/ccptpm/db.sql)

---

## 1. BẢNG TỔNG HỢP (PASS / FAIL / SUGGESTION)

| # | Hạng mục kiểm tra | Trạng thái | File / Dòng liên quan |
|---|---|---|---|
| 1 | Controller-Service-Repository tách biệt rõ ràng | ✅ **PASS** | [auth.controller.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/controllers/auth.controller.ts), [product.controller.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/controllers/product.controller.ts) |
| 2 | Fat Controller — business logic trong controller | ✅ **PASS** | [product.controller.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/controllers/product.controller.ts) — không có logic trong controller |
| 3 | Singleton DB Connection | ✅ **PASS** | [config/database.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/config/database.ts) |
| 4 | Proxy Pattern — JWT Authentication | ✅ **PASS** | `auth.middleware.ts:34` |
| 5 | Proxy Pattern — RBAC Role Authorization | ✅ **PASS** | `auth.middleware.ts:71` |
| 6 | Proxy Pattern — Warehouse Access Control | ⚠️ **FAIL** | `auth.middleware.ts:110`, `product.controller.ts:78` |
| 7 | Factory Method — Product creator phân loại | ✅ **PASS** | [product.factory.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.factory.ts) |
| 8 | Factory Method — Hỗ trợ category con (parent_id) | ⚠️ **FAIL** | `product.factory.ts:141`, `product.facade.ts:96` |
| 9 | Strategy Pattern — Validation BE | ✅ **PASS** | [product.validator.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.validator.ts) |
| 10 | Strategy Pattern — Render Spec FE | ✅ **PASS** | `ProductManagement.tsx:143` |
| 11 | Facade Pattern — createProduct pipeline | ✅ **PASS** | [product.facade.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.facade.ts) |
| 12 | FE Visual Tokens — Palette Cream/Mint/Lilac/Pink | ✅ **PASS** | `ProductManagement.tsx:103-114` |
| 13 | FE Claymorphism — Outer Shadow formula | ✅ **PASS** | `ProductManagement.tsx:244-246` |
| 14 | FE Claymorphism — Inner Shadow formula | ⚠️ **FAIL** | chi tiết mục §3 |
| 15 | Compound Components — Modal | ⚠️ **FAIL** | `ProductManagement.tsx:459` |
| 16 | Observer/Zustand — Warehouse Selector đồng bộ | ⚠️ **FAIL** | [useAuthStore.ts](file:///Users/vuthang/Desktop/ccptpm/client/src/store/useAuthStore.ts) — chưa có `useWarehouseStore` |
| 17 | Container/Presenter Pattern | ⚠️ **FAIL** | `ProductManagement.tsx:694` — God Page |
| 18 | Custom Hook — useInventory / useWarehouse | ⚠️ **FAIL** | Không tìm thấy `hooks/useInventory.ts` |
| 19 | DB Schema — Prisma vs db.sql đối chiếu | ✅ **PASS** | [schema.prisma](file:///Users/vuthang/Desktop/ccptpm/server/prisma/schema.prisma) vs [db.sql](file:///Users/vuthang/Desktop/ccptpm/db.sql) |
| 20 | DB Schema — Quan hệ Inventory Unique constraint | ✅ **PASS** | `schema.prisma:114` |
| 21 | DB — count() query bỏ sót warehouse_id filter | ⚠️ **FAIL** | `product.repository.ts:254` |
| 22 | Warehouse Module tách riêng | ⚠️ **FAIL** | Không tồn tại `warehouse.controller.ts` |
| 23 | SOLID — Open/Closed (thêm category mới) | ✅ **PASS** | [product.factory.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.factory.ts) — chỉ thêm Creator mới |
| 24 | Strategy Pattern — vẫn còn hard-code (Gap 1) | ⚠️ **FAIL** | `product.service.ts:99-101` |
| 25 | Error Handling — chưa dùng global error handler | ⚠️ **FAIL** | `product.facade.ts:68` — còn `console.log` |

---

## 2. KIỂM TRA TUÂN THỦ (COMPLIANCE CHECK)

### 2.1 Backend — Controller-Service-Repository

**✅ PASS — Tách biệt hoàn hảo:**

```
product.controller.ts  → Nhận HTTP, validate Zod, gọi service, trả response
product.service.ts     → Orchestrate business logic, gọi facade/repository
product.facade.ts      → Điều phối sub-systems (Factory + Strategy + Repository)
product.repository.ts  → Chỉ Prisma CRUD
```

- [auth.controller.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/controllers/auth.controller.ts) (L29–68): Controller thuần — validate bằng Zod, ném lỗi xuống service, không có 1 dòng logic nghiệp vụ.
- [product.controller.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/controllers/product.controller.ts) (L60–97): [getProducts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.service.ts#42-63) gọi thẳng service, không tính toán.

**⚠️ CẢNH BÁO nhỏ — Dead code trong controller:**

```typescript
// product.controller.ts, dòng 78–81
if (accessibleWarehouses && !query.warehouse_id) {
  // Lấy sản phẩm từ các kho được phân công
  // (Lấy warehouse đầu tiên nếu không chỉ định cụ thể)
}
```
> **Vấn đề:** Block [if](file:///Users/vuthang/Desktop/ccptpm/server/src/services/auth.service.ts#119-125) này **hoàn toàn rỗng** — không có hành động nào được thực thi. `accessibleWarehouses` được tính toán nhưng **không bao giờ được truyền** vào `productService.getProducts(query)`. Điều này có nghĩa **Staff/Manager có thể xem toàn bộ sản phẩm** mà không bị lọc theo kho được phân công.

---

### 2.2 Frontend — Visual Tokens & Claymorphism

**✅ PASS — Palette tuân thủ đúng:**

| Token | Guideline | Code thực tế |
|---|---|---|
| Background | Cream `#FDFBF7` | `backgroundColor: '#FDFBF7'` (L855) |
| Primary | Mint Clay `#B2F2BB` | `bg-mint-clay` (L192, 363) |
| Secondary | Lilac Clay `#E0C3FC` | `bg-lilac-clay` (L106, 194) |
| Accent | Pink Clay `#FFD1DC` | `bg-pink-clay` (L103, 260) |
| Border-radius | Min 32px | `rounded-card`, `rounded-card2` |

**✅ PASS — Outer Shadow:**

```typescript
// ProductManagement.tsx:244–246 (ProductCard)
boxShadow: '-10px -10px 24px rgba(255,255,255,0.92), 14px 18px 36px rgba(17,24,39,0.11), ...'
// Guideline: '12px 12px 24px #e0ddd7, -12px -12px 24px #ffffff'
```
> Triển khai tương đương, có bonus layer `inset 0px 1px 0px` cho depth effect.

**⚠️ FAIL — Inner Shadow không nhất quán:**

- **Guideline:** `inset 8px 8px 12px rgba(255,255,255,0.5), inset -8px -8px 12px rgba(0,0,0,0.05)`
- **Thực tế ClayInput** (L415): `inset 4px 4px 10px rgba(17,24,39,0.08), inset -4px -4px 10px rgba(255,255,255,0.80)` — **đảo ngược thứ tự light/dark**, trục tối chiều dương thay vì âm.
- **Thực tế Modal** (L500): outer shadow đúng nhưng **thiếu inner shadow layer** theo guideline.

---

## 3. ĐÁNH GIÁ DESIGN PATTERNS

### 3.1 Singleton — Database Connection

**✅ PASS hoàn hảo:**

```typescript
// config/database.ts:10–46
class DatabaseClient {
  private static instance: PrismaClient | null = null;  // ✅ Private static
  private constructor() {}                               // ✅ Constructor ngăn external instantiation
  public static getInstance(): PrismaClient { ... }     // ✅ Lazy initialization
}
export const prisma = DatabaseClient.getInstance();      // ✅ One module-level export
```
> Đây là triển khai Singleton đúng sách giáo khoa. Instance thực sự là duy nhất vì Node.js module cache đảm bảo [database.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/config/database.ts) chỉ execute 1 lần.

---

### 3.2 Proxy Pattern — Auth Middleware

**✅ PASS — 3 lớp Proxy chính xác:**

```
Proxy 1: authenticateToken (auth.middleware.ts:34)  → Xác thực danh tính (JWT verify)
Proxy 2: authorizeRoles    (auth.middleware.ts:71)  → Kiểm tra Role (RBAC)
Proxy 3: authorizeWarehouse(auth.middleware.ts:110) → Kiểm tra quyền kho
```

**⚠️ FAIL NGHIÊM TRỌNG — Proxy Warehouse KHÔNG được áp dụng trên route:**

```typescript
// product.routes.ts:19 — HIỆN TẠI
router.get('/', (req, res, next) => productController.getProducts(req, res, next));

// product.routes.ts — NÊN LÀ
router.get('/', authorizeWarehouseAccess(), (req, res, next) => productController.getProducts(req, res, next));
```
> [authorizeWarehouseAccess](file:///Users/vuthang/Desktop/ccptpm/server/src/middlewares/auth.middleware.ts#96-157) đã được định nghĩa nhưng **không được gắn vào bất kỳ route nào**. Middleware chỉ kiểm tra `req.params.warehouseId`, nhưng API list products dùng `req.query.warehouse_id` — hai tên param khác nhau hoàn toàn. Điều này khiến **Staff có thể query sản phẩm của kho bất kỳ**.

**⚠️ FAIL — [getAccessibleWarehouseIds](file:///Users/vuthang/Desktop/ccptpm/server/src/middlewares/auth.middleware.ts#158-174) bị import nhưng không dùng:**

```typescript
// product.controller.ts:63
const accessibleWarehouses = getAccessibleWarehouseIds(user);
// product.controller.ts:78–81 — Block rỗng, accessibleWarehouses không được dùng
```

---

### 3.3 Factory Method — Product Module

**✅ PASS — Kiến trúc đúng:**

```
ProductCreator (Abstract)
├── PhoneCreator    → PhoneSpec { display, os, camera, chip, ram, battery, storage }
├── LaptopCreator   → LaptopSpec { cpu, ram, storage, vga, ports, display }
└── AccessoryCreator → AccessorySpec { type, compatibility, color, material, battery }
```

> Open/Closed Principle được tôn trọng: thêm loại sản phẩm mới chỉ cần thêm Creator class mới + 1 entry vào `creatorMap`.

**⚠️ FAIL — Factory/Strategy bị bỏ qua cho subcategory:**

```typescript
// product.facade.ts:93–99 — "Silent skip" khi category không trong Factory
let _template;
try {
  _template = ProductFactory.createByName(category.name);
} catch (_err) {
  // Nếu category không có trong Factory (e.g. category con), bỏ qua factory validation
  console.log(`⚠️ Step 3: No Factory template for "${category.name}", skipping spec validation`);
}
```
> [db.sql](file:///Users/vuthang/Desktop/ccptpm/db.sql) có `categories.parent_id` hỗ trợ danh mục đa cấp (ví dụ: `Phụ kiện → Ốp lưng`). Nhưng khi một category con được chọn (ví dụ "Ốp lưng"), validation hoàn toàn bị bỏ qua. Sản phẩm sẽ được tạo với `specifications = {}` trống mà không có lỗi. **Cần giải quyết bằng cách tra cứu category cha (`parent_id`) để xác định strategy phù hợp.**

---

### 3.4 FE Patterns

**✅ PASS — Strategy Pattern (Render Specs) được áp dụng tốt:**

```typescript
// ProductManagement.tsx:143–168
const SPEC_FIELDS: Record<string, SpecFieldDef[]> = {
  'Điện thoại': [ ...7 fields... ],
  'Laptop':     [ ...6 fields... ],
  'Phụ kiện':   [ ...5 fields... ],
}
// Modal tự động chọn strategy dựa vào category:
const specFields = SPEC_FIELDS[categoryName] ?? SPEC_FIELDS['Phụ kiện']  // L486
```

**⚠️ FAIL — Compound Components chưa áp dụng cho Modal:**

Guideline yêu cầu Compound Components cho Claymorphism Modal. Hiện tại [ClayModal](file:///Users/vuthang/Desktop/ccptpm/client/src/pages/ProductManagement.tsx#456-612) (L459) là một monolithic component:

```typescript
// Hiện tại — Monolithic
function ClayModal({ state, formOptions, onClose, onSave, saving }) { ... }

// Nên áp dụng Compound Components:
// <Modal>
//   <Modal.Header />
//   <Modal.Body>
//     <Modal.SpecSection categoryId={...} />
//   </Modal.Body>
//   <Modal.Footer onSave={...} onClose={...} />
// </Modal>
```

**⚠️ FAIL — Không có `useWarehouseStore` cho Multi-tenant Context:**

- [useAuthStore.ts](file:///Users/vuthang/Desktop/ccptpm/client/src/store/useAuthStore.ts) chỉ quản lý token/user — không có Warehouse Selector state.
- Guideline: _"Warehouse Selector thay đổi ngữ cảnh dữ liệu toàn app tức thì"_ (frontend-guidelines.md:50).
- Kết quả: Khi cần lọc theo kho, logic nằm rải rác trong [ProductManagement.tsx](file:///Users/vuthang/Desktop/ccptpm/client/src/pages/ProductManagement.tsx) (L729-742) thay vì một store toàn cục.

**⚠️ FAIL — Container/Presenter Pattern chưa được áp dụng:**

[ProductManagement.tsx](file:///Users/vuthang/Desktop/ccptpm/client/src/pages/ProductManagement.tsx) là một **God Page Component** (~1074 dòng) chứa cả:
- Data fetching (L712, L725, L761)
- Business logic (L797-804)
- State management (L695-707)
- UI rendering toàn bộ

---

## 4. GAP ANALYSIS — VỊ TRÍ THIẾU DESIGN PATTERN

### Gap 1: Hard-code Category Name Matching trong Service Layer

**File:** [product.service.ts](file:///Users/vuthang/Desktop/ccptpm/server/src/services/product.service.ts), dòng **99–101**

```typescript
// HIỆN TẠI — Hard-code string array
const PHONE_NAMES = ['Điện thoại', 'Phone', 'Smartphone'];
const LAPTOP_NAMES = ['Laptop', 'Máy tính xách tay'];
const ACCESSORY_NAMES = ['Phụ kiện', 'Accessory', 'Accessories'];
```

> **Vấn đề:** Đây là kỹ thuật hard-code thuần túy. Mỗi khi DB thêm category mới hoặc đổi tên, cần sửa 2-3 nơi. `ProductFactory.getSupportedCategories()` đã tồn tại nhưng không được dùng ở đây.

**Đề xuất — Strategy/Registry Pattern:**

```typescript
// Dùng Factory để nhận diện category thay vì so sánh string
const categoryCatalogs = ProductFactory.getSupportedCategories(); // ['Điện thoại', 'Laptop', 'Phụ kiện']
const find = (name: string) => rawStats.find(r => r.category_name === name);
```

---

### Gap 2: Thiếu State Pattern cho Transaction/Inventory Lifecycle

**File:** Không tồn tại — thiếu hoàn toàn.

> [db.sql](file:///Users/vuthang/Desktop/ccptpm/db.sql) định nghĩa `transactions.status ENUM('DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED')` và `inventory.status ENUM('READY_TO_SELL', 'DEFECTIVE', 'IN_TRANSIT')`. Đây là tình huống kinh điển cho **State Pattern**, nhưng toàn bộ module Transaction chưa được implement. Nếu thêm Transaction module mà không dùng State Pattern, sẽ dẫn đến các `if/else` phức tạp để quản lý chuyển đổi trạng thái.

**Đề xuất:**

```typescript
interface TransactionState {
  canConfirm(): boolean;
  canCancel(): boolean;
  next(): TransactionState;
}
class DraftState implements TransactionState { ... }
class PendingState implements TransactionState { ... }
```

---

### Gap 3: Thiếu Builder Pattern cho Transaction với nhiều Detail

**File:** Không tồn tại — thiếu hoàn toàn.

> [db.sql](file:///Users/vuthang/Desktop/ccptpm/db.sql) có `transactions` + `transaction_details` + `transaction_imei` — 3 bảng liên quan cần khởi tạo theo thứ tự. [backEnd_skill.md](file:///Users/vuthang/Desktop/ccptpm/backEnd_skill.md) đã chỉ rõ: _"Builder: Sử dụng cho các đối tượng có quá nhiều tham số... khởi tạo một Transaction kèm theo hàng loạt Transaction_Detail"_. Module Transaction hoàn toàn vắng mặt.

---

### Gap 4: Thiếu Custom Hooks cho Data Fetching

**File:** `client/src/hooks/` — trống (không có file nào ngoài directory).

> Guideline yêu cầu: _"Custom Hooks: Đóng gói logic nghiệp vụ vào Hooks (ví dụ: useInventory, useWarehouse)"_. Hiện tại toàn bộ fetch logic (3 `useCallback` + 2 `useEffect`) nằm trong `ProductManagement.tsx:712-778`. Đây vi phạm DRY vì logic sẽ phải copy khi thêm page mới.

**Đề xuất:**

```typescript
// hooks/useProducts.ts
export function useProducts(filters: ProductQueryDto) {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProducts = useCallback(async () => { ... }, [filters]);
  useEffect(() => { fetchProducts() }, [fetchProducts]);
  
  return { products, loading, error, refetch: fetchProducts };
}
```

---

## 5. ĐỐI CHIẾU DATABASE (DB.SQL vs PRISMA SCHEMA)

### 5.1 Kiểm tra tên cột và quan hệ

| Bảng DB.SQL | Model Prisma | Tên cột | Quan hệ | Trạng thái |
|---|---|---|---|---|
| `roles` | `Role` | id, name, description | `users[]` | ✅ PASS |
| `users` | `User` | id, role_id, full_name, username, email, password_hash, status, created_at | `role`, `warehouses[]`, `transactions[]` | ✅ PASS |
| `warehouses` | `Warehouse` | id, name, address, capacity | `users[]`, `inventory[]`, `product_items[]`, `source_transactions[]`, `dest_transactions[]` | ✅ PASS |
| `user_warehouse` | `UserWarehouse` | user_id, warehouse_id | Composite PK | ✅ PASS |
| `categories` | `Category` | id, name, parent_id | Self-relation | ✅ PASS |
| `suppliers` | `Supplier` | id, company_name, phone, address, email | `products[]` | ✅ PASS |
| `products` | `Product` | id, category_id, supplier_id, name, sku, image_url, specifications, created_at | `category`, `supplier`, `inventory[]`, `product_items[]`, `transaction_details[]` | ✅ PASS |
| `inventory` | `Inventory` | id, warehouse_id, product_id, quantity, status | Unique(warehouse, product, status) | ✅ PASS |
| `product_items` | `ProductItem` | id, product_id, warehouse_id, imei_serial, status | `transaction_imeis[]` | ✅ PASS |
| `transactions` | `Transaction` | id, code, type, status, created_by, source_warehouse_id, dest_warehouse_id, total_amount, created_at | `creator`, `source_warehouse`, `dest_warehouse`, `details[]` | ✅ PASS |
| `transaction_details` | `TransactionDetail` | id, transaction_id, product_id, quantity, unit_price | `imeis[]` | ✅ PASS |
| `transaction_imei` | `TransactionImei` | id, transaction_detail_id, product_item_id | — | ✅ PASS |

> **Nhận xét:** Schema Prisma đối chiếu hoàn hảo với `db.sql`. Tất cả tên cột, kiểu dữ liệu, foreign key và unique constraint đều được ánh xạ chính xác.

---

### 5.2 Lỗ hổng Logic Database

**⚠️ FAIL — `count()` bỏ sót `warehouse_id` filter (product.repository.ts:254–268):**

```typescript
// HIỆN TẠI — warehouse_id bị bỏ qua khi đếm
async count(query: Omit<ProductQueryDto, 'page' | 'limit'>): Promise<number> {
  const { category_id, search } = query;  // ← warehouse_id bị destructure bỏ!
  return prisma.product.count({ where: { ... } });
}
```

> **Vấn đề:** Khi người dùng filter theo `warehouse_id=2`, `findAll()` trả về đúng sản phẩm của kho 2, nhưng `count()` tính tổng **tất cả sản phẩm**. Pagination sẽ tính `totalPages` sai.

**Đề xuất fix:**

```typescript
async count(query: Omit<ProductQueryDto, 'page' | 'limit'>): Promise<number> {
  const { category_id, warehouse_id, search } = query; // ← thêm warehouse_id
  return prisma.product.count({
    where: {
      ...(category_id ? { category_id } : {}),
      ...(search ? { OR: [{ name: { contains: search }}, { sku: { contains: search }}]} : {}),
      ...(warehouse_id ? { inventory: { some: { warehouse_id }}} : {}), // ← thêm dòng này
    },
  });
}
```

**⚠️ FAIL — Thiếu Module Warehouse (chức năng quản lý kho):**

> `db.sql` có bảng `warehouses`, `user_warehouse` với logic phân quyền phức tạp. Nhưng không có `warehouse.controller.ts`, `warehouse.service.ts`, `warehouse.repository.ts`. Hiện tại chỉ có API `GET /api/products/form-options` trả về danh sách kho — đây là **stub**, không phải module thực sự.

---

## 6. TỔNG KẾT & ƯU TIÊN SỬA CHỮA

### Lỗi Nghiêm Trọng (Critical — Cần sửa ngay)

| # | Vấn đề | File | Dòng |
|---|---|---|---|
| C1 | Warehouse access control không được enforce | `product.controller.ts` | 78–81 |
| C2 | `count()` bỏ sót `warehouse_id` → pagination sai | `product.repository.ts` | 254–268 |
| C3 | `authorizeWarehouseAccess` không được gắn vào route | `product.routes.ts` | 19–22 |

### Lỗi Trung Bình (High — Ảnh hưởng kiến trúc)

| # | Vấn đề | File | Dòng |
|---|---|---|---|
| H1 | Category con bỏ qua toàn bộ validation | `product.facade.ts` | 93–99 |
| H2 | `ProductManagement.tsx` là God Component (1074 dòng) | `ProductManagement.tsx` | 694+ |
| H3 | Hard-code category name arrays | `product.service.ts` | 99–101 |
| H4 | Inner Shadow CSS sai theo guideline | `ProductManagement.tsx` | 415 |

### Đề xuất Tối ưu (Suggestion — Tăng chất lượng)

| # | Đề xuất | Benefit |
|---|---|---|
| S1 | Tạo `useWarehouseStore.ts` Zustand store | Multi-tenant sync toàn app |
| S2 | Refactor Modal sang Compound Component pattern | Reusability + testability |
| S3 | Tạo `hooks/useProducts.ts` và `hooks/useProductStats.ts` | DRY, dễ test, tái sử dụng |
| S4 | Implement Transaction Module với State Pattern | Real inventory management |
| S5 | Tra cứu `parent_id` trong Facade để xác định Strategy cho subcategory | Data integrity |
| S6 | Thêm `authorizeWarehouseAccess` vào GET product routes | Security |

---

*Báo cáo được tạo tự động bằng phân tích tĩnh toàn bộ mã nguồn. Tham chiếu tiêu chuẩn: `backEnd_skill.md`, `frontend-guidelines.md`, `db.sql`.*
