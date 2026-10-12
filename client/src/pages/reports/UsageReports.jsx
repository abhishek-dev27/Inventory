import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import UsageReport from '../../components/reports/UsageReport';

const UsageReports = () => {
  return (
    <div className="page-container">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/reports">
          <Button variant="ghost" size="sm" icon={FiArrowLeft}>
            Back to Reports Hub
          </Button>
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Product Usage & Consumption Analytics</h1>
          <p className="page-subtitle">Rank highest-velocity items, fast-moving SKUs, material depletion rates, and restock frequency</p>
        </div>
      </div>

      <UsageReport />
    </div>
  );
};

export default UsageReports;
