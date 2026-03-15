# Tài liệu Nghiệp vụ: Trung tâm Quản lý Đối tác (Partner Hub)

## 1. Mục tiêu (Objective)

* **Số hóa danh bạ:** Quản lý tập trung thông tin Nhà cung cấp (Suppliers) và Khách hàng/Đại lý (Customers).
* **Kiểm soát công nợ:** Theo dõi tổng số tiền đã giao dịch và số dư nợ với từng đối tác.
* **Đánh giá uy tín:** Dựa vào dữ liệu giao dịch để phân loại đối tác VIP hoặc đối tác có tỷ lệ hàng lỗi cao.

## 2. Cấu trúc Dữ liệu & Mở rộng DB

Để chuyên nghiệp nhất, Thắng nên gộp chung vào một bảng `partners` hoặc tách riêng nhưng có cấu trúc tương đồng. Theo bộ DB hiện tại, chúng ta sẽ chuẩn hóa như sau:

* **Tab 1: Nhà cung cấp (Suppliers):** Lấy từ bảng `suppliers` đã có.
* **Tab 2: Khách hàng (Customers):** Cần tạo thêm bảng `customers` để thay thế cho trường `partner_name` (vốn chỉ là text thuần túy).

### SQL Update (Bổ sung bảng Khách hàng):

**SQL**

```
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    address TEXT,
    customer_type ENUM('RETAIL', 'WHOLESALE') DEFAULT 'RETAIL', -- Khách lẻ hoặc Đại lý
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cập nhật lại bảng transactions để liên kết với ID khách hàng thay vì chỉ lưu tên
ALTER TABLE transactions 
ADD COLUMN customer_id INT NULL,
ADD CONSTRAINT fk_trans_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
```

---

## 3. Các tính năng chính (Features)

### A. Danh sách Đối tác (Partner Directory)

* **Giao diện:** Dùng **Bento Grid** để hiển thị các thẻ đối tác theo phong cách  **Claymorphism** .
* **Quick Stats:** Mỗi thẻ hiển thị nhanh: *Tổng đơn hàng* và  *Trạng thái nợ hiện tại* .

### B. Hồ sơ chi tiết (Partner Profile)

Khi nhấn vào một đối tác, hệ thống hiển thị:

1. **Thông tin liên hệ:** Gọi điện/Gửi mail nhanh.
2. **Lịch sử giao dịch:** Danh sách các phiếu Nhập (với Supplier) hoặc Xuất (với Customer) liên quan.
3. **Phân tích sản phẩm:** Danh sách các Model sản phẩm thường xuyên giao dịch với đối tác này.

---

## 4. UI/UX Style (Stitch Standard)

* **Phân biệt màu sắc:**
  * **Nhà cung cấp:** Sử dụng tông màu `Mint Clay` (#B2F2BB) để đồng bộ với luồng Nhập kho.
  * **Khách hàng:** Sử dụng tông màu `Pink Clay` (#FFD1DC) để đồng bộ với luồng Xuất kho.
* **Tương tác:** Các ô nhập liệu (Input) có `borderRadius: 24px` và hiệu ứng **Inset Shadow** sâu để tạo cảm giác mềm mại.
