import React, { useState, useEffect } from 'react';
import {
  FiBox,
  FiLayers,
  FiAlertTriangle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiRefreshCw,
} from 'react-icons/fi';
import StatCard from '../../components/dashboard/StatCard';
import StockChart from '../../components/dashboard/StockChart';
import CategoryDistributionChart from '../../components/dashboard/CategoryDistributionChart';
import CustomerPaymentPendingCard from '../../components/dashboard/CustomerPaymentPendingCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import LowStockList from '../../components/dashboard/LowStockList';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { reportService } from '../../services/reportService';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, lowStockRes] = await Promise.all([
        reportService.getDashboardStats(),
        productService.getLowStock(),
      ]);
      setStats(statsRes.data);
      setLowStock(lowStockRes.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return <Loader fullScreen text="Loading Inventory Dashboard..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Inventory Dashboard</h1>
          <p className="page-subtitle">Real-time overview of catalog stock, available units, low stock alerts, and daily movements</p>
        </div>
        <Button
          variant="secondary"
          icon={FiRefreshCw}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total SKUs"
          value={stats?.totalProducts ?? 0}
          subtitle="Distinct catalog items"
          icon={FiBox}
          color="primary"
          to="/products"
        />
        <StatCard
          title="Total In Stock"
          value={stats?.totalQuantity ?? 0}
          unit="Units"
          subtitle="Available in warehouse"
          icon={FiLayers}
          color="success"
          to="/products"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount ?? 0}
          subtitle="Items needing replenishment"
          icon={FiAlertTriangle}
          color={stats?.lowStockCount > 0 ? 'warning' : 'primary'}
          to="/reports/low-stock"
        />
        <StatCard
          title="Today's Stock In"
          value={(stats?.todayStockIn || 0) > 0 ? `+${stats.todayStockIn}` : '0'}
          unit="Units"
          subtitle={`${stats?.todayTransactions ?? 0} movements recorded`}
          icon={FiArrowDownLeft}
          color="success"
          to="/stock/history"
        />
        <StatCard
          title="Today's Stock Out"
          value={(stats?.todayStockOut || 0) > 0 ? `-${stats.todayStockOut}` : '0'}
          unit="Units"
          subtitle="Dispatched from warehouse"
          icon={FiArrowUpRight}
          color="danger"
          to="/stock/history"
        />
      </div>

      {/* 1. CIRCULAR GRAPH: PRODUCT TYPE DISTRIBUTION & AVAILABLE STOCK */}
      <div style={{ marginBottom: '28px' }}>
        <CategoryDistributionChart
          breakdown={stats?.productTypeBreakdown || []}
          totalStock={stats?.totalQuantity ?? 0}
        />
      </div>

      {/* 2. CIRCULAR GRAPH & TILES: CUSTOMER & PAYMENT PENDING OVERVIEW */}
      <CustomerPaymentPendingCard />

      {/* 3. TIMELINE STOCK INFLOW VS OUTFLOW CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '28px' }}>
        <StockChart />
      </div>

      {/* 3. Low Stock & Recent Activity Side-by-Side */}
      <div className="grid-2">
        <LowStockList products={lowStock.slice(0, 6)} />
        <RecentActivity activities={stats?.recentActivity || []} />
      </div>
    </div>
  );
};

export default Dashboard;
