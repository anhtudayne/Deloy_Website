/**
 * WAREHOUSE API SERVICE - Frontend
 * ================================
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface ApiWarehouse {
  id: number;
  name: string;
  address: string | null;
  capacity: number | null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return body.data ?? body;
}

export const warehouseApiService = {
  /**
   * GET /api/warehouses
   */
  async getAllWarehouses(): Promise<ApiWarehouse[]> {
    const res = await fetch(`${API_BASE}/warehouses`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiWarehouse[]>(res);
  },

  /**
   * POST /api/warehouses
   */
  async createWarehouse(payload: { name: string; address?: string; capacity?: number }): Promise<ApiWarehouse> {
    const res = await fetch(`${API_BASE}/warehouses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiWarehouse>(res);
  },
};
