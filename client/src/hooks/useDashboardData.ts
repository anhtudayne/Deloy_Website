import { useState, useCallback, useEffect } from 'react';
import { dashboardApiService } from '../services/dashboard.service';

export function useDashboardData(warehouseId?: number) {
  const [stats, setStats] = useState<any>(null);
  const [healthSpeed, setHealthSpeed] = useState<any>(null);
  const [healthDefect, setHealthDefect] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dsStats, dsSpeed, dsDefect, dsAct, dsAlerts] = await Promise.all([
        dashboardApiService.getStats(warehouseId),
        dashboardApiService.getHealth(warehouseId, 'speed'),
        dashboardApiService.getHealth(warehouseId, 'defect'),
        dashboardApiService.getActivities(warehouseId),
        dashboardApiService.getAlerts(warehouseId),
      ]);
      setStats(dsStats);
      setHealthSpeed(dsSpeed);
      setHealthDefect(dsDefect);
      setActivities(dsAct);
      setAlerts(dsAlerts);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, healthSpeed, healthDefect, activities, alerts, loading, refetch: fetchAll };
}
