# TÀI LIỆU CẤU TRÚC: TRUNG TÂM VẬN HÀNH KHO (UNIFIED OPERATIONS HUB)

## 🏛️ 1. Tổng quan Giao diện chung (Shared UI Component)

* **Layout:** Một Card lớn duy nhất theo phong cách **Claymorphism** (`border-radius: 40px`, Dual-shadow).
* **Navigation:** Sử dụng một **Mode Switcher** (Thanh gạt) ở Header để chuyển đổi giữa hai trạng thái:
  * **[NHẬP KHO]** : Chủ đạo màu Mint Clay (#B2F2BB).
  * **[XUẤT KHO]** : Chủ đạo màu Pink Clay (#FFD1DC).
* **Shared Context:** Cả hai chế độ đều dùng chung `warehouse_id` từ **Zustand Store** để đảm bảo dữ liệu luôn thuộc về kho đang chọn.

---

## 📥 PHẦN A: CHỨC NĂNG NHẬP KHO (INBOUND MODULE)

### 1.1 Mục tiêu Nghiệp vụ

Ghi nhận hàng hóa từ Nhà cung cấp vào kho và định danh từng sản phẩm bằng mã IMEI mới.

### 1.2 Quy trình thực hiện (Workflow)

1. **Khởi tạo:** Chọn Nhà cung cấp (Supplier) từ bảng `Suppliers`.
2. **Chọn Model:** Tìm kiếm Model đã đăng ký trong Master Data.
3. **Quét IMEI:** Nhân viên quét mã vào Textarea (Inset Shadow).
4. **Validation (Chain of Responsibility):**
   * Kiểm tra IMEI **KHÔNG ĐƯỢC** tồn tại trong bảng `ProductItem`.
   * Kiểm tra định dạng (Regex) và trùng lặp trong danh sách vừa quét.

### 1.3 Tác động Database (Atomic Transaction)

* Tạo `Transaction` loại  **INBOUND** .
* Tạo hàng loạt `ProductItem` với trạng thái `READY_TO_SELL`.
* **Tăng** `quantity` tương ứng trong bảng `Inventory`.

---

## 📤 PHẦN B: CHỨC NĂNG XUẤT KHO (OUTBOUND MODULE)

### 2.1 Mục tiêu Nghiệp vụ

Giao hàng cho khách và loại bỏ định danh IMEI đó ra khỏi tồn kho khả dụng.

### 2.2 Quy trình thực hiện (Workflow)

1. **Khởi tạo:** Nhập thông tin Khách hàng hoặc mã Đơn bán hàng (Sales Order).
2. **Chọn Model:** Chọn sản phẩm cần xuất.
3. **Quét IMEI thực tế:** Nhân viên quét mã IMEI của máy  **đang cầm trên tay** .
4. **Validation (Chain of Responsibility):**
   * **BẮT BUỘC:** IMEI phải tồn tại trong bảng `ProductItem` tại kho này.
   * **BẮT BUỘC:** Trạng thái của máy phải là `READY_TO_SELL`.
   * Nếu quét trúng máy của kho khác hoặc máy đã bán, hệ thống phải báo lỗi đỏ ngay lập tức.

### 2.3 Tác động Database (Atomic Transaction)

* Tạo `Transaction` loại  **OUTBOUND** .
* Cập nhật trạng thái `ProductItem` sang `SOLD` (hoặc `SHIPPED`).
* **Giảm** `quantity` tương ứng trong bảng `Inventory`.

---

## 🛠️ 3. Kiến trúc Design Patterns Hợp nhất (Core Patterns)

Để một trang xử lý cả hai logic mà không bị xung đột, Antigravity phải tuân thủ:

* **Strategy Pattern:** Sử dụng để hoán đổi logic xử lý khi nhấn nút "Xác nhận". Backend sẽ gọi `InboundStrategy` hoặc `OutboundStrategy` dựa trên Mode.
* **Proxy Pattern (RBAC):** Kiểm soát quyền hạn. Nhân viên kho chỉ có thể thực hiện thao tác trên kho được phân quyền.
* **Builder Pattern:** Dùng chung để dựng đối tượng `Transaction` phức tạp cho cả hai chiều nhập/xuất.
* **State Pattern:** Quản lý vòng đời của IMEI (Từ `READY_TO_SELL` sang `SOLD`) và trạng thái phiếu (Từ `PENDING` sang `COMPLETED`).
