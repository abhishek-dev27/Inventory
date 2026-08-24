const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' },
      len: { args: [2, 200], msg: 'Name must be between 2 and 200 characters' },
    },
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: { msg: 'Unique ID / SKU already exists' },
    validate: {
      notEmpty: { msg: 'Unique ID / SKU is required' },
    },
  },
  productType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Standard Product',
    validate: {
      notEmpty: { msg: 'Product type is required' },
    },
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'General',
    validate: {
      notEmpty: { msg: 'Category is required' },
    },
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pcs',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  capacity: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  phase: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  dcrType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  subType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  senderName: {
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
  senderReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  serialNumbers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'Quantity must be an integer' },
      min: { args: [0], msg: 'Quantity cannot be negative' },
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'Price must be a valid number' },
      min: { args: [0], msg: 'Price cannot be negative' },
    },
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: { args: [0], msg: 'Cost price cannot be negative' },
    },
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      isInt: { msg: 'Threshold must be an integer' },
      min: { args: [0], msg: 'Threshold cannot be negative' },
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
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
