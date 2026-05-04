const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Performance = sequelize.define('Performance', {
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
  assessment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'assessments', key: 'id' }
  },
  marks_obtained: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  percentage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'performance',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['student_id', 'assessment_id'] }
  ]
});

module.exports = Performance;
