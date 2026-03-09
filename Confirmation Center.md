# ài liệu Nghiệp vụ: Trung tâm Xác nhận & Phê duyệt (Confirmation Center)

## 1. Mục tiêu (Objective)

* **Xác nhận thực tế:** Đảm bảo hàng hóa đã thực sự cập bến kho đích trước khi tăng tồn kho khả dụng.
* **Trách nhiệm (Accountability):** Ghi nhận ai là người đã ký nhận lô hàng này (`confirmed_by`).
* **Hoàn tất vòng đời:** Chuyển trạng thái giao dịch từ `PENDING` sang `COMPLETED`.

## 2. Quy trình Nghiệp vụ (The Two-Step Flow)

### Bước 1: Hiển thị Danh sách "Hàng Đang Đến"

* **Lọc dữ liệu:** Chỉ hiển thị các giao dịch có:
  * `type = 'TRANSFER'`.
  * `dest_warehouse_id = current_warehouse_id` (Chỉ kho mình mới thấy hàng đang đến kho mình).
  * `status = 'PENDING'`.
* **Thông tin hiển thị:** Mã phiếu, Kho nguồn, Ngày gửi, Tổng số lượng máy.

### Bước 2: Kiểm đếm & Xác nhận

* **Xem chi tiết:** Nhân viên nhấn vào phiếu để xem danh sách các mã IMEI đang nằm trong lô hàng đó.
* **Hình thức xác nhận:**
  1. **Xác nhận nhanh:** Bấm "Nhận đủ" nếu tin tưởng kho nguồn.
  2. **Xác nhận từng máy:** Quét lại IMEI để khớp dữ liệu (Dùng file CSV giả lập như trang Hub).

---

## 3. Tác động Database (Atomic Transaction)

Khi bấm  **"Xác nhận nhận hàng"** , hệ thống thực hiện các bước sau trong một `Prisma.$transaction`:

1. **Cập nhật Phiếu (`transactions`):**
   * Chuyển `status` sang `COMPLETED`.
   * Cập nhật `confirmed_by = current_user_id` và `confirmed_at = now()`.
2. **Cập nhật IMEI (`product_items`):**
   * Chuyển toàn bộ IMEI trong phiếu từ `IN_TRANSIT` sang `IN_STOCK`.
   * Cập nhật `warehouse_id` chính thức về Kho đích (Kho hiện tại).
3. **Cập nhật Tồn kho (`inventory`):**
   * **Giảm** số lượng ở trạng thái `IN_TRANSIT` của Kho đích.
   * **Tăng** số lượng ở trạng thái `READY_TO_SELL` của Kho đích.

---

## 4. Giao diện (UI/UX)

* **Phong cách:** Tiếp tục dùng **Claymorphism** để đồng bộ với Hub.
* **Visual Cues:**
  * Các phiếu chờ nhận nên có một hiệu ứng "pulsing" (phát sáng nhẹ) để nhắc nhở nhân viên.
  * Sử dụng Badge màu **Lilac Clay** (#E0C3FC) cho trạng thái "Đang đến".
* **Interaction:** Hiệu ứng **Squishy Press** cho nút "Xác nhận" màu **Mint Clay** (#B2F2BB).

---
