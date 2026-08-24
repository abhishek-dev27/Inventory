import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import UsageReport from '../../components/reports/UsageReport';
import ProjectPerformanceAndNPMCard from '../../components/dashboard/ProjectPerformanceAndNPMCard';

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
          <h1 className="page-title">Project Performance, NPM Velocity & Material Usage</h1>
          <p className="page-subtitle">Identify 3+ months inactive projects (NPM), on-time customer collections, live site execution, and consumption velocity</p>
        </div>
      </div>

      {/* NPM Inactive Projects, On-Time Settlements & Live Velocity Tracker */}
      <ProjectPerformanceAndNPMCard />

      <UsageReport />
    </div>
  );
};

export default UsageReports;
