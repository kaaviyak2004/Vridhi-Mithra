const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  course_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  college_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'colleges', key: 'id' }
  }
}, {
  tableName: 'courses',
  timestamps: true
});

module.exports = Course;
