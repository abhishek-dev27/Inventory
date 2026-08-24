import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import MonthlyReport from '../../components/reports/MonthlyReport';

const MonthlyReports = () => {
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
          <h1 className="page-title">Monthly Summary & Visual Analytics</h1>
          <p className="page-subtitle">Monthly aggregate volumes, trends, and net flow balances</p>
        </div>
      </div>

      <MonthlyReport />
    </div>
  );
};

export default MonthlyReports;
