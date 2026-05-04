const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enrollment = sequelize.define('Enrollment', {
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
  enrolled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'dropped'),
    defaultValue: 'active'
  }
}, {
  tableName: 'enrollments',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['student_id', 'course_id'] }
  ]
});

module.exports = Enrollment;
