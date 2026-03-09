# Tài liệu Nghiệp vụ: Tra cứu & Truy vết Vòng đời IMEI (IMEI Traceability)

## 1. Mục tiêu (Objective)

* **Minh bạch hóa dữ liệu:** Hiển thị toàn bộ hành trình của một thiết bị từ lúc nhập kho đến khi xuất bán hoặc điều chuyển.
* **Hỗ trợ bảo hành:** Xác định chính xác ngày bán, khách hàng và thời hạn bảo hành dựa trên mã IMEI.
* **Kiểm soát thất thoát:** Phát hiện các bất thường trong quá trình luân chuyển giữa các kho.

## 2. Cấu trúc thông tin (Information Architecture)

Giao diện sẽ chia làm 3 phần chính theo phong cách  **Claymorphism** :

### A. Thanh tìm kiếm thông minh (Smart Search)

* Một ô Input lớn với hiệu ứng  **Inset Shadow** , hỗ trợ quét mã IMEI hoặc nhập tay.
* Sử dụng **Debounce kỹ thuật** để gợi ý mã IMEI ngay khi người dùng đang nhập.

### B. Thông tin hồ sơ máy (Product Profile)

* Hiển thị ảnh sản phẩm, tên Model, SKU và cấu hình (JSON specs).
* **Trạng thái hiện tại:** Một Badge nổi bật (Ví dụ: `Lưu kho`, `Đã bán`, `Đang vận chuyển`).

### C. Dòng thời gian lịch sử (The Life Timeline)

Đây là phần "ăn tiền" nhất, sử dụng dữ liệu từ bảng `transaction_imei` join với `transactions` và `users`:

1. **Điểm khởi đầu (Nhập kho):** Ngày nhập, Nhà cung cấp, Giá nhập, Người thực hiện.
2. **Quá trình luân chuyển:** Danh sách các lần chuyển kho (Từ kho A -> Kho B), thời gian và người xác nhận.
3. **Điểm kết thúc (Xuất kho):** Ngày bán, Tên khách hàng, Giá bán, Nhân viên xuất hàng.

---

## 3. Logic Backend (The Trace Engine)

Để lấy được "Sơ yếu lý lịch" này, Antigravity cần thực hiện một câu truy vấn (Query) phức tạp kết hợp nhiều bảng:

* **Step 1:** Tìm `product_item_id` từ mã `imei_serial` người dùng cung cấp.
* **Step 2:** Join bảng `transaction_imei` với `transaction_details` và `transactions` để lấy danh sách các giao dịch liên quan.
* **Step 3:** Sắp xếp các giao dịch theo `created_at` từ cũ đến mới để tạo thành một dòng thời gian liên tục.
* **Step 4 (Optimization):** Sử dụng **Include** trong Prisma để lấy kèm thông tin `User` (người tạo) và `Warehouse` (nơi thực hiện) trong một lần truy vấn duy nhất.

---

## 4. Giao diện UI (Stitch Style)

* **Timeline UI:** Sử dụng các đường nối mềm mại giữa các mốc thời gian, mỗi mốc là một khối Claymorphism nhỏ.
* **Màu sắc chỉ báo:**
  * Nhập kho: Màu **Mint Clay** (#B2F2BB).
  * Điều chuyển: Màu **Lilac Clay** (#E0C3FC).
  * Xuất bán: Màu **Pink Clay** (#FFD1DC).
* **Hiệu ứng:** Khi di chuột (Hover) vào một mốc thời gian, khối đó sẽ phồng to nhẹ (Scale up) để hiển thị chi tiết người thực hiện.
