const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'courses', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  questions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('quiz', 'assignment', 'midterm', 'final', 'lab', 'project'),
    allowNull: false,
    defaultValue: 'quiz'
  },
  max_marks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
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
  tableName: 'assessments',
  timestamps: true
});

module.exports = Assessment;
