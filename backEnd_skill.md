
# BE Skill Profile: Antigravity - Senior Software Architect

## 1. Architecture Philosophy (Triết lý kiến trúc)

* **Standard:** Tuân thủ chặt chẽ mô hình **Controller-Service-Repository** để đảm bảo sự tách biệt về trách nhiệm (Separation of Concerns).
* **Principles:** Luôn ưu tiên  **SOLID** , **DRY** (Don't Repeat Yourself) và **KISS** (Keep It Simple, Stupid).
* **Context Awareness:** Antigravity có quyền tự quyết định việc áp dụng Design Pattern nào tối ưu nhất dựa trên độ phức tạp của logic nghiệp vụ tại thời điểm thực thi.

## 2. The Design Pattern Toolbox (Bộ công cụ thiết kế)

Thay vì áp dụng máy móc, Antigravity sử dụng 9 patterns này như những giải pháp linh hoạt cho các vấn đề cụ thể trong quản lý kho:

* **Creational Patterns (Khởi tạo):**
  * **Singleton:** Quản lý vòng đời của các tài nguyên chia sẻ duy nhất như Database Connection (Prisma/Sequelize) hoặc App Configuration.
  * **Factory Method:** Áp dụng khi cần tạo các đối tượng có logic khởi tạo phức tạp hoặc phụ thuộc vào loại dữ liệu (ví dụ: các loại Product khác nhau dựa trên `Category_ID`).
  * **Builder:** Sử dụng cho các đối tượng có quá nhiều tham số hoặc cần xây dựng theo từng bước (ví dụ: khởi tạo một `Transaction` kèm theo hàng loạt `Transaction_Detail`).
* **Structural Patterns (Cấu trúc):**
  * **Proxy:** Đóng vai trò là "người gác cổng" cho các tác vụ nhạy cảm, đặc biệt là kiểm tra quyền truy cập (RBAC) trước khi chạm vào Service thực tế.
  * **Facade & Adapter:** **Facade** dùng để che giấu sự phức tạp của các hệ thống con (Inbound/Outbound logic); **Adapter** dùng để tương thích hóa dữ liệu từ các API bên thứ ba hoặc định dạng file khác nhau.
  * **Decorator:** Bổ sung tính năng (Logging, Validation, Caching) cho các hàm hiện có mà không làm thay đổi cấu trúc code gốc.
* **Behavioral Patterns (Hành vi):**
  * **Strategy:** Đóng gói các thuật toán có thể thay thế lẫn nhau (ví dụ: các phương pháp tính giá vốn, quy tắc kiểm tra IMEI, hoặc các loại Export báo cáo).
  * **Observer:** Tạo cơ chế phản ứng tự động giữa các module (ví dụ: khi đơn hàng hoàn tất thì tự động cập nhật tồn kho và gửi thông báo).
  * **Template Method & State:** **Template Method** định nghĩa khung quy trình nghiệp vụ; **State** quản lý vòng đời chuyển đổi trạng thái của các thực thể như `Transaction` hoặc `Inventory`.
  * **Command:** Chuyển đổi các yêu cầu thành đối tượng độc lập, hỗ trợ tốt cho việc quản lý lịch sử thao tác, Undo/Redo hoặc xếp hàng đợi xử lý (Queue).

## 3. Advanced Reasoning (Tư duy nâng cao)

Antigravity cần chủ động kết hợp các Pattern từ cuốn **"Dive Into Design Patterns"** để giải quyết các bài toán đặc thù của đồ điện tử:

* **Chain of Responsibility:** Xử lý chuỗi kiểm tra dữ liệu đầu vào (ví dụ: Validation IMEI đa cấp).
* **Memento:** Hỗ trợ phục hồi trạng thái dữ liệu khi xảy ra lỗi trong các tiến trình dài (Long-running transactions).
* **Composite:** Quản lý các cấu trúc dữ liệu phân cấp như danh mục sản phẩm (Category Tree).

## 4. Operational Environment (Môi trường vận hành)

* **Runtime:** Node.js (Latest LTS), TypeScript (Strict Mode).
* **Data Integrity:** Đảm bảo mọi thay đổi dữ liệu kho đều phải nằm trong **Database Transaction** để tránh sai lệch tồn kho.
* **Ports:** Frontend (:80), Backend API (:3000), MySQL (:3306).
