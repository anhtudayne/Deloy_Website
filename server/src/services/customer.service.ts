import DatabaseClient from "../config/database";
import { Prisma } from "@prisma/client";

const prisma = DatabaseClient.getInstance();

export class CustomerService {
  static async getAllCustomers() {
    return await prisma.customer.findMany({
      orderBy: { id: "desc" },
    });
  }

  static async getCustomerById(id: number) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 10,
          orderBy: { created_at: "desc" },
        },
      },
    });
  }

  static async createCustomer(data: Prisma.CustomerCreateInput) {
    // Validation
    if (data.phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        throw new Error("Số điện thoại đã tồn tại trong hệ thống");
      }
    }

    if (data.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error("Email đã tồn tại trong hệ thống");
      }
    }

    return await prisma.customer.create({
      data,
    });
  }

  static async updateCustomer(id: number, data: Prisma.CustomerUpdateInput) {
    if (data.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { phone: data.phone as string, id: { not: id } },
      });
      if (existingPhone) {
        throw new Error("Số điện thoại đã tồn tại trong hệ thống");
      }
    }

    if (data.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: { email: data.email as string, id: { not: id } },
      });
      if (existingEmail) {
        throw new Error("Email đã tồn tại trong hệ thống");
      }
    }

    return await prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async deleteCustomer(id: number) {
    const existingTransactions = await prisma.transaction.count({
      where: { customer_id: id },
    });
    if (existingTransactions > 0) {
      throw new Error("Không thể xoá khách hàng đã có giao dịch");
    }

    return await prisma.customer.delete({
      where: { id },
    });
  }
}
