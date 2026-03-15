
# FE Skill Profile: Antigravity - Claymorphism Architect

## 1. Core Tech Stack (2026 Standards)

* **Framework:** React 19+ (Vite) với kiến trúc Functional Components và Hooks.
* **Language:** TypeScript (Strict mode) để quản lý chặt chẽ các thực thể Sản phẩm (Phones, Laptops).
* **Styling:** Tailwind CSS 4.0+ kết hợp với Custom CSS Variables cho hiệu ứng 3D.
* **State Management:** Zustand (ưu tiên vì nhẹ và nhanh cho việc chuyển đổi kho hàng).
* **Visualization:** Recharts (để vẽ biểu đồ Sức khỏe kho hàng với cột bo tròn).

## 2. FE Design Patterns (The Intelligence Layer)

Antigravity nên áp dụng linh hoạt các mẫu này để xử lý UI phức tạp:

* **Factory Pattern (Component Factory):** Tự động quyết định render thẻ sản phẩm (Product Card) nào hoặc Form nhập liệu nào dựa trên `Category_ID` (Laptop, Điện thoại hay Phụ kiện).
* **Strategy Pattern (Render Strategies):** Áp dụng để hiển thị các bộ thông số kỹ thuật (JSON specs) khác nhau. Ví dụ: Một chiến lược render cho "Cấu hình phần cứng" (Laptop) và một cho "Tính năng Camera" (Điện thoại).
* **Proxy Pattern (Protected Routes & Assets):** Kiểm soát việc truy cập các trang nhạy cảm (như Quản lý kho) hoặc xử lý "Placeholder" cho hình ảnh sản phẩm 3D trong khi đang tải.
* **Observer Pattern (Global State Pub/Sub):** Sử dụng thông qua Zustand để đồng bộ hóa việc thay đổi "Kho hàng hiện tại" (Warehouse Selection) trên toàn bộ các Component mà không cần truyền props phức tạp.
* **Compound Components Pattern:** Áp dụng cho các UI phức tạp như **Claymorphism Modal** hoặc  **Bento Grid Layout** , cho phép chia sẻ state nội bộ giữa các thành phần con nhưng vẫn giữ code linh hoạt.
* **Container/Presenter Pattern:** Tách biệt hoàn toàn logic Fetching dữ liệu (Container) khỏi việc hiển thị các khối đất sét 3D (Presenter).
* **State Pattern (UI State Machine):** Quản lý các trạng thái phức tạp của giao diện (Idle, Loading, Error, Empty) một cách tường minh, tránh việc dùng quá nhiều biến boolean `isLoading`.

## 3. Design System: The "Stitch" Protocol

### A. Visual Tokens

* **Palette (Candy Pastels):**
  * `Background`: Cream (#FDFBF7).
  * `Primary`: Mint Clay (#B2F2BB).
  * `Secondary`: Lilac Clay (#E0C3FC).
  * `Accent`: Pink Clay (#FFD1DC).
* **Geometry:** `border-radius` tối thiểu là `32px` cho Card và `full` cho Pill-shaped buttons.

### B. The Claymorphism Formula

* **Outer Shadow:** `12px 12px 24px #e0ddd7, -12px -12px 24px #ffffff`.
* **Inner Shadow:** `inset 8px 8px 12px rgba(255,255,255,0.5), inset -8px -8px 12px rgba(0,0,0,0.05)`.
* **Interaction:** Hiệu ứng `Squishy Press` (scale-95) và thay đổi bóng đổ khi click.

## 4. UI Patterns & Layout

* **Bento Grid:** Sắp xếp Dashboard thành các ô vuông/chữ nhật bo tròn (gap-6).
* **Micro-interactions:** Hiệu ứng `floating` nhẹ cho icon 3D và Progress Bar bo tròn hai đầu như viên kẹo dẻo.

## 5. Business Logic Integration (FE)

* **Dynamic JSON Handling:** Render linh hoạt RAM, CPU, GPU từ trường JSON specs bằng các tag bong bóng pastel.
* **IMEI Workflow:** Quét liên tục (Continuous Input) và tiến độ Import trực quan.
* **Multi-tenant Context:** Warehouse Selector thay đổi ngữ cảnh dữ liệu toàn app tức thì.
* **Role-Based UI:** Tự động ẩn/hiện nút hành động dựa trên JWT Role (Owner/Manager/Staff).

## 6. Coding Standards

* **Custom Hooks:** Đóng gói logic nghiệp vụ vào Hooks (ví dụ: `useInventory`, `useWarehouse`).
* **Virtualization:** Sử dụng cho danh sách hàng nghìn mã IMEI để đảm bảo 60fps.
