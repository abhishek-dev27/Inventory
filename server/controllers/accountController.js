const { Op } = require('sequelize');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { recordActivity } = require('../utils/clientInfo');

// Helper to calculate total payments received & balance remaining
const computeFinancials = (data) => {
  const projectVal = parseFloat(data.projectValue) || 0;
  const bookingAmt = parseFloat(data.bookingAmount) || 0;
  const p1 = parseFloat(data.payment1Amount) || 0;
  const p2 = parseFloat(data.payment2Amount) || 0;
  const p3 = parseFloat(data.payment3Amount) || 0;
  const p4 = parseFloat(data.payment4Amount) || 0;
  const p5 = parseFloat(data.payment5Amount) || 0;

  const totalReceived = bookingAmt + p1 + p2 + p3 + p4 + p5;
  const remaining = Math.max(0, projectVal - totalReceived);

  return {
    projectVal,
    bookingAmt,
    totalReceived,
    remaining,
  };
};

// Helper to compute Payment Due Date, Last Payment Date, Days Overdue, NPM (3+ Months Stalled), and On-time Payment
const computeAccountAging = (account) => {
  let lastPaymentDate = null;
  let lastPaymentMode = null;
  let lastPaymentAmount = 0;

  if (account.payment5Date && parseFloat(account.payment5Amount) > 0) {
    lastPaymentDate = account.payment5Date;
    lastPaymentMode = account.payment5Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment5Amount);
  } else if (account.payment4Date && parseFloat(account.payment4Amount) > 0) {
    lastPaymentDate = account.payment4Date;
    lastPaymentMode = account.payment4Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment4Amount);
  } else if (account.payment3Date && parseFloat(account.payment3Amount) > 0) {
    lastPaymentDate = account.payment3Date;
    lastPaymentMode = account.payment3Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment3Amount);
  } else if (account.payment2Date && parseFloat(account.payment2Amount) > 0) {
    lastPaymentDate = account.payment2Date;
    lastPaymentMode = account.payment2Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment2Amount);
  } else if (account.payment1Date && parseFloat(account.payment1Amount) > 0) {
    lastPaymentDate = account.payment1Date;
    lastPaymentMode = account.payment1Mode || 'UPI';
    lastPaymentAmount = parseFloat(account.payment1Amount);
  } else if (parseFloat(account.bookingAmount) > 0) {
    lastPaymentDate = account.createdAt ? new Date(account.createdAt).toISOString().slice(0, 10) : null;
    lastPaymentMode = account.modeOfPayment || 'UPI';
    lastPaymentAmount = parseFloat(account.bookingAmount);
  }

  // Determine Payment Due Date
  let dueDate = account.paymentDueDate;
  if (!dueDate) {
    const baseDate = lastPaymentDate ? new Date(lastPaymentDate) : (account.createdAt ? new Date(account.createdAt) : new Date());
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 30);
    dueDate = d.toISOString().slice(0, 10);
  }

  // Compute Days Crossed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDue = new Date(dueDate);
  targetDue.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDue.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // > 0 = overdue, < 0 = future

  const pVal = parseFloat(account.projectValue) || 0;
  const rem = parseFloat(account.remainingAmount) || 0;
  const compPercent = parseInt(account.completionPercentage) || 0;
  const statusStr = (account.statusOfWork || '').toLowerCase();

  const isCleared = rem <= 0 && pVal > 0;
  const isOverdue = !isCleared && diffDays > 0;
  const isDueSoon = !isCleared && diffDays <= 0 && diffDays >= -7;

  // 1. On-Time Payment Calculation
  let paidOnTime = false;
  let paidLate = false;
  if (isCleared) {
    if (lastPaymentDate && dueDate) {
      paidOnTime = new Date(lastPaymentDate) <= new Date(dueDate);
      paidLate = !paidOnTime;
    } else {
      paidOnTime = true;
    }
  }

  // 2. Logic-Based NPM: If payment is pending and no payment has been made for 90+ days (3 months)
  const lastActivePaymentDate = lastPaymentDate ? new Date(lastPaymentDate) : (account.createdAt ? new Date(account.createdAt) : new Date());
  lastActivePaymentDate.setHours(0, 0, 0, 0);
  const daysSinceLastPayment = Math.max(0, Math.round((today.getTime() - lastActivePaymentDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Auto-Mark as NPM if remaining balance > 0 and 90+ days passed with no payment
  const isNPM = rem > 0 && daysSinceLastPayment >= 90;

  // 3. Ongoing Project
  const isOngoing = !isNPM && !statusStr.includes('complete') && !statusStr.includes('handover') && compPercent < 100;

  return {
    lastPaymentDate,
    lastPaymentMode,
    lastPaymentAmount,
    dueDate,
    diffDays,
    daysOverdue: isOverdue ? diffDays : 0,
    daysRemaining: diffDays < 0 ? Math.abs(diffDays) : 0,
    isOverdue,
    isDueSoon,
    isCleared,
    paidOnTime,
    paidLate,
    daysSinceLastPayment,
    isNPM,
    isOngoing,
  };
};

// Helper for Financial Year
const getFinancialYear = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const startYear = curMonth >= 4 ? curYear : curYear - 1;
    const endYearShort = String(startYear + 1).slice(-2);
    return `${startYear}-${endYearShort}`;
  }
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
};

/**
 * @desc    Get all accounts with search, filter, pagination, & summary KPIs
 * @route   GET /api/accounts
 * @access  Private
 */
const getAccounts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 200,
      search = '',
      statusOfWork,
      financialYear,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // 1. Search Query
    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { customerName: { [Op.like]: `%${q}%` } },
        { uniqueId: { [Op.like]: `%${q}%` } },
        { contactNo: { [Op.like]: `%${q}%` } },
        { address: { [Op.like]: `%${q}%` } },
      ];
    }

    // 2. Filters
    if (statusOfWork && statusOfWork !== 'all') {
      if (statusOfWork === 'npm') {
        where.statusOfWork = { [Op.like]: '%NPM%' };
      } else {
        where.statusOfWork = statusOfWork;
      }
    }

    if (financialYear && financialYear !== 'all') {
      where.financialYear = financialYear;
    }

    // Fetch accounts
    const { count, rows } = await Account.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    // Compute Overall Account KPIs (across whole database or filtered set)
    const allMatching = await Account.findAll({
      attributes: [
        'id',
        'uniqueId',
        'customerName',
        'contactNo',
        'address',
        'projectValue',
        'bookingAmount',
        'remainingAmount',
        'completionPercentage',
        'statusOfWork',
        'paymentDueDate',
        'payment1Amount',
        'payment1Date',
        'payment1Mode',
        'payment2Amount',
        'payment2Date',
        'payment2Mode',
        'payment3Amount',
        'payment3Date',
        'payment3Mode',
        'payment4Amount',
        'payment4Date',
        'payment4Mode',
        'payment5Amount',
        'payment5Date',
        'payment5Mode',
        'createdAt',
      ],
    });

    let totalProjectValue = 0;
    let totalCollected = 0;
    let totalRemaining = 0;
    let totalCompletedProjects = 0;
    let sumCompletionPercentage = 0;
    let totalOverdueAccounts = 0;
    let totalDueSoonAccounts = 0;
    let totalOverdueAmount = 0;
    let totalNpmAccounts = 0;
    let totalOnTimeSettled = 0;
    let totalLateSettled = 0;
    let totalOngoingProjects = 0;

    allMatching.forEach((acc) => {
      const { projectVal, totalReceived, remaining } = computeFinancials(acc);
      const aging = computeAccountAging(acc);

      totalProjectValue += projectVal;
      totalCollected += totalReceived;
      totalRemaining += remaining;
      sumCompletionPercentage += acc.completionPercentage || 0;

      if (aging.isOverdue) {
        totalOverdueAccounts += 1;
        totalOverdueAmount += remaining;
      } else if (aging.isDueSoon) {
        totalDueSoonAccounts += 1;
      }

      if (aging.isNPM) {
        totalNpmAccounts += 1;
      }

      if (aging.isOngoing) {
        totalOngoingProjects += 1;
      }

      if (aging.paidOnTime) {
        totalOnTimeSettled += 1;
      } else if (aging.paidLate) {
        totalLateSettled += 1;
      }

      if (
        (acc.statusOfWork && acc.statusOfWork.toLowerCase().includes('complete')) ||
        (acc.completionPercentage && acc.completionPercentage >= 100)
      ) {
        totalCompletedProjects += 1;
      }
    });

    const avgCompletion = allMatching.length > 0 ? Math.round(sumCompletionPercentage / allMatching.length) : 0;

    // Attach computed aging to each row
    const enrichedRows = rows.map((r) => {
      const rJson = r.toJSON();
      return {
        ...rJson,
        aging: computeAccountAging(r),
      };
    });

    res.json({
      success: true,
      data: enrichedRows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      stats: {
        totalAccounts: count,
        totalProjectValue,
        totalCollected,
        totalRemaining,
        totalCompletedProjects,
        avgCompletion,
        totalOverdueAccounts,
        totalDueSoonAccounts,
        totalOverdueAmount,
        totalNpmAccounts,
        totalOnTimeSettled,
        totalLateSettled,
        totalOngoingProjects,
      },
    });
  } catch (error) {
    console.error('getAccounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
      error: error.message,
    });
  }
};

/**
 * @desc    Get account by ID
 * @route   GET /api/accounts/:id
 * @access  Private
 */
const getAccountById = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account record not found',
      });
    }

    const financials = computeFinancials(account);

    res.json({
      success: true,
      data: {
        ...account.toJSON(),
        financials,
      },
    });
  } catch (error) {
    console.error('getAccountById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account details',
      error: error.message,
    });
  }
};

// Helper to sanitize incoming date values (converts empty string, 'Invalid date', etc to null)
const sanitizeDate = (val) => {
  if (!val || val === '' || val === 'Invalid date' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

// Helper to calculate next recurring billing date
const calculateNextRecurringDate = (startDate, frequency, cycleNumber = 1) => {
  if (!startDate) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;

  const freq = (frequency || 'Monthly').toLowerCase();
  if (freq.includes('quarter')) {
    d.setMonth(d.getMonth() + (3 * cycleNumber));
  } else if (freq.includes('half') || freq.includes('bi')) {
    d.setMonth(d.getMonth() + (6 * cycleNumber));
  } else if (freq.includes('year') || freq.includes('annual')) {
    d.setFullYear(d.getFullYear() + cycleNumber);
  } else {
    // Default Monthly
    d.setMonth(d.getMonth() + cycleNumber);
  }
  return d.toISOString().slice(0, 10);
};

/**
 * @desc    Create a new account
 * @route   POST /api/accounts
 * @access  Private
 */
const createAccount = async (req, res) => {
  try {
    const {
      uniqueId,
      customerName,
      contactNo,
      address,
      bookingAmount,
      modeOfPayment,
      projectValue,
      statusOfWork,
      completionPercentage,
      payment1Amount,
      payment1Date,
      payment1Mode,
      payment2Amount,
      payment2Date,
      payment2Mode,
      payment3Amount,
      payment3Date,
      payment3Mode,
      payment4Amount,
      payment4Date,
      payment4Mode,
      payment5Amount,
      payment5Date,
      payment5Mode,
      paymentDueDate,
      // Recurring Fields
      isRecurring,
      recurringFrequency,
      recurringAmount,
      recurringStartDate,
      recurringNextDueDate,
      recurringTotalCycles,
      recurringCompletedCycles,
      recurringStatus,
      financialYear,
      customerId,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer Name is required',
      });
    }

    const fy = financialYear || getFinancialYear(new Date());

    // Auto-generate Unique ID if not provided
    let finalUniqueId = uniqueId ? uniqueId.trim() : '';
    if (!finalUniqueId) {
      const count = await Account.count({
        where: {
          financialYear: fy,
        },
      });
      finalUniqueId = `ACC/${fy}/${String(count + 1).padStart(4, '0')}`;
    }

    // Check if uniqueId collision exists
    const existingWithId = await Account.findOne({ where: { uniqueId: finalUniqueId } });
    if (existingWithId) {
      finalUniqueId = `${finalUniqueId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { remaining } = computeFinancials({
      projectValue,
      bookingAmount,
      payment1Amount,
      payment2Amount,
      payment3Amount,
      payment4Amount,
      payment5Amount,
    });

    const isRec = Boolean(isRecurring);
    const recStart = sanitizeDate(recurringStartDate) || (isRec ? new Date().toISOString().slice(0, 10) : null);
    const recNextDue = sanitizeDate(recurringNextDueDate) || (isRec ? calculateNextRecurringDate(recStart, recurringFrequency, 1) : null);

    const account = await Account.create({
      uniqueId: finalUniqueId,
      customerName: customerName.trim(),
      contactNo: contactNo ? contactNo.trim() : '',
      address: address ? address.trim() : '',
      bookingAmount: parseFloat(bookingAmount) || 0,
      modeOfPayment: modeOfPayment || 'UPI',
      projectValue: parseFloat(projectValue) || 0,
      statusOfWork: statusOfWork || 'Not Started',
      completionPercentage: parseInt(completionPercentage) || 0,
      remainingAmount: remaining,
      payment1Amount: parseFloat(payment1Amount) || 0,
      payment1Date: sanitizeDate(payment1Date),
      payment1Mode: payment1Mode || null,
      payment2Amount: parseFloat(payment2Amount) || 0,
      payment2Date: sanitizeDate(payment2Date),
      payment2Mode: payment2Mode || null,
      payment3Amount: parseFloat(payment3Amount) || 0,
      payment3Date: sanitizeDate(payment3Date),
      payment3Mode: payment3Mode || null,
      payment4Amount: parseFloat(payment4Amount) || 0,
      payment4Date: sanitizeDate(payment4Date),
      payment4Mode: payment4Mode || null,
      payment5Amount: parseFloat(payment5Amount) || 0,
      payment5Date: sanitizeDate(payment5Date),
      payment5Mode: payment5Mode || null,
      paymentDueDate: sanitizeDate(paymentDueDate),
      isRecurring: isRec,
      recurringFrequency: recurringFrequency || 'Monthly',
      recurringAmount: parseFloat(recurringAmount) || 0,
      recurringStartDate: recStart,
      recurringNextDueDate: recNextDue,
      recurringTotalCycles: parseInt(recurringTotalCycles) || 12,
      recurringCompletedCycles: parseInt(recurringCompletedCycles) || 0,
      recurringStatus: isRec ? (recurringStatus || 'Active') : 'None',
      financialYear: fy,
      customerId: customerId || null,
      userId: req.user?.id || null,
    });

    // Log activity
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'CREATE_ACCOUNT',
      details: `Created account for customer ${account.customerName} (${account.uniqueId}) - Value: ₹${account.projectValue}, Remaining: ₹${account.remainingAmount}`,
    });

    res.status(201).json({
      success: true,
      message: 'Account record created successfully',
      data: account,
    });
  } catch (error) {
    console.error('createAccount error:', error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'An account with this Unique ID already exists. Please provide a different Unique ID or leave blank to auto-generate.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create account record: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * @desc    Update an account
 * @route   PUT /api/accounts/:id
 * @access  Private
 */
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account record not found',
      });
    }

    const {
      uniqueId,
      customerName,
      contactNo,
      address,
      bookingAmount,
      modeOfPayment,
      projectValue,
      statusOfWork,
      completionPercentage,
      payment1Amount,
      payment1Date,
      payment1Mode,
      payment2Amount,
      payment2Date,
      payment2Mode,
      payment3Amount,
      payment3Date,
      payment3Mode,
      payment4Amount,
      payment4Date,
      payment4Mode,
      payment5Amount,
      payment5Date,
      payment5Mode,
      paymentDueDate,
      isRecurring,
      recurringFrequency,
      recurringAmount,
      recurringStartDate,
      recurringNextDueDate,
      recurringTotalCycles,
      recurringCompletedCycles,
      recurringStatus,
      financialYear,
      customerId,
    } = req.body;

    const mergedData = {
      projectValue: projectValue !== undefined ? projectValue : account.projectValue,
      bookingAmount: bookingAmount !== undefined ? bookingAmount : account.bookingAmount,
      payment1Amount: payment1Amount !== undefined ? payment1Amount : account.payment1Amount,
      payment2Amount: payment2Amount !== undefined ? payment2Amount : account.payment2Amount,
      payment3Amount: payment3Amount !== undefined ? payment3Amount : account.payment3Amount,
      payment4Amount: payment4Amount !== undefined ? payment4Amount : account.payment4Amount,
      payment5Amount: payment5Amount !== undefined ? payment5Amount : account.payment5Amount,
    };

    const { remaining } = computeFinancials(mergedData);

    const isRec = isRecurring !== undefined ? Boolean(isRecurring) : account.isRecurring;
    const recStart = recurringStartDate !== undefined ? sanitizeDate(recurringStartDate) : account.recurringStartDate;
    let recNextDue = recurringNextDueDate !== undefined ? sanitizeDate(recurringNextDueDate) : account.recurringNextDueDate;
    if (isRec && !recNextDue && recStart) {
      recNextDue = calculateNextRecurringDate(recStart, recurringFrequency || account.recurringFrequency, 1);
    }

    await account.update({
      uniqueId: uniqueId !== undefined ? uniqueId.trim() : account.uniqueId,
      customerName: customerName !== undefined ? customerName.trim() : account.customerName,
      contactNo: contactNo !== undefined ? contactNo.trim() : account.contactNo,
      address: address !== undefined ? address.trim() : account.address,
      bookingAmount: mergedData.bookingAmount,
      modeOfPayment: modeOfPayment !== undefined ? modeOfPayment : account.modeOfPayment,
      projectValue: mergedData.projectValue,
      statusOfWork: statusOfWork !== undefined ? statusOfWork : account.statusOfWork,
      completionPercentage: completionPercentage !== undefined ? parseInt(completionPercentage) : account.completionPercentage,
      remainingAmount: remaining,
      payment1Amount: mergedData.payment1Amount,
      payment1Date: payment1Date !== undefined ? sanitizeDate(payment1Date) : account.payment1Date,
      payment1Mode: payment1Mode !== undefined ? payment1Mode : account.payment1Mode,
      payment2Amount: mergedData.payment2Amount,
      payment2Date: payment2Date !== undefined ? sanitizeDate(payment2Date) : account.payment2Date,
      payment2Mode: payment2Mode !== undefined ? payment2Mode : account.payment2Mode,
      payment3Amount: mergedData.payment3Amount,
      payment3Date: payment3Date !== undefined ? sanitizeDate(payment3Date) : account.payment3Date,
      payment3Mode: payment3Mode !== undefined ? payment3Mode : account.payment3Mode,
      payment4Amount: mergedData.payment4Amount,
      payment4Date: payment4Date !== undefined ? sanitizeDate(payment4Date) : account.payment4Date,
      payment4Mode: payment4Mode !== undefined ? payment4Mode : account.payment4Mode,
      payment5Amount: mergedData.payment5Amount,
      payment5Date: payment5Date !== undefined ? sanitizeDate(payment5Date) : account.payment5Date,
      payment5Mode: payment5Mode !== undefined ? payment5Mode : account.payment5Mode,
      paymentDueDate: paymentDueDate !== undefined ? sanitizeDate(paymentDueDate) : account.paymentDueDate,
      isRecurring: isRec,
      recurringFrequency: recurringFrequency !== undefined ? recurringFrequency : account.recurringFrequency,
      recurringAmount: recurringAmount !== undefined ? parseFloat(recurringAmount) : account.recurringAmount,
      recurringStartDate: recStart,
      recurringNextDueDate: recNextDue,
      recurringTotalCycles: recurringTotalCycles !== undefined ? parseInt(recurringTotalCycles) : account.recurringTotalCycles,
      recurringCompletedCycles: recurringCompletedCycles !== undefined ? parseInt(recurringCompletedCycles) : account.recurringCompletedCycles,
      recurringStatus: recurringStatus !== undefined ? recurringStatus : (isRec ? 'Active' : 'None'),
      financialYear: financialYear !== undefined ? financialYear : account.financialYear,
      customerId: customerId !== undefined ? customerId : account.customerId,
    });

    // Log activity
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'UPDATE_ACCOUNT',
      details: `Updated account for customer ${account.customerName} (${account.uniqueId}) - Remaining: ₹${account.remainingAmount}, Work: ${account.statusOfWork}`,
    });

    res.json({
      success: true,
      message: 'Account record updated successfully',
      data: account,
    });
  } catch (error) {
    console.error('updateAccount error:', error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'An account with this Unique ID already exists. Please choose a different Unique ID.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update account record: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * @desc    Record a Recurring Payment Installment Cycle
 * @route   POST /api/accounts/:id/record-recurring
 * @access  Private
 */
const recordRecurringPayment = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const { amount, date, mode } = req.body;
    const payAmt = parseFloat(amount) || parseFloat(account.recurringAmount) || 0;
    const payDate = sanitizeDate(date) || new Date().toISOString().slice(0, 10);
    const payMode = mode || 'UPI';

    const currentCompleted = (account.recurringCompletedCycles || 0) + 1;
    const totalCycles = account.recurringTotalCycles || 12;
    const isFinished = currentCompleted >= totalCycles;

    // Calculate Next Due Date
    const nextDue = calculateNextRecurringDate(account.recurringStartDate || payDate, account.recurringFrequency, currentCompleted + 1);

    await account.update({
      recurringCompletedCycles: currentCompleted,
      recurringNextDueDate: isFinished ? null : nextDue,
      recurringStatus: isFinished ? 'Completed' : 'Active',
    });

    // Log activity
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'RECURRING_PAYMENT',
      details: `Recorded recurring installment for ${account.customerName} - Cycle ${currentCompleted}/${totalCycles} (₹${payAmt} via ${payMode})`,
    });

    res.json({
      success: true,
      message: `Recurring payment cycle ${currentCompleted}/${totalCycles} recorded for ${account.customerName}`,
      data: account,
    });
  } catch (error) {
    console.error('recordRecurringPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record recurring payment: ' + error.message,
    });
  }
};

/**
 * @desc    Delete an account
 * @route   DELETE /api/accounts/:id
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account record not found',
      });
    }

    const name = account.customerName;
    const uid = account.uniqueId;

    await account.destroy();

    // Log activity
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'DELETE_ACCOUNT',
      details: `Deleted account record ${name} (${uid})`,
    });

    res.json({
      success: true,
      message: `Account ${name} deleted successfully`,
    });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account record: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk Import Accounts from Sheet / CSV
 * @route   POST /api/accounts/bulk-import
 * @access  Private
 */
const bulkImportAccounts = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No account items provided for import',
      });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.customerName || !item.customerName.trim()) {
          errors.push({ row: i + 1, error: 'Customer Name is missing' });
          continue;
        }

        const fy = item.financialYear || getFinancialYear(new Date());
        let uid = item.uniqueId ? item.uniqueId.trim() : '';
        if (!uid) {
          const count = (await Account.count({ where: { financialYear: fy } })) + created.length;
          uid = `ACC/${fy}/${String(count + 1).padStart(4, '0')}`;
        }

        const { remaining } = computeFinancials(item);

        const newAcc = await Account.create({
          uniqueId: uid,
          customerName: item.customerName.trim(),
          contactNo: item.contactNo ? item.contactNo.trim() : '',
          address: item.address ? item.address.trim() : '',
          bookingAmount: parseFloat(item.bookingAmount) || 0,
          modeOfPayment: item.modeOfPayment || 'UPI',
          projectValue: parseFloat(item.projectValue) || 0,
          statusOfWork: item.statusOfWork || 'Not Started',
          completionPercentage: parseInt(item.completionPercentage) || 0,
          remainingAmount: remaining,
          payment1Amount: parseFloat(item.payment1Amount) || 0,
          payment1Date: item.payment1Date || null,
          payment1Mode: item.payment1Mode || null,
          payment2Amount: parseFloat(item.payment2Amount) || 0,
          payment2Date: item.payment2Date || null,
          payment2Mode: item.payment2Mode || null,
          payment3Amount: parseFloat(item.payment3Amount) || 0,
          payment3Date: item.payment3Date || null,
          payment3Mode: item.payment3Mode || null,
          payment4Amount: parseFloat(item.payment4Amount) || 0,
          payment4Date: item.payment4Date || null,
          payment4Mode: item.payment4Mode || null,
          payment5Amount: parseFloat(item.payment5Amount) || 0,
          payment5Date: item.payment5Date || null,
          payment5Mode: item.payment5Mode || null,
          financialYear: fy,
          customerId: item.customerId || null,
          userId: req.user?.id || null,
        });

        created.push(newAcc);
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    // Log activity
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'BULK_IMPORT_ACCOUNTS',
      details: `Bulk imported ${created.length} account records from Accounts sheet`,
    });

    res.json({
      success: true,
      message: `Successfully imported ${created.length} account record(s)`,
      importedCount: created.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('bulkImportAccounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import account records',
      error: error.message,
    });
  }
};

/**
 * @desc    Sync / Pull Confirmed Customers to Accounts
 * @route   POST /api/accounts/sync-customers
 * @access  Private
 */
const syncFromCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    let createdCount = 0;
    let updatedCount = 0;

    for (const cust of customers) {
      // Find existing account by customerId or matching uniqueId
      let acc = await Account.findOne({
        where: {
          [Op.or]: [
            { customerId: cust.id },
            { uniqueId: cust.uniqueId },
          ],
        },
      });

      if (!acc) {
        const { remaining } = computeFinancials({
          projectValue: cust.projectValue,
          bookingAmount: cust.bookingAmount,
        });

        await Account.create({
          uniqueId: cust.uniqueId || `ACC/${cust.financialYear || '2026-27'}/${String(Date.now()).slice(-4)}`,
          customerName: cust.customerName,
          contactNo: cust.contactNo,
          address: cust.address,
          bookingAmount: cust.bookingAmount || 0,
          modeOfPayment: cust.modeOfPayment || 'UPI',
          projectValue: cust.projectValue || 0,
          statusOfWork: cust.bookingConfirmed === 'Confirmed' ? 'Material Dispatched' : 'Not Started',
          completionPercentage: cust.bookingConfirmed === 'Confirmed' ? 20 : 0,
          remainingAmount: remaining,
          financialYear: cust.financialYear,
          customerId: cust.id,
          userId: req.user?.id || null,
        });
        createdCount++;
      } else {
        // Update contact/name if changed
        await acc.update({
          customerName: cust.customerName,
          contactNo: cust.contactNo,
          address: cust.address,
          bookingAmount: cust.bookingAmount || acc.bookingAmount,
          projectValue: cust.projectValue || acc.projectValue,
          modeOfPayment: cust.modeOfPayment || acc.modeOfPayment,
        });
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced with Customers DB: ${createdCount} created, ${updatedCount} updated`,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error('syncFromCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync customers to accounts: ' + error.message,
      error: error.message,
    });
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  bulkImportAccounts,
  syncFromCustomers,
  recordRecurringPayment,
};
