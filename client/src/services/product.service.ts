/**
 * PRODUCT API SERVICE - Frontend
 * ================================
 * Tất cả HTTP calls đến Backend Product API.
 * Sử dụng token từ localStorage (set bởi Auth flow).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// ─────────────────────────────────────────────
// Types (mirror từ backend types)
// ─────────────────────────────────────────────
export interface ApiInventory {
  id: number;
  warehouse_id: number | null;
  quantity: number;
  status: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  image_url: string | null;
  specifications: Record<string, string> | null;
  created_at: string;
  category: { id: number; name: string } | null;
  inventory: ApiInventory[];
}

export interface ApiProductStats {
  phones: { category_name: string; category_id: number; model_count: number; total_quantity: number; sold_count: number };
  laptops: { category_name: string; category_id: number; model_count: number; total_quantity: number; sold_count: number };
  accessories: { category_name: string; category_id: number; model_count: number; total_quantity: number; sold_count: number };
  total_models: number;
  total_quantity: number;
}

export interface ApiCategory {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface ApiSupplier {
  id: number;
  company_name: string;
}

export interface ApiWarehouse {
  id: number;
  name: string;
}

export interface FormOptions {
  categories: ApiCategory[];
  warehouses: ApiWarehouse[];
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  category_id: number;
  image_url?: string;
  specifications: Record<string, string>;
  // warehouse_id và supplier_id đã được loại bỏ.
}

export interface ProductListResponse {
  data: ApiProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Product API Service
// ─────────────────────────────────────────────
export const productApiService = {
  /**
   * GET /api/products/stats
   */
  async getStats(warehouseId?: number): Promise<ApiProductStats> {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    const res = await fetch(`${API_BASE}/products/stats${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiProductStats>(res);
  },

  /**
   * GET /api/products/form-options
   */
  async getFormOptions(): Promise<FormOptions> {
    const res = await fetch(`${API_BASE}/products/form-options`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FormOptions>(res);
  },

  /**
   * GET /api/products
   */
  async getProducts(params: {
    category_id?: number;
    warehouse_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductListResponse> {
    const search = new URLSearchParams();
    if (params.category_id) search.set('category_id', String(params.category_id));
    if (params.warehouse_id) search.set('warehouse_id', String(params.warehouse_id));
    if (params.search) search.set('search', params.search);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/products?${search.toString()}`, {
      headers: getAuthHeaders(),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
    return { data: body.data, pagination: body.pagination };
  },

  /**
   * POST /api/products
   */
  async createProduct(payload: CreateProductPayload): Promise<ApiProduct> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiProduct>(res);
  },

  /**
   * PUT /api/products/:id
   */
  async updateProduct(
    id: number,
    payload: Partial<Omit<CreateProductPayload, 'warehouse_id'>>
  ): Promise<ApiProduct> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiProduct>(res);
  },

  /**
   * DELETE /api/products/:id
   */
  async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  /**
   * GET /api/products/trace/:imei
   */
  async getImeiTrace(imei: string): Promise<any> {
    const res = await fetch(`${API_BASE}/products/trace/${imei}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },
};
