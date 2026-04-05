/**
 * AUTH SERVICE - BUSINESS LOGIC LAYER
 * ======================================
 * Service xử lý toàn bộ business logic: xác thực mật khẩu, tạo JWT, v.v.
 * Không biết gì về HTTP request/response.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository";
import { LoginRequestDto, LoginResponseDto, JwtPayload, RegisterRequestDto } from "../types/auth.types";

// =============================================
// Custom Errors
// =============================================
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Tên đăng nhập hoặc mật khẩu không chính xác.");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountLockedError extends Error {
  constructor() {
    super("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    this.name = "AccountLockedError";
  }
}

export class AccountInactiveError extends Error {
  constructor() {
    super("Tài khoản của bạn chưa được kích hoạt.");
    this.name = "AccountInactiveError";
  }
}

export class UserExistsError extends Error {
  constructor() {
    super("Tên đăng nhập hoặc email đã tồn tại.");
    this.name = "UserExistsError";
  }
}

// =============================================
// Auth Service
// =============================================
class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
  }

  /**
   * Xử lý logic đăng nhập:
   * 1. Tìm user theo username
   * 2. Kiểm tra trạng thái tài khoản
   * 3. So sánh mật khẩu
   * 4. Tạo JWT payload với role + assigned_warehouses
   * 5. Ký và trả về token
   */
  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    // Bước 1: Tìm user trong DB
    const user = await authRepository.findUserByUsername(dto.username);

    // Bước 2: Kiểm tra user tồn tại (dùng thông báo mơ hồ để bảo mật)
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Bước 3: Kiểm tra trạng thái tài khoản
    if (user.status === "LOCKED") {
      throw new AccountLockedError();
    }
    if (user.status === "INACTIVE") {
      throw new AccountInactiveError();
    }

    // Bước 4: Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Bước 5: Chuẩn bị danh sách kho được phân công
    const assignedWarehouses = user.warehouses.map((uw) => uw.warehouse_id);

    // Bước 6: Tạo JWT Payload (đây là payload được nhúng vào token)
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role?.name || "Unknown",
      roleId: user.role?.id || 0,
      assignedWarehouses,
    };

    // Bước 7: Ký token
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    // Bước 8: Trả về response DTO (không bao giờ trả về password_hash!)
    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role?.name || "Unknown",
        assignedWarehouses,
      },
    };
  }

  /**
   * Đăng ký User mới
   */
  async register(dto: RegisterRequestDto): Promise<LoginResponseDto> {
    const existingUsername = await authRepository.findUserByUsername(dto.username);
    if (existingUsername) {
      throw new UserExistsError();
    }
    const existingEmail = await authRepository.findUserByEmail(dto.email);
    if (existingEmail) {
      throw new UserExistsError();
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await authRepository.createUser({
      full_name: dto.fullName,
      username: dto.username,
      email: dto.email,
      password_hash: passwordHash,
    });

    const assignedWarehouses = user.warehouses.map((uw) => uw.warehouse_id);
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role?.name || "Warehouse Staff",
      roleId: user.role?.id || 0,
      assignedWarehouses,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role?.name || "Warehouse Staff",
        assignedWarehouses,
      },
    };
  }

  /**
   * Tạo mật khẩu đã được hash. Dùng khi tạo user mới.
   */
  async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * Verify JWT token và trả về payload.
   */
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }
}

// Export singleton instance
export const authService = new AuthService();