/**
 * useProducts — Custom Hook (Container/Presenter Pattern)
 * =========================================================
 * Đóng gói toàn bộ data-fetching logic cho danh sách sản phẩm.
 * Theo guideline: "Custom Hooks: Đóng gói logic nghiệp vụ vào Hooks"
 *
 * Presenter component chỉ cần nhận { products, loading, error, refetch } —
 * không cần biết gì về fetch logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { productApiService, ApiProduct } from '../services/product.service';

export interface ProductFilters {
  category_id?: number;
  warehouse_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsHookResult {
  products: ApiProduct[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(filters: ProductFilters): ProductsHookResult {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productApiService.getProducts({
        category_id: filters.category_id,
        warehouse_id: filters.warehouse_id,
        search: filters.search,
        page: filters.page,
        limit: filters.limit ?? 50,
      });
      setProducts(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải sản phẩm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    filters.category_id,
    filters.warehouse_id,
    filters.search,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, total, loading, error, refetch: fetchProducts };
}
