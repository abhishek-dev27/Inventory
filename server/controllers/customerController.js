const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { recordActivity } = require('../utils/clientInfo');

// Helper to normalize booking confirmation status from any input format
const normalizeBookingStatus = (val) => {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'true' || s === 'yes' || s === 'confirmed' || s === '1' || s === 'booked' || s === 'done') {
    return 'Confirmed';
  }
  if (s === 'false' || s === 'no' || s === 'cancelled' || s === 'lost' || s === 'lost / cancelled') {
    return 'Lost / Cancelled';
  }
  if (s === 'in discussion' || s === 'discussion' || s === 'negotiating') {
    return 'In Discussion';
  }
  return val && String(val).trim() ? String(val).trim() : 'Pending';
};

// Helper to compute Financial Year from date
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
 * @desc    Get all customers with search, filter, and pagination
 * @route   GET /api/customers
 * @access  Private (Admin, Staff, Manager)
 */
const getCustomers = async (req, res) => {
  try {
    const {
      search,
      status,
      systemType,
      financialYear,
      bde,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};

    // Keyword Search
    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { customerName: { [Op.like]: `%${q}%` } },
        { uniqueId: { [Op.like]: `%${q}%` } },
        { contactNo: { [Op.like]: `%${q}%` } },
        { address: { [Op.like]: `%${q}%` } },
        { bdeName: { [Op.like]: `%${q}%` } },
        { bdeEmail: { [Op.like]: `%${q}%` } },
        { systemType: { [Op.like]: `%${q}%` } },
        { reference: { [Op.like]: `%${q}%` } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      where.bookingConfirmed = status;
    }

    // System type filter
    if (systemType && systemType !== 'all') {
      where.systemType = systemType;
    }

    // Financial year filter
    if (financialYear && financialYear !== 'all') {
      where.financialYear = financialYear;
    }

    // BDE filter
    if (bde && bde !== 'all') {
      where[Op.or] = [
        { bdeName: bde },
        { bdeEmail: bde },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    // Compute Summary Stats across all customer records
    const allCustomers = await Customer.findAll({
      attributes: ['id', 'bookingConfirmed', 'bookingAmount', 'projectValue', 'capacity'],
    });

    let totalConfirmed = 0;
    let totalPending = 0;
    let totalBookingAmount = 0;
    let totalProjectValue = 0;

    allCustomers.forEach((c) => {
      const isConfirmed =
        c.bookingConfirmed &&
        (c.bookingConfirmed.toLowerCase() === 'yes' ||
          c.bookingConfirmed.toLowerCase() === 'confirmed');
      if (isConfirmed) {
        totalConfirmed += 1;
      } else {
        totalPending += 1;
      }
      totalBookingAmount += parseFloat(c.bookingAmount || 0);
      totalProjectValue += parseFloat(c.projectValue || 0);
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)),
      },
      stats: {
        totalLeads: allCustomers.length,
        totalConfirmed,
        totalPending,
        totalBookingAmount,
        totalProjectValue,
        conversionRate:
          allCustomers.length > 0
            ? Math.round((totalConfirmed / allCustomers.length) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer records',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private
 */
const createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      address,
      contactNo,
      systemType,
      capacity,
      dateOfVisit,
      timeOfVisit,
      reference,
      bdeEmail,
      bdeName,
      comments,
      uniqueId,
      bookingConfirmed,
      bookingAmount,
      modeOfPayment,
      projectValue,
      addOn1,
      addOn2,
      addOn3,
      financialYear,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer Name is required',
      });
    }

    const fy = financialYear || getFinancialYear(dateOfVisit || new Date());

    // Auto-generate or sanitize Unique ID
    let finalUniqueId = uniqueId ? uniqueId.trim() : '';
    if (!finalUniqueId) {
      const count = await Customer.count({
        where: {
          financialYear: fy,
        },
      });
      finalUniqueId = `BD/${fy}/${String(count + 1).padStart(4, '0')}`;
    }

    // Check if uniqueId already exists; if duplicate, auto-suffix with random/count
    const existingWithId = await Customer.findOne({ where: { uniqueId: finalUniqueId } });
    if (existingWithId) {
      finalUniqueId = `${finalUniqueId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const customer = await Customer.create({
      customerName: customerName.trim(),
      address: address ? address.trim() : '',
      contactNo: contactNo ? contactNo.trim() : '',
      systemType: systemType || 'On-Grid',
      capacity: capacity ? capacity.trim() : '',
      dateOfVisit: dateOfVisit || null,
      timeOfVisit: timeOfVisit || '',
      reference: reference ? reference.trim() : '',
      bdeEmail: bdeEmail ? bdeEmail.trim() : (req.user?.email || ''),
      bdeName: bdeName ? bdeName.trim() : (req.user?.name || ''),
      comments: comments ? comments.trim() : '',
      uniqueId: finalUniqueId,
      bookingConfirmed: normalizeBookingStatus(bookingConfirmed),
      bookingAmount: parseFloat(bookingAmount) || 0,
      modeOfPayment: modeOfPayment || 'UPI',
      projectValue: parseFloat(projectValue) || 0,
      addOn1: addOn1 ? addOn1.trim() : '',
      addOn2: addOn2 ? addOn2.trim() : '',
      addOn3: addOn3 ? addOn3.trim() : '',
      financialYear: fy,
      userId: req.user?.id || null,
    });

    // Log activity safely
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'CREATE_CUSTOMER',
      details: `Registered new BD customer ${customer.customerName} (${customer.uniqueId}) - Capacity: ${customer.capacity || 'N/A'}, Project Value: ₹${customer.projectValue}`,
    });

    res.status(201).json({
      success: true,
      message: 'Customer record created successfully',
      data: customer,
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A customer with this Unique ID already exists. Please leave Unique ID blank to auto-generate or use a unique number.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create customer record: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer record not found',
      });
    }

    const {
      customerName,
      address,
      contactNo,
      systemType,
      capacity,
      dateOfVisit,
      timeOfVisit,
      reference,
      bdeEmail,
      bdeName,
      comments,
      uniqueId,
      bookingConfirmed,
      bookingAmount,
      modeOfPayment,
      projectValue,
      addOn1,
      addOn2,
      addOn3,
      financialYear,
    } = req.body;

    const updatedFy = financialYear || customer.financialYear || getFinancialYear(dateOfVisit || customer.dateOfVisit);

    await customer.update({
      customerName: customerName !== undefined ? customerName.trim() : customer.customerName,
      address: address !== undefined ? address.trim() : customer.address,
      contactNo: contactNo !== undefined ? contactNo.trim() : customer.contactNo,
      systemType: systemType !== undefined ? systemType : customer.systemType,
      capacity: capacity !== undefined ? capacity.trim() : customer.capacity,
      dateOfVisit: dateOfVisit !== undefined ? dateOfVisit : customer.dateOfVisit,
      timeOfVisit: timeOfVisit !== undefined ? timeOfVisit : customer.timeOfVisit,
      reference: reference !== undefined ? reference.trim() : customer.reference,
      bdeEmail: bdeEmail !== undefined ? bdeEmail.trim() : customer.bdeEmail,
      bdeName: bdeName !== undefined ? bdeName.trim() : customer.bdeName,
      comments: comments !== undefined ? comments.trim() : customer.comments,
      uniqueId: uniqueId !== undefined ? uniqueId.trim() : customer.uniqueId,
      bookingConfirmed: bookingConfirmed !== undefined ? normalizeBookingStatus(bookingConfirmed) : customer.bookingConfirmed,
      bookingAmount: bookingAmount !== undefined ? parseFloat(bookingAmount) : customer.bookingAmount,
      modeOfPayment: modeOfPayment !== undefined ? modeOfPayment : customer.modeOfPayment,
      projectValue: projectValue !== undefined ? parseFloat(projectValue) : customer.projectValue,
      addOn1: addOn1 !== undefined ? addOn1.trim() : customer.addOn1,
      addOn2: addOn2 !== undefined ? addOn2.trim() : customer.addOn2,
      addOn3: addOn3 !== undefined ? addOn3.trim() : customer.addOn3,
      financialYear: updatedFy,
    });

    // Log activity safely
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'UPDATE_CUSTOMER',
      details: `Updated details for customer ${customer.customerName} (${customer.uniqueId})`,
    });

    res.json({
      success: true,
      message: 'Customer record updated successfully',
      data: customer,
    });
  } catch (error) {
    console.error('updateCustomer error:', error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A customer with this Unique ID already exists. Please choose a different Unique ID.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update customer record: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin or Authorized)
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer record not found',
      });
    }

    const name = customer.customerName;
    const uid = customer.uniqueId;

    await customer.destroy();

    // Log activity safely
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'DELETE_CUSTOMER',
      details: `Deleted customer record ${name} (${uid})`,
    });

    res.json({
      success: true,
      message: `Customer ${name} deleted successfully`,
    });
  } catch (error) {
    console.error('deleteCustomer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer record',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk Import Customers from Sheet / CSV
 * @route   POST /api/customers/bulk-import
 * @access  Private
 */
const bulkImportCustomers = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No customer items provided for import',
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

        const fy = item.financialYear || getFinancialYear(item.dateOfVisit || new Date());
        let uid = item.uniqueId ? item.uniqueId.trim() : '';
        if (!uid) {
          const count = (await Customer.count({ where: { financialYear: fy } })) + created.length;
          uid = `BD/${fy}/${String(count + 1).padStart(4, '0')}`;
        }

        const newCust = await Customer.create({
          customerName: item.customerName.trim(),
          address: item.address ? item.address.trim() : '',
          contactNo: item.contactNo ? item.contactNo.trim() : '',
          systemType: item.systemType || 'On-Grid',
          capacity: item.capacity ? item.capacity.trim() : '',
          dateOfVisit: item.dateOfVisit || null,
          timeOfVisit: item.timeOfVisit || '',
          reference: item.reference ? item.reference.trim() : '',
          bdeEmail: item.bdeEmail ? item.bdeEmail.trim() : (req.user?.email || ''),
          bdeName: item.bdeName ? item.bdeName.trim() : (req.user?.name || ''),
          comments: item.comments ? item.comments.trim() : '',
          uniqueId: uid,
          bookingConfirmed: normalizeBookingStatus(item.bookingConfirmed),
          bookingAmount: parseFloat(item.bookingAmount) || 0,
          modeOfPayment: item.modeOfPayment || 'UPI',
          projectValue: parseFloat(item.projectValue) || 0,
          addOn1: item.addOn1 ? item.addOn1.trim() : '',
          addOn2: item.addOn2 ? item.addOn2.trim() : '',
          addOn3: item.addOn3 ? item.addOn3.trim() : '',
          financialYear: fy,
          userId: req.user?.id || null,
        });

        created.push(newCust);
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    // Log activity safely
    await recordActivity(req, {
      userId: req.user?.id || null,
      userName: req.user?.name || null,
      userEmail: req.user?.email || 'system',
      role: req.user?.role || null,
      action: 'BULK_IMPORT_CUSTOMERS',
      details: `Bulk imported ${created.length} customer records from BD sheet`,
    });

    res.json({
      success: true,
      message: `Successfully imported ${created.length} customer(s)`,
      importedCount: created.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('bulkImportCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import customer records',
      error: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkImportCustomers,
};
