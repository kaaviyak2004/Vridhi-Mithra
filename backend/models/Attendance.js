const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'courses', key: 'id' }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    allowNull: false,
    defaultValue: 'present'
  }
}, {
  tableName: 'attendance',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['student_id', 'course_id', 'date'] }
  ]
});

module.exports = Attendance;
