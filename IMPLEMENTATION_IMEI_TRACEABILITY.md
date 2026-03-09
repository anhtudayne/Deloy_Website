# Tài liệu Triển khai: Truy vết IMEI (IMEI Traceability Implementation)

Tài liệu này tóm tắt cách tính năng Truy vết IMEI được triển khai trong hệ thống F4-Warehouse, từ tầng Backend đến giao diện người dùng theo phong cách **Claymorphism**.

---

## 1. Backend: Công cụ Truy vết (The Trace Engine)

Để lấy được toàn bộ lịch sử của một IMEI, hệ thống thực hiện một truy vấn `deep-include` thông qua Prisma ORM.

### API Endpoint
- **URL:** `GET /api/products/trace/:imei`
- **Controller:** `ProductController.getImeiTrace`
- **Route:** `router.get('/trace/:imei', ...)`

### Logic Truy vấn (Data Fetching)
1. **Tìm kiếm ProductItem:** Xác định thiết bị dựa trên `imei_serial`.
2. **Khai thác quan hệ (Relational Joins):**
   - **Product & Category:** Lấy thông tin model và loại hàng.
   - **Warehouse:** Trạng thái lưu kho hiện tại.
   - **TransactionImeis:** Đây là cầu nối để truy cập dòng thời gian.
   - **Transaction Detail -> Transaction:** Truy xuất từng phiếu liên quan.
3. **Mở rộng thông tin Giao dịch:**
   - `creator`: Người lập phiếu.
   - `confirmer`: Người xác nhận nhận hàng (đối với TRANSFER).
   - `source_warehouse` & `dest_warehouse`: Kho đi và kho đến.
   - `supplier`: Nhà cung cấp (đối với INBOUND).
4. **Formatting Timeline:** Sắp xếp danh sách giao dịch theo `created_at` (từ cũ đến mới) để tạo sự liền mạch.

---

## 2. Frontend: Giao diện Truy vết (IMEITracker.tsx)

Trang tra cứu được xây dựng tại `client/src/pages/IMEITracker.tsx` với các thành phần chính:

### A. Smart Search Box
- Sử dụng **Custom Debounce Hook** (delay 600ms) để tự động gọi API khi người dùng ngừng nhập.
- Tương thích tốt với máy quét mã vạch (Barcode Scanner) cho trải nghiệm rảnh tay.

### B. Product Profile (Hồ sơ thiết bị)
- Hiển thị thông tin tổng quan của máy dưới dạng thẻ Claymorphism lớn.
- **Badge trạng thái:** Phân biệt nhanh `Lưu kho`, `Đã bán`, `Đang vận chuyển` bằng màu sắc.

### C. The Life Timeline (Dòng thời gian)
Sử dụng các Visual Tokens để định danh loại giao dịch:

| Loại Giao dịch | Màu sắc (Clay Token) | Icon |
| :--- | :--- | :--- |
| **INBOUND (Nhập)** | Mint Clay (#B2F2BB) | PackageCheck |
| **TRANSFER (Chuyển)** | Lilac Clay (#E0C3FC) | Truck |
| **OUTBOUND (Xuất)** | Pink Clay (#FFD1DC) | ArrowDownRight |

---

## 3. UX & UI Principles (Claymorphism / Stitch Style)

- **Soft Shadows:** Sử dụng đa lớp `box-shadow` (kết hợp cả shadow ngoài và inset shadow trắng) để tạo hiệu ứng phồng nhẹ, mềm mại như cao su.
- **Interactive Motion:** Tích hợp `framer-motion` cho các hiệu ứng:
  - `Scale Hover`: Các mốc thời gian phồng to nhẹ khi di chuột qua.
  - `Animate Presence`: Chuyển cảnh mượt mà khi kết quả tra cứu xuất hiện.
- **Micro-interactions:** Hiển thị chi tiết nhân viên thực hiện (Người lập, Người xác nhận) khi tương tác sâu vào từng mốc thời gian.

---

## 4. Bảo mật & Phân quyền

- Tất cả các yêu cầu truy vết đều phải đi qua middleware `authenticateToken`.
- Đảm bảo dữ liệu nhạy cảm như giá nhập/giá bán chỉ hiển thị đúng theo cấp bậc phân quyền (Manager/Owner).

---
*Tài liệu được biên soạn bởi Antigravity AI.*
