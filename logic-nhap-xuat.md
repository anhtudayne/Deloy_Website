# 🏗️ Tài liệu Logic Nghiệp vụ: Nhập - Xuất - Điều Chuyển Kho (F4-WareHouse)

Tài liệu này mô tả chi tiết luồng xử lý dữ liệu, các Design Patterns áp dụng và tác động đến cơ sở dữ liệu cho 3 nghiệp vụ cốt lõi của hệ thống: **Nhập kho**, **Xuất kho** và **Điều chuyển**.

---

## 📥 1. Nghiệp vụ Nhập kho (Inbound Logistics)

### 1.1 Mục tiêu
Ghi nhận hàng hóa từ nhà cung cấp vào kho, định danh từng thiết bị bằng mã **IMEI/Serial** duy nhất và cập nhật tổng lượng tồn kho vật lý.

### 1.2 Quy trình thực hiện (Workflow)
1. **Khởi tạo**: Người dùng chọn Kho đích (`dest_warehouse_id`), Nhà cung cấp (`supplier_id`) và nhập danh sách sản phẩm kèm IMEI.
2. **Kiểm duyệt IMEI (Chain of Responsibility)**:
    - **Step 1: ImeiFormatHandler**: Kiểm tra định dạng IMEI (Regex).
    - **Step 2: ImeiPayloadDuplicateHandler**: Kiểm tra trùng lặp IMEI ngay trong danh sách vừa nhập.
    - **Step 3: ImeiDatabaseDuplicateHandler**: Kiểm tra IMEI đã tồn tại trong hệ thống chưa (IMEI nhập mới không được trùng).
3. **Quản lý Trạng thái (State Pattern)**:
    - Transaction khởi tạo với trạng thái `DRAFT`, sau đó `PENDING`.
    - Chuyển `COMPLETED` sau khi Transaction cơ sở dữ liệu thành công.

### 1.3 Tác động Database (Atomic Transaction)
Được bọc trong một **Prisma $transaction**:
- **Tạo Transaction**: Ghi nhận bảng `transactions` (type: `INBOUND`, `supplier_id`).
- **Tạo Transaction Detail**: Lưu thông tin số lượng và đơn giá nhập.
- **Tạo ProductItems**: Thêm mới vào bảng `product_items` với trạng thái `IN_STOCK`.
- **Liên kết IMEI**: Lưu thông tin vào `transaction_imei`.
- **Cập nhật Inventory (Upsert)**: Tăng lượng `READY_TO_SELL` tại kho đích.

---

## 📤 2. Nghiệp vụ Xuất kho (Outbound Logistics)

### 2.1 Mục tiêu
Xuất hàng cho khách hàng/đối tác, cập nhật trạng thái thiết bị và giảm trừ tồn kho.

### 2.2 Quy trình thực hiện (Workflow)
1. **Khởi tạo**: Chọn Kho nguồn (`source_warehouse_id`), Khách hàng/Đối tác (`partner_name` hoặc `customer`) và quét/nhập mã IMEI cần xuất.
2. **Kiểm duyệt IMEI (Chain of Responsibility)**:
    - **Step 1: ImeiExistenceHandler**: Kiểm tra IMEI có tồn tại không.
    - **Step 2: ImeiWarehouseMatchHandler**: Kiểm tra IMEI có nằm tại kho nguồn không.
    - **Step 3: ImeiStatusMatchHandler**: Kiểm tra trạng thái máy phải là `IN_STOCK`.
3. **Thực thi Chiến lược (Strategy Pattern)**:
    - Giảm thiểu sự rườm rà qua `OutboundStrategy`.

### 2.3 Tác động Database (Atomic Transaction)
- **Tạo Transaction**: Ghi nhận `transactions` (type: `OUTBOUND`, `partner_name`).
- **Tạo Transaction Detail**: Lưu số lượng và đơn giá bán.
- **Cập nhật Trạng thái Máy**: Chuyển IMEI từ `IN_STOCK` sang `SOLD`.
- **Liên kết IMEI**: Ghi nhận IMEI đã xuất.
- **Cập nhật Inventory**: Trừ lượng `READY_TO_SELL` tại kho nguồn. Rào chắn chống âm kho (`Inventory Guard`) được kiểm tra nghiêm ngặt.

---

## 🔄 3. Nghiệp vụ Điều chuyển Kho (Internal Transfer)

### 3.1 Mục tiêu
Luân chuyển hàng hóa giữa các kho trong hệ thống qua 2 bước: Xuất điều chuyển (Kho A) -> Nhận điều chuyển (Kho B).

### 3.2 Quy trình thực hiện (Workflow)

**BƯỚC 1: XUẤT ĐIỀU CHUYỂN (TRANSFER OUT)**
1. **Khởi tạo**: Chọn Kho nguồn (`source_warehouse_id`), Kho đích (`dest_warehouse_id`) và danh sách IMEI.
2. **Kiểm duyệt IMEI**: Tương tự như Xuất kho, IMEI phải tồn tại, nằm ở kho nguồn và đang ở trạng thái `IN_STOCK`.
3. **Tác động Database**:
   - Ghi nhận `transactions` (type: `TRANSFER`, trạng thái: `PENDING`).
   - `ProductItems` chuyển trạng thái sang `IN_TRANSIT`.
   - Giảm lượng `READY_TO_SELL` ở Kho nguồn.
   - Tăng/Tạo lượng `IN_TRANSIT` ở Kho đích.

**BƯỚC 2: XÁC NHẬN NHẬN HÀNG (TRANSFER CONFIRM)**
1. **Khởi tạo**: Kho đích tiến hành xác nhận mã phiếu chuyển (`transaction_id`).
2. **Tác động Database**:
   - `ProductItems` chuyển trạng thái sang `IN_STOCK` và gán `warehouse_id` mới thành Kho đích.
   - Giảm lượng `IN_TRANSIT` và Tăng lượng `READY_TO_SELL` ở Kho đích.
   - Cập nhật phiếu `transactions` với `confirmed_by`, `confirmed_at` và đổi trạng thái thành `COMPLETED`.

---

## 🛠️ 4. Các Design Patterns sử dụng

| Pattern | Ứng dụng |
| :--- | :--- |
| **Strategy** | Phân tách logic `Inbound`, `Outbound` và `Transfer` thành các lớp riêng biệt qua `TransactionContext`. |
| **Chain of Responsibility** | Chuỗi các bước Validate IMEI linh hoạt, hỗ trợ check định dạng, check lặp, check đúng kho. |
| **Builder** | Khởi tạo payload lưu DB thông qua `InboundBuilder`, `OutboundBuilder` và `TransferBuilder`. |
| **State** | Kiểm soát vòng đời phiếu kho (DRAFT -> PENDING -> COMPLETED/CANCELLED). |
| **Factory** | FE render linh hoạt input xuất/nhập/điều chuyển tuỳ biến qua ModeSwitcher. |

---

## 🔍 5. Khả năng Truy vết (Device History Tracking)

Cấu trúc bảng `transaction_imei` + `transactions` + trạng thái `IN_TRANSIT` đóng vai trò theo dõi lịch sử luân chuyển thiết bị.
- Biết chính xác máy nhập từ nhà cung cấp nào (`supplier_id`).
- Xuất cho đối tác nào (`partner_name`).
- Quá trình điều chuyển qua trung gian ai xác nhận (`confirmed_by` tại thời gian `confirmed_at`).

## ⚠️ Lưu ý Quan trọng
- **Tính Nguyên tử (Atomicity)**: Nếu bất kỳ bước nào tác động Database thất bại, toàn bộ Transaction sẽ bị Rollback để tránh tình trạng mất dấu hàng hoặc kẹt trạng thái `IN_TRANSIT`.
- **Trạng thái trên Dashboard**: `inventory` với `status = IN_TRANSIT` được bóc tách riêng để tổng hợp thành dòng "Hàng đang về" cho kho đích, giúp người quản lý chủ động nắm thông tin.
