/**
 * Format a date string or Date object to a readable string.
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  const defaults = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return d.toLocaleDateString('en-US', defaults);
};

/**
 * Format to date + time
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format to relative time (e.g., "2 hours ago")
 */
export const formatRelative = (date) => {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

/**
 * Get today's date as YYYY-MM-DD
 */
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get Financial Year string (e.g. "2023-24", "2024-25", "2026-27") from a date.
 * Financial Year runs from April 1st to March 31st.
 */
export const getFinancialYear = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    const startYear = curMonth >= 4 ? curYear : curYear - 1;
    const endYearShort = String(startYear + 1).slice(-2);
    return `${startYear}-${endYearShort}`;
  }
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
};

/**
 * Generate a sequential or formatted Bill Number based on the Financial Year.
 * e.g., BILL/2026-27/0001 or BILL/2023-24/0001
 */
export const generateBillNumber = (dateInput, existingTransactions = [], prefix = 'BILL') => {
  const fy = getFinancialYear(dateInput);

  // Find all existing distinct bills for this financial year
  const fyBills = new Set();
  (existingTransactions || []).forEach((t) => {
    const ref = t.referenceNo || '';
    if (ref.includes(fy)) {
      fyBills.add(ref);
    }
  });

  const nextSeq = String(fyBills.size + 1).padStart(4, '0');
  return `${prefix}/${fy}/${nextSeq}`;
};

/**
 * Generate Bill Number directly from a given Financial Year string (e.g. '2023-24')
 */
export const generateBillNumberForFY = (fyString, existingTransactions = [], prefix = 'BILL') => {
  const fy = fyString || getFinancialYear(new Date());

  const fyBills = new Set();
  (existingTransactions || []).forEach((t) => {
    const ref = t.referenceNo || '';
    if (ref.includes(fy)) {
      fyBills.add(ref);
    }
  });

  const nextSeq = String(fyBills.size + 1).padStart(4, '0');
  return `${prefix}/${fy}/${nextSeq}`;
};

/**
 * Get a list of Financial Years (past 6 years to future 3 years)
 */
export const getFinancialYearsList = (startYearOffset = 6, futureYearOffset = 3) => {
  const curFY = getFinancialYear(new Date());
  const curStartYear = parseInt(curFY.split('-')[0], 10);

  const years = [];
  for (let y = curStartYear - startYearOffset; y <= curStartYear + futureYearOffset; y++) {
    const nextYShort = String(y + 1).slice(-2);
    years.push(`${y}-${nextYShort}`);
  }
  return years.reverse(); // Newest first
};


