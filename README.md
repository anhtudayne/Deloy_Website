# 📦 F4-WareHouse - Next-Gen WMS (2026 Edition)

<div align="center">

<img src="./banner.png" alt="F4 WareHouse Banner" width="800">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tail-wind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma_5-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

**F4-WareHouse** là hệ thống quản lý kho hàng (WMS) đỉnh cao được thiết kế với ngôn ngữ **3D Claymorphism** và **Bento Grid** hiện đại của năm 2026. Một giải pháp mạnh mẽ, mượt mà và trực quan cho việc vận hành kho bãi.

[✨ Live Demo](https://f4-warehouse.vercel.app) • [📚 Tài liệu](https://github.com/Coffat/F4-WareHouse/wiki) • [🐛 Báo lỗi](https://github.com/Coffat/F4-WareHouse/issues)

</div>

---

## 🚀 Tính Năng Nổi Bật (2026 Trends)

### 🎨 Giao Diện Candy Pastels & Claymorphism
Hệ thống sử dụng palette màu **Mint, Lilac và Pink Clay** dịu mắt kết hợp với hiệu ứng đổ bóng kép (Dual-shadow) tạo cảm giác vật liệu 3D "mềm mại" như những viên kẹo.

### 🍱 Dashboard Bento Grid
Mọi thông số sức khỏe kho hàng được gói gọn trong các ô lưới Bento linh hoạt, giúp nhà quản lý nắm bắt toàn bộ trạng thái hệ thống chỉ trong 3 giây.

### 🔍 Quản lý IMEI & Serial Thông Minh
- **Continuous Input:** Hỗ trợ quét mã vạch liên tục, tốc độ cao.
- **Import/Export:** Tích hợp nhập liệu từ Excel/CSV với thanh tiến độ xử lý dữ liệu thời gian thực.
- **Tracking 360:** Truy vết từng sản phẩm dựa trên IMEI xuyên suốt vòng đời (Nhập -> Chuyển kho -> Xuất).

### 🏢 Đa Kho Hàng (Multi-warehouse)
Chuyển đổi ngữ cảnh làm việc giữa các kho hàng ngay lập tức mà không cần tải lại trang (Zero-latency Context Switch).

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Zustand | UI/UX mượt mà, State management siêu nhẹ |
| **Backend** | Node.js, Express, Prisma | API chuẩn RESTful, Type-safe database access |
| **Database** | MySQL, Redis | Lưu trữ dữ liệu quan hệ và caching hiệu năng cao |
| **Styling** | Tailwind 4.0, Framer Motion | Claymorphism effects & Micro-interactions |
| **DevOps** | Docker, GitHub Actions | CI/CD hiện đại, triển khai nhanh chóng |

---

## 📂 Cấu Trúc Dự Án

```mermaid
graph TD
    A[Root] --> B[client]
    A --> C[server]
    B --> B1[src/pages]
    B --> B2[src/components]
    B --> B3[src/store]
    C --> C1[prisma]
    C --> C2[src/controllers]
    C --> C3[src/routes]
    C --> C4[src/services]
```

---

## 🏗️ Hướng Dẫn Cài Đặt

### Tiền đề
- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **Docker** (Tùy chọn cho việc chạy database nhanh)

### Quá trình cài đặt

1. **Clone dự án & Cài đặt dependencies:**
   ```bash
   git clone https://github.com/Coffat/F4-WareHouse.git
   cd F4-WareHouse
   
   # Cài cho Server
   cd server && npm install
   
   # Cài cho Client
   cd ../client && npm install
   ```

2. **Cấu hình biến môi trường (.env):**
   - Copy `.env.example` thành `.env` trong folder `server`.
   - Cập nhật `DATABASE_URL` (ví dụ: `mysql://root:password@localhost:3306/wms_db`).

3. **Khởi tạo Database (Prisma):**
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   > Dữ liệu mẫu đã được khởi tạo trực tiếp từ `db.sql` khi chạy MySQL bằng Docker Compose.

4. **Chạy dự án:**
   - **Backend:** `npm run dev` (Port 5000)
   - **Frontend:** `npm run dev` (Port 5173)

---

## 🗺️ Sơ Đồ Cơ Sở Dữ Liệu (Simplified)

```mermaid
erDiagram
    User ||--o{ Warehouse : "manages"
    Warehouse ||--o{ Inventory : "contains"
    Product ||--o{ Inventory : "stored_in"
    Product ||--o{ ProductItem : "has_imeis"
    Transaction ||--|{ TransactionDetail : "includes"
    TransactionDetail ||--o{ TransactionImei : "tracks"
```

---

## 🤝 Thành Viên Phát Triển

Dự án được phát triển bởi team **F4**.

- **Vũ Thắng** - Lead & Backend Architect
- **Antigravity** - UI/UX Designer & Frontend Engineer (AI Assistant)

---

<div align="center">
  <p>Được tạo ra với ❤️ cho tương lai của ngành Logistics.</p>
  <p>© 2026 F4 Team. All rights reserved.</p>
</div>
