/**
 * useWarehouseStore — Zustand Global State (Observer Pattern)
 * =============================================================
 * Observer Pattern via Zustand: đồng bộ Warehouse Selector toàn app tức thì.
 * Guideline: "Observer Pattern (Global State Pub/Sub): đồng bộ hóa việc thay đổi
 * Warehouse Selection trên toàn bộ Components mà không cần truyền props phức tạp."
 *
 * Bất kỳ component nào cũng có thể:
 *   const { selectedWarehouseId, setWarehouse } = useWarehouseStore()
 * Khi setWarehouse() được gọi → tất cả subscriber tự động re-render.
 */

import { create } from 'zustand';

export interface WarehouseOption {
  id: number;
  name: string;
}

interface WarehouseState {
  /** ID kho đang được chọn. null = xem tất cả (chỉ Owner) */
  selectedWarehouseId: number | null;
  /** Danh sách kho có thể chọn (được nạp từ API) */
  availableWarehouses: WarehouseOption[];

  /** Chọn một kho cụ thể */
  setWarehouse: (id: number | null) => void;
  /** Nạp danh sách kho từ API response */
  setAvailableWarehouses: (warehouses: WarehouseOption[]) => void;
  /** Reset về trạng thái ban đầu (khi logout) */
  reset: () => void;
}

const STORAGE_KEY = 'f4wms_selected_warehouse';

export const useWarehouseStore = create<WarehouseState>((set) => ({
  // Persist selectedWarehouseId qua localStorage
  selectedWarehouseId: (() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : null;
  })(),
  availableWarehouses: [],

  setWarehouse: (id) => {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
    set({ selectedWarehouseId: id });
  },

  setAvailableWarehouses: (warehouses) => {
    set({ availableWarehouses: warehouses });
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ selectedWarehouseId: null, availableWarehouses: [] });
  },
}));
