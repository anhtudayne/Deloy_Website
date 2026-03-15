import DatabaseClient from "../config/database";
import { Prisma } from "@prisma/client";

const prisma = DatabaseClient.getInstance();

export class SupplierService {
  static async getAllSuppliers() {
    return await prisma.supplier.findMany({
      orderBy: { id: "desc" },
    });
  }

  static async getSupplierById(id: number) {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 10,
          orderBy: { created_at: "desc" },
        },
      },
    });
  }

  static async createSupplier(data: Prisma.SupplierCreateInput) {
    // Validation
    if (data.phone) {
      const existingPhone = await prisma.supplier.findFirst({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        throw new Error("Số điện thoại đã tồn tại trong hệ thống");
      }
    }

    if (data.email) {
      const existingEmail = await prisma.supplier.findFirst({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error("Email đã tồn tại trong hệ thống");
      }
    }

    return await prisma.supplier.create({
      data,
    });
  }

  static async updateSupplier(id: number, data: Prisma.SupplierUpdateInput) {
    if (data.phone) {
      const existingPhone = await prisma.supplier.findFirst({
        where: { phone: data.phone as string, id: { not: id } },
      });
      if (existingPhone) {
        throw new Error("Số điện thoại đã tồn tại trong hệ thống");
      }
    }

    if (data.email) {
      const existingEmail = await prisma.supplier.findFirst({
        where: { email: data.email as string, id: { not: id } },
      });
      if (existingEmail) {
        throw new Error("Email đã tồn tại trong hệ thống");
      }
    }

    return await prisma.supplier.update({
      where: { id },
      data,
    });
  }

  static async deleteSupplier(id: number) {
    // Check constraints if necessary (e.g. existing transactions)
    const existingTransactions = await prisma.transaction.count({
      where: { supplier_id: id },
    });
    if (existingTransactions > 0) {
      throw new Error("Không thể xoá nhà cung cấp đã có giao dịch");
    }

    return await prisma.supplier.delete({
      where: { id },
    });
  }
}
