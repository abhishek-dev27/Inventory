const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define(
  'Customer',
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
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    systemType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'On-Grid',
    },
    capacity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfVisit: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    timeOfVisit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bdeEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bdeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bookingConfirmed: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
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
    addOn1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addOn2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addOn3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    financialYear: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'customers',
    timestamps: true,
    indexes: [
      { fields: ['customerName'] },
      { fields: ['uniqueId'] },
      { fields: ['bookingConfirmed'] },
      { fields: ['bdeEmail'] },
      { fields: ['financialYear'] },
    ],
  }
);

module.exports = Customer;
