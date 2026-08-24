const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StockTransaction = sequelize.define('StockTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('in', 'out'),
    allowNull: false,
    validate: {
      isIn: { args: [['in', 'out']], msg: 'Type must be "in" or "out"' },
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'Quantity must be an integer' },
      min: { args: [1], msg: 'Quantity must be at least 1' },
    },
  },
  personName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  senderPhone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  senderAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  senderCompany: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  place: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  referenceNo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Reason is required' },
    },
  },
  serialNumbers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'stock_transactions',
  timestamps: true,
  updatedAt: false, // Transactions are immutable
});

module.exports = StockTransaction;
