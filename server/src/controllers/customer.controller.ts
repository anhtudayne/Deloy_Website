import { Request, Response } from "express";
import { CustomerService } from "../services/customer.service";

export class CustomerController {
  static async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await CustomerService.getAllCustomers();
      return res.status(200).json({ success: true, data: customers });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      return res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
