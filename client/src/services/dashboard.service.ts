const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
    throw new Error(body.message || body.error || `HTTP ${res.status}`);
  }
  return body.data ?? body;
}

export const dashboardApiService = {
  async getStats(warehouseId?: number) {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/stats${params}`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },
  
  async getHealth(warehouseId?: number, strategy: 'speed' | 'defect' = 'speed') {
    const params = new URLSearchParams();
    if (warehouseId) params.set('warehouse_id', String(warehouseId));
    params.set('strategy', strategy);
    
    const res = await fetch(`${API_BASE}/dashboard/health?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  async getActivities(warehouseId?: number) {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/activities${params}`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  async getAlerts(warehouseId?: number) {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    const res = await fetch(`${API_BASE}/dashboard/alerts${params}`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  }
};
