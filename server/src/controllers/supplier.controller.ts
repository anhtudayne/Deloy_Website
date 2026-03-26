import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service";

export class SupplierController {
  static async getAllSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await SupplierService.getAllSuppliers();
      return res.status(200).json({ success: true, data: suppliers });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async createSupplier(req: Request, res: Response) {
    try {
      const supplier = await SupplierService.createSupplier(req.body);
      return res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
