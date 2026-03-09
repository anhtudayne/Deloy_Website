import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import Operations from './pages/Operations';
import WarehouseConfirmationPage from './pages/WarehouseConfirmation';
import IMEITrackerPage from './pages/IMEITracker';
import PartnerManagementPage from './pages/PartnerManagement';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';
import { useWarehouseStore } from './store/useWarehouseStore';
import { warehouseApiService } from './services/warehouse.service';
// Protective Wrapper for Private Routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
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
  );
}

