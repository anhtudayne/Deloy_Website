/**
 * TRANSACTION API SERVICE - Frontend
 * ===================================
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface InboundItem {
  productId: number;
  unitPrice: number;
  imeiList: string[];
}

export interface InboundPayload {
  supplierId: number;
  warehouseId: number;
  notes: string;
  items: InboundItem[];
}

export interface OutboundItem {
  productId: number;
  sellingPrice: number;
  imeiList: string[];
}

export interface OutboundPayload {
  customerId: number;
  warehouseId: number;
  notes: string;
  items: OutboundItem[];
}

export interface TransferItem {
  productId: number;
  imeiList: string[];
}

export interface TransferPayload {
  sourceWarehouseId: number;
  destWarehouseId: number;
  notes: string;
  items: TransferItem[];
}

export interface TransferConfirmPayload {
  transactionId: number;
  warehouseId: number;
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

export const transactionApiService = {
  /**
   * POST /api/transactions/inbound
   */
  async createInbound(payload: InboundPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/inbound`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  /**
   * POST /api/transactions/outbound
   */
  async createOutbound(payload: OutboundPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/outbound`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  /**
   * POST /api/transactions/transfer/out
   */
  async createTransfer(payload: TransferPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/transfer/out`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  /**
   * POST /api/transactions/transfer/confirm
   */
  async confirmTransfer(payload: TransferConfirmPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/transfer/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  /**
   * GET /api/transactions/transfer/pending
   */
  async getPendingTransfers(warehouseId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/transactions/transfer/pending?warehouseId=${warehouseId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },
};
