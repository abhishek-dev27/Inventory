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
import GodownDistributionCard from '../../components/dashboard/GodownDistributionCard';
import CustomerPaymentPendingCard from '../../components/dashboard/CustomerPaymentPendingCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import LowStockList from '../../components/dashboard/LowStockList';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { reportService } from '../../services/reportService';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, isAdmin, hasModuleAccess } = useAuth();

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

  const assignedLocation = user?.assignedLocation || stats?.assignedLocation || 'Branch';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? 'Executive Inventory Dashboard' : `${assignedLocation} Godown Dashboard`}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Real-time overview of catalog stock, available units, low stock alerts, and daily movements across all branches'
              : `Real-time catalog stock, available units, and daily inward/outward movements for ${assignedLocation} godown`}
          </p>
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

      {/* Staff Dedicated Branch Scope Banner */}
      {!isAdmin && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 184, 148, 0.08)',
            border: '1px solid rgba(0, 184, 148, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏢</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                Designated Workplace: {assignedLocation} Godown
              </strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You have authorized access strictly scoped to this godown's catalog, stock transactions, and inventory.
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'var(--success)',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Authorized Branch
          </span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total SKUs"
          value={stats?.totalProducts ?? 0}
          subtitle={isAdmin ? 'Distinct catalog items' : `Items in ${assignedLocation}`}
          icon={FiBox}
          color="primary"
          to="/products"
        />
        <StatCard
          title="Total In Stock"
          value={stats?.totalQuantity ?? 0}
          unit="Units"
          subtitle={`Available in ${isAdmin ? 'all warehouses' : assignedLocation}`}
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
          subtitle={`Dispatched from ${isAdmin ? 'warehouse' : assignedLocation}`}
          icon={FiArrowUpRight}
          color="danger"
          to="/stock/history"
        />
      </div>

      {/* 1. GODOWN & BRANCH STOCK GROUPS (ADMIN ONLY) */}
      {isAdmin && (
        <GodownDistributionCard
          godownBreakdown={stats?.godownBreakdown || []}
          totalStock={stats?.totalQuantity ?? 0}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* 2. CIRCULAR GRAPH: PRODUCT TYPE DISTRIBUTION & AVAILABLE STOCK */}
      <div style={{ marginBottom: '28px' }}>
        <CategoryDistributionChart
          breakdown={stats?.productTypeBreakdown || []}
          totalStock={stats?.totalQuantity ?? 0}
        />
      </div>

      {/* 3. CIRCULAR GRAPH & TILES: CUSTOMER & PAYMENT PENDING OVERVIEW (Permitted only for Users with Customer / Account access) */}
      {(isAdmin || (hasModuleAccess && (hasModuleAccess('customers') || hasModuleAccess('accounts')))) && (
        <CustomerPaymentPendingCard />
      )}

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
