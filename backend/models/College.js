const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const College = sequelize.define('College', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  tagline: {
    type: DataTypes.STRING(255)
  },
  logo: {
    type: DataTypes.STRING(500)
  },
  primary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6c5ce7'
  },
  accent_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#00cec9'
  },
  website: DataTypes.STRING(200),
  address: DataTypes.TEXT,
  phone: DataTypes.STRING(20),
  email: DataTypes.STRING(150),
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'colleges',
  underscored: true,
  timestamps: true
});

module.exports = College;
