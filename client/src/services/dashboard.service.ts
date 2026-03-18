const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const call = async (url: string) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {} } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return body.data ?? body;
};

export const dashboardApiService = {
  getStats: (id?: number) => call(`${API_BASE}/dashboard/stats${id ? `?warehouse_id=${id}` : ''}`),
  getHealth: (id?: number, strategy = 'speed') => call(`${API_BASE}/dashboard/health?${new URLSearchParams({ ...(id && { warehouse_id: String(id) }), strategy }).toString()}`),
};
