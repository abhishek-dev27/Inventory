const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Account = sequelize.define(
  'Account',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uniqueId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bookingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    modeOfPayment: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'UPI',
    },
    projectValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    statusOfWork: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Not Started',
    },
    completionPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    // Payment 1
    payment1Amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    payment1Date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment1Mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Payment 2
    payment2Amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    payment2Date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment2Mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Payment 3
    payment3Amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    payment3Date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment3Mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Payment 4
    payment4Amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    payment4Date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment4Mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Payment 5
    payment5Amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    payment5Date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment5Mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Recurring Payment / EMI / AMC Schedule Fields
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurringFrequency: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Monthly', // 'Monthly', 'Quarterly', 'Half-Yearly', 'Annual (AMC)'
    },
    recurringAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    recurringStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    recurringNextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    recurringTotalCycles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 12,
    },
    recurringCompletedCycles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    recurringStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'None', // 'Active', 'Completed', 'Paused', 'None'
    },
    financialYear: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'accounts',
    timestamps: true,
    indexes: [
      { fields: ['uniqueId'] },
      { fields: ['customerName'] },
      { fields: ['statusOfWork'] },
      { fields: ['financialYear'] },
      { fields: ['customerId'] },
    ],
  }
);

module.exports = Account;
