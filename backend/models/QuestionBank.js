const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuestionBank = sequelize.define('QuestionBank', {
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false
  },
  correctIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'question_bank',
  timestamps: true
});

module.exports = QuestionBank;
