import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import Accounts from './pages/accounts/Accounts';
import Products from './pages/products/Products';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';
import StockIn from './pages/stock/StockIn';
import StockOut from './pages/stock/StockOut';
import StockHistory from './pages/stock/StockHistory';
import UserManagement from './pages/users/UserManagement';
import ActivityLogs from './pages/activity/ActivityLogs';
import Reports from './pages/reports/Reports';
import DailyReports from './pages/reports/DailyReports';
import MonthlyReports from './pages/reports/MonthlyReports';
import UsageReports from './pages/reports/UsageReports';
import CustomerReports from './pages/reports/CustomerReports';
import Loader from './components/common/Loader';

const ProtectedRoute = ({ children, adminOnly = false, requiredModule = null }) => {
  const { user, loading, hasModuleAccess } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (requiredModule && hasModuleAccess && !hasModuleAccess(requiredModule)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="customers"
          element={
            <ProtectedRoute requiredModule="customers">
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="accounts"
          element={
            <ProtectedRoute requiredModule="accounts">
              <Accounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute requiredModule="products">
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/add"
          element={
            <ProtectedRoute requiredModule="products">
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/edit/:id"
          element={
            <ProtectedRoute requiredModule="products">
              <EditProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="stock/in"
          element={
            <ProtectedRoute requiredModule="stock_in">
              <StockIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="stock/out"
          element={
            <ProtectedRoute requiredModule="stock_out">
              <StockOut />
            </ProtectedRoute>
          }
        />
        <Route
          path="stock/history"
          element={
            <ProtectedRoute requiredModule="stock_history">
              <StockHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute adminOnly>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity-logs"
          element={
            <ProtectedRoute adminOnly>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredModule="reports">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/daily"
          element={
            <ProtectedRoute requiredModule="reports">
              <DailyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/monthly"
          element={
            <ProtectedRoute requiredModule="reports">
              <MonthlyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/usage"
          element={
            <ProtectedRoute requiredModule="reports">
              <UsageReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/customers"
          element={
            <ProtectedRoute requiredModule="reports">
              <CustomerReports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
