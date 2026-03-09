import { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service";

export class CustomerController {
  static async getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await CustomerService.getAllCustomers();
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const customer = await CustomerService.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
      }
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const customer = await CustomerService.updateCustomer(id, req.body);
      res.status(200).json({ success: true, data: customer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await CustomerService.deleteCustomer(id);
      res.status(200).json({ success: true, message: "Xoá khách hàng thành công" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
