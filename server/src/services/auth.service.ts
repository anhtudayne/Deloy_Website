import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/auth.repository";
import { LoginRequestDto, LoginResponseDto, JwtPayload } from "../types/auth.types";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Tên đăng nhập hoặc mật khẩu không chính xác.");
    this.name = "InvalidCredentialsError";
  }
}

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await authRepository.findUserByUsername(dto.username);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const assignedWarehouses = user.warehouses.map((uw) => uw.warehouse_id);
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role?.name || "Unknown",
      roleId: user.role?.id || 0,
      assignedWarehouses,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      accessToken: accessTokenn,
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
}

export const authService = new AuthService();
