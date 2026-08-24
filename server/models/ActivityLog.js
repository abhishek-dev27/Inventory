const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'system',
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'LOGIN',
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED'),
    defaultValue: 'SUCCESS',
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  device: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  browser: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  os: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userEmail'] },
    { fields: ['action'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = ActivityLog;
