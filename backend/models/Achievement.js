const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Achievement = sequelize.define('Achievement', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  badge_icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '🏆'
  },
  category: {
    type: DataTypes.ENUM('academic', 'consistency', 'improvement', 'social', 'milestone'),
    defaultValue: 'academic'
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'achievements',
  timestamps: true
});

module.exports = Achievement;
