-- =========================================================================
-- 1. NHÓM QUẢN LÝ NHÂN SỰ & PHÂN QUYỀN (USERS & ROLES) [cite: 31]
-- =========================================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Ví dụ: Owner, Manager, Warehouse Staff [cite: 33]
    description VARCHAR(255)
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL, -- [cite: 34]
    email VARCHAR(100) UNIQUE NOT NULL, -- [cite: 34]
    password_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã mã hóa [cite: 34]
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'ACTIVE', -- [cite: 34]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =========================================================================
-- 2. NHÓM QUẢN LÝ KHO BÃI (WAREHOUSE) [cite: 43]
-- =========================================================================

CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Tên kho [cite: 45]
    address TEXT, -- Địa chỉ [cite: 45]
    capacity INT -- Sức chứa [cite: 45]
);

-- Bảng trung gian: Phân công nhân sự làm việc tại kho [cite: 35]
CREATE TABLE user_warehouse (
    user_id INT,
    warehouse_id INT,
    PRIMARY KEY (user_id, warehouse_id), -- Một quản lý có thể quản lý nhiều kho, một kho có nhiều nhân viên [cite: 36]
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- =========================================================================
-- 3. NHÓM QUẢN LÝ HÀNG HÓA (PRODUCTS & CATEGORIES) [cite: 37]
-- =========================================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Điện thoại, Laptop, Phụ kiện [cite: 39]
    parent_id INT NULL, -- Hỗ trợ danh mục đa cấp (Ví dụ: Phụ kiện -> Ốp lưng)
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL, -- Tên công ty [cite: 40]
    phone VARCHAR(20), -- Số điện thoại [cite: 40]
    address TEXT, -- Địa chỉ [cite: 40]
    email VARCHAR(100)
);

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    address TEXT,
    customer_type ENUM('RETAIL', 'WHOLESALE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL, -- Tên sản phẩm [cite: 41]
    sku VARCHAR(100) UNIQUE NOT NULL, -- Mã SKU định danh dòng sản phẩm [cite: 41]
    image_url VARCHAR(255), -- Hình ảnh [cite: 41]
    specifications JSON, -- Trường JSON linh hoạt lưu RAM, CPU, Pin, v.v. [cite: 42]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- =========================================================================
-- 4. NHÓM TỒN KHO & ĐỊNH DANH THIẾT BỊ (INVENTORY & IMEI)
-- =========================================================================

-- Bảng lưu tổng số lượng vật lý theo trạng thái tại từng kho [cite: 46]
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT,
    product_id INT,
    quantity INT DEFAULT 0, -- Sản phẩm X đang có số lượng bao nhiêu [cite: 47]
    status ENUM('READY_TO_SELL', 'DEFECTIVE', 'IN_TRANSIT') DEFAULT 'READY_TO_SELL', -- Sẵn sàng bán, Hỏng hóc, Đang luân chuyển [cite: 47]
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(warehouse_id, product_id, status) -- Ngăn chặn lặp dòng trạng thái cho cùng 1 sản phẩm ở 1 kho
);

-- BẢNG BỔ SUNG: Quản lý chi tiết từng máy (IMEI/Serial)
CREATE TABLE product_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    warehouse_id INT,
    imei_serial VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('IN_STOCK', 'SOLD', 'WARRANTY', 'DEFECTIVE', 'IN_TRANSIT') DEFAULT 'IN_STOCK',
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- =========================================================================
-- 5. NHÓM QUẢN LÝ GIAO DỊCH (TRANSACTIONS) [cite: 48]
-- =========================================================================

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã phiếu (VD: PN001, PX002)
    type ENUM('INBOUND', 'OUTBOUND', 'TRANSFER') NOT NULL, -- Nhập, Xuất, Chuyển [cite: 51]
    status ENUM('DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    created_by INT, -- Người tạo phiếu [cite: 51]
    source_warehouse_id INT NULL, -- Kho nguồn (Dùng khi Xuất hoặc Chuyển) [cite: 51]
    dest_warehouse_id INT NULL, -- Kho đích (Dùng khi Nhập hoặc Chuyển) [cite: 51]
    supplier_id INT NULL, -- Nhà cung cấp cho INBOUND
    customer_id INT NULL, -- Khách hàng cho OUTBOUND
    confirmed_by INT NULL, -- Người xác nhận nhận hàng
    confirmed_at TIMESTAMP NULL, -- Thời gian xác nhận
    total_amount DECIMAL(15, 2) DEFAULT 0, -- Tổng tiền của toàn bộ hóa đơn [cite: 51]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo [cite: 51]
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (dest_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

-- Chi tiết các dòng sản phẩm trong một phiếu giao dịch [cite: 52]
CREATE TABLE transaction_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    product_id INT,
    quantity INT NOT NULL, -- Số lượng bao nhiêu [cite: 53]
    unit_price DECIMAL(15, 2) NOT NULL, -- Đơn giá lúc đó là bao nhiêu [cite: 53]
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- BẢNG BỔ SUNG: Gắn mã IMEI cụ thể vào từng chi tiết giao dịch
-- Khi nhập hàng hoặc xuất hàng, phải biết chính xác IMEI nào được giao dịch
CREATE TABLE transaction_imei (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_detail_id INT,
    product_item_id INT,
    FOREIGN KEY (transaction_detail_id) REFERENCES transaction_details(id) ON DELETE CASCADE,
    FOREIGN KEY (product_item_id) REFERENCES product_items(id)
);

-- =========================================================================
-- 6. DỮ LIỆU MẪU KHỞI TẠO (SEED DATA)
-- =========================================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'System Administrator'),
('Manager', 'Warehouse Manager');

-- Password cho cả 2 tài khoản: 123456
INSERT INTO users (role_id, full_name, username, email, password_hash, status) VALUES
(1, 'Admin User', 'admin', 'admin@f4.com', '$2a$12$HtNLYu/UlIQ2lYf5Fdt09OAM2gFCLnvhkIXFDBFE3j0LEIZWGwvGe', 'ACTIVE'),
(2, 'Manager User', 'manager', 'manager@f4.com', '$2a$12$HtNLYu/UlIQ2lYf5Fdt09OAM2gFCLnvhkIXFDBFE3j0LEIZWGwvGe', 'ACTIVE');

-- Warehouses
INSERT INTO warehouses (name, address, capacity) VALUES
('Warehouse North', 'Address 1', 1500),
('Warehouse South', 'Address 2', 2000),
('Warehouse East', 'Address 3', 2500),
('Warehouse West', 'Address 4', 3000),
('Warehouse Central', 'Address 5', 3500);

-- User assignment to warehouses
INSERT INTO user_warehouse (user_id, warehouse_id) VALUES
(2, 1), (2, 2),
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- Categories, supplier, customer
INSERT INTO categories (name, parent_id) VALUES
('Điện thoại', NULL),
('Laptop', NULL),
('Phụ kiện', NULL);

INSERT INTO suppliers (company_name, phone, address, email) VALUES
('Tech Corp', '123456789', 'Tech Street', 'contact@techcorp.com');

INSERT INTO customers (full_name, phone, email, address, customer_type) VALUES
('Retail Customer', '0900000001', 'retail@customer.com', 'Retail Address', 'RETAIL'),
('Wholesale Customer', '0900000002', 'wholesale@customer.com', 'Wholesale Address', 'WHOLESALE');

-- Products
INSERT INTO products (category_id, name, sku, image_url, specifications) VALUES
(1, 'Smartphone Model 1', 'TECH-PHONE-1', 'https://example.com/phone1.jpg', JSON_OBJECT('ram', '8GB', 'storage', '256GB', 'screen', '6.5 inch OLED', 'battery', '4500mAh')),
(1, 'Smartphone Model 2', 'TECH-PHONE-2', 'https://example.com/phone2.jpg', JSON_OBJECT('ram', '12GB', 'storage', '512GB', 'screen', '6.7 inch OLED', 'battery', '5000mAh')),
(2, 'Pro Laptop 1', 'TECH-LAP-1', 'https://example.com/laptop1.jpg', JSON_OBJECT('cpu', 'Intel Core i7', 'ram', '16GB', 'storage', '1TB SSD', 'screen', '15.6 inch IPS')),
(3, 'Premium Headphone 1', 'TECH-ACC-1', 'https://example.com/acc1.jpg', JSON_OBJECT('type', 'Wireless', 'batteryLife', '20 hours', 'noiseCancellation', TRUE));

-- Inventory per warehouse/product/status
INSERT INTO inventory (warehouse_id, product_id, quantity, status) VALUES
(1, 1, 20, 'READY_TO_SELL'),
(1, 1, 2, 'DEFECTIVE'),
(1, 2, 15, 'READY_TO_SELL'),
(1, 3, 10, 'READY_TO_SELL'),
(2, 1, 12, 'READY_TO_SELL'),
(2, 2, 8, 'READY_TO_SELL'),
(2, 4, 25, 'READY_TO_SELL'),
(3, 3, 7, 'READY_TO_SELL'),
(4, 4, 5, 'IN_TRANSIT'),
(5, 1, 3, 'IN_TRANSIT');

-- IMEI/Serial sample items
INSERT INTO product_items (product_id, warehouse_id, imei_serial, status) VALUES
(1, 1, 'IMEI-1-1-001', 'IN_STOCK'),
(1, 1, 'IMEI-1-1-002', 'IN_STOCK'),
(1, 1, 'IMEI-1-1-003', 'IN_STOCK'),
(2, 1, 'IMEI-2-1-001', 'IN_STOCK'),
(2, 2, 'IMEI-2-2-001', 'IN_STOCK'),
(3, 1, 'IMEI-3-1-001', 'IN_STOCK'),
(4, 2, 'IMEI-4-2-001', 'IN_STOCK');

-- Transactions and details
INSERT INTO transactions (
    code, type, status, created_by, source_warehouse_id, dest_warehouse_id, supplier_id, customer_id, confirmed_by, confirmed_at, total_amount
) VALUES
('INB-001', 'INBOUND', 'COMPLETED', 1, NULL, 1, 1, NULL, 1, NOW(), 4500.00),
('OUT-001', 'OUTBOUND', 'COMPLETED', 1, 2, NULL, NULL, 1, 1, NOW(), 4000.00);

INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price) VALUES
(1, 1, 3, 1500.00),
(2, 2, 2, 2000.00);

INSERT INTO transaction_imei (transaction_detail_id, product_item_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(2, 5);