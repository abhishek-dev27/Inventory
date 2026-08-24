import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import DailyReport from '../../components/reports/DailyReport';

const DailyReports = () => {
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
          <h1 className="page-title">Daily Stock Movement Statement</h1>
          <p className="page-subtitle">Inspect inbound and outbound stock logs for any selected calendar date</p>
        </div>
      </div>

      <DailyReport />
    </div>
  );
};

export default DailyReports;
