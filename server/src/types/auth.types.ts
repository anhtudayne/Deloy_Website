/**
 * AUTH TYPES
 * ============
 * Định nghĩa tất cả các TypeScript interfaces & types cho module Auth.
 */

// =============================================
// JWT Payload - Thông tin được mã hóa trong token
// =============================================
export interface JwtPayload {
  userId: number;
  username: string;
  role: string;           // Tên role: "Owner", "Manager", "Warehouse Staff"
  roleId: number;
  assignedWarehouses: number[]; // Danh sách warehouse_id được phân công
  iat?: number;
  exp?: number;
}

// =============================================
// Request mở rộng - Gắn user vào Request object
// =============================================
export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

// =============================================
// DTO (Data Transfer Objects) cho API
// =============================================
export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
    assignedWarehouses: number[];
  };
}

// =============================================
// Role Constants - Tập trung quản lý tên role
// =============================================
export enum RoleName {
  OWNER = "Admin",
  MANAGER = "Manager",
  STAFF = "Warehouse Staff",
}
