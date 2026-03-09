/**
 * useProductStats — Custom Hook
 * ================================
 * Đóng gói data-fetching logic cho statistics cards.
 * Tách biệt hoàn toàn khỏi ProductManagement component.
 */

import { useState, useCallback, useEffect } from 'react';
import { productApiService, ApiProductStats } from '../services/product.service';

export interface ProductStatsHookResult {
  stats: ApiProductStats | null;
  loading: boolean;
  refetch: () => void;
}

export function useProductStats(warehouseId?: number): ProductStatsHookResult {
  const [stats, setStats] = useState<ApiProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApiService.getStats(warehouseId);
      setStats(data);
    } catch (err) {
      console.error('[useProductStats] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
