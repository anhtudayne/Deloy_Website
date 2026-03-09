import { Request, Response, NextFunction } from "express";
import { SupplierService } from "../services/supplier.service";

export class SupplierController {
  static async getAllSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await SupplierService.getAllSuppliers();
      res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async getSupplierById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const supplier = await SupplierService.getSupplierById(id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhà cung cấp" });
      }
      res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.createSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const supplier = await SupplierService.updateSupplier(id, req.body);
      res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await SupplierService.deleteSupplier(id);
      res.status(200).json({ success: true, message: "Xoá nhà cung cấp thành công" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
