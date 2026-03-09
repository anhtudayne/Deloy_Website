import { create } from 'zustand';

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
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return body.data ?? body;
}

interface PartnerState {
  suppliers: any[];
  customers: any[];
  isLoading: boolean;
  fetchPartners: () => Promise<void>;
  addSupplier: (data: any) => Promise<void>;
  addCustomer: (data: any) => Promise<void>;
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  suppliers: [],
  customers: [],
  isLoading: false,

  fetchPartners: async () => {
    set({ isLoading: true });
    try {
      const [supplierRes, customerRes] = await Promise.all([
        fetch(`${API_BASE}/suppliers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/customers`, { headers: getAuthHeaders() }),
      ]);
      const suppliersData = await handleResponse<any[]>(supplierRes);
      const customersData = await handleResponse<any[]>(customerRes);
      
      set({
        suppliers: suppliersData,
        customers: customersData,
        isLoading: false,
      });
    } catch (error) {
      console.error('Lỗi khi fetch partners:', error);
      set({ isLoading: false });
    }
  },

  addSupplier: async (data: any) => {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    await handleResponse(res);
    await get().fetchPartners();
  },

  addCustomer: async (data: any) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    await handleResponse(res);
    await get().fetchPartners();
  },
}));
