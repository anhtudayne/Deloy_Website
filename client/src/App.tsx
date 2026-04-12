import React, { Suspense, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useWarehouseStore } from './store/useWarehouseStore';
import { warehouseApiService } from './services/warehouse.service';

// ─────────────────────────────────────────────
// Code Splitting: Lazy load ALL pages
// Mỗi page sẽ thành chunk riêng, chỉ tải khi user navigate tới
// ─────────────────────────────────────────────
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProductManagement = React.lazy(() => import('./pages/ProductManagement'));
const Operations = React.lazy(() => import('./pages/Operations'));
const WarehouseConfirmationPage = React.lazy(() => import('./pages/WarehouseConfirmation'));
const IMEITrackerPage = React.lazy(() => import('./pages/IMEITracker'));
const PartnerManagementPage = React.lazy(() => import('./pages/PartnerManagement'));
const Login = React.lazy(() => import('./pages/Login'));

// ─────────────────────────────────────────────
// Loading Fallback — hiển thị khi đang tải page chunk
// ─────────────────────────────────────────────
function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[14px] font-medium text-slate-400 tracking-tight">Đang tải trang...</p>
      </div>
    </div>
  );
}

// Protective Wrapper for Private Routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { setAvailableWarehouses } = useWarehouseStore();

  useEffect(() => {
    if (isAuthenticated) {
      warehouseApiService.getAllWarehouses()
        .then((data) => setAvailableWarehouses(data))
        .catch((err: Error) => console.error('Failed to load warehouses:', err));
    }
  }, [isAuthenticated, setAvailableWarehouses]);

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Route */}
        <Route path="/auth/login" element={<Login />} />

        {/* Private Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/operations" 
          element={
            <PrivateRoute>
              <Operations />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <PrivateRoute>
              <ProductManagement />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/confirmation" 
          element={
            <PrivateRoute>
              <WarehouseConfirmationPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/trace" 
          element={
            <PrivateRoute>
              <IMEITrackerPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/partners" 
          element={
            <PrivateRoute>
              <PartnerManagementPage />
            </PrivateRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

