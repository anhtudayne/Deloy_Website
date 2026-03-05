# Database Schema Design (CoffatDev)

## Core Entities
| Table | Purpose |
|---|---|
| `User` | Hệ thống người dùng với RBAC (OWNER / MANAGER / STAFF) |
| `Warehouse` | Kho hàng vật lý, nhiều kho cho 1 owner |
| `Product` | Sản phẩm, hỗ trợ IMEI tracking |
| `Inventory` | Tồn kho theo từng kho + trạng thái |
| `Transaction` | Phiếu nhập/xuất/chuyển kho |
| `TransactionDetail` | Chi tiết từng dòng hàng |
| `IMEIRecord` | Lịch sử theo dõi IMEI |
| `Customer` / `Supplier` | Đối tác (khách hàng / nhà cung cấp) |

## Key Design Decisions
- IMEI tracking is optional per product (`track_imei: Boolean`)
- Transfers are 2-phase: PENDING → CONFIRMED (Chain of Responsibility)
- All warehouse access is enforced at middleware level (Proxy Pattern)
