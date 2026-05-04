const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'faculty', 'admin', 'super_admin'),
    allowNull: false,
    defaultValue: 'student'
  },
  college_id: {
    type: DataTypes.UUID,
    allowNull: true, // Can be null for super_admins or users not yet assigned
    references: {
      model: 'colleges',
      key: 'id'
    }
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
