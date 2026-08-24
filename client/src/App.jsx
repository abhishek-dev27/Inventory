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

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

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
        <Route path="customers" element={<Customers />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="products" element={<Products />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="stock/in" element={<StockIn />} />
        <Route path="stock/out" element={<StockOut />} />
        <Route path="stock/history" element={<StockHistory />} />
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
        <Route path="reports" element={<Reports />} />
        <Route path="reports/daily" element={<DailyReports />} />
        <Route path="reports/monthly" element={<MonthlyReports />} />
        <Route path="reports/usage" element={<UsageReports />} />
        <Route path="reports/customers" element={<CustomerReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
