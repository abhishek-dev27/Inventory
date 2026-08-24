import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';
import CustomerReport from '../../components/reports/CustomerReport';
import CustomerPaymentPendingCard from '../../components/dashboard/CustomerPaymentPendingCard';

const CustomerReports = () => {
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
          <h1 className="page-title">Customer Dossier & Dispatch History</h1>
          <p className="page-subtitle">
            Comprehensive ledger of all client deliveries, project sites, equipment dispatch bills, and valuations
          </p>
        </div>
      </div>

      <CustomerPaymentPendingCard />

      <CustomerReport />
    </div>
  );
};

export default CustomerReports;
