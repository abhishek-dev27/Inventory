import React from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const ReportFilters = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ width: '180px' }}>
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </div>

      <div style={{ width: '180px' }}>
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
        {onApply && (
          <Button variant="primary" size="sm" onClick={onApply}>
            Apply Range
          </Button>
        )}
        {onReset && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;
