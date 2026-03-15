/**
 * WAREHOUSE TYPES
 * ================
 * DTOs và interfaces cho Warehouse module.
 */

// =============================================
// Response Shape
// =============================================
export interface WarehouseDto {
  id: number;
  name: string;
  address: string | null;
  capacity: number | null;
  assignedUsers?: Array<{
    userId: number;
    fullName: string;
    username: string;
    role: string;
  }>;
}

// =============================================
// Request DTOs
// =============================================
export interface CreateWarehouseDto {
  name: string;
  address?: string;
  capacity?: number;
}

export interface UpdateWarehouseDto {
  name?: string;
  address?: string;
  capacity?: number;
}

export interface AssignUserDto {
  user_id: number;
}
