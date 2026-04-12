/**
 * AUTH REPOSITORY - DATA ACCESS LAYER
 * ======================================
 * Repository chỉ chịu trách nhiệm giao tiếp với Database qua Prisma.
 * Không chứa business logic.
 */

import { prisma } from "../config/database";

export interface UserWithRole {
  id: number;
  username: string;
  email: string;
  full_name: string;
  password_hash: string;
  status: string;
  role: {
    id: number;
    name: string;
  } | null;
  warehouses: {
    warehouse_id: number;
  }[];
}

class AuthRepository {
  /**
   * Tìm user theo username, bao gồm thông tin role và danh sách kho được phân công.
   * Đây là query trung tâm cho quá trình đăng nhập.
   */
  async findUserByUsername(username: string): Promise<UserWithRole | null> {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        password_hash: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouses: {
          select: {
            warehouse_id: true,
          },
        },
      },
    }) as Promise<UserWithRole | null>;
  }

  /**
   * Tìm user theo ID. Dùng trong middleware để verify token.
   */
  async findUserById(userId: number): Promise<{ id: number; status: string; role: { name: string } | null } | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        role: {
          select: { name: true },
        },
      },
    }) as any;
  }

  /**
   * Tạo User mới
   */
  async createUser(data: { username: string; email: string; full_name: string; password_hash: string }): Promise<UserWithRole> {
    const defaultRole = await prisma.role.findFirst({ where: { name: "Warehouse Staff" } });
    
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        password_hash: data.password_hash,
        status: "ACTIVE",
        role_id: defaultRole ? defaultRole.id : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        password_hash: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouses: {
          select: {
            warehouse_id: true,
          },
        },
      },
    }) as unknown as Promise<UserWithRole>;
  }

  /**
   * Tìm User bằng email
   */
  async findUserByEmail(email: string): Promise<{ id: number } | null> {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }
}

// Export singleton instance của repository
export const authRepository = new AuthRepository();
