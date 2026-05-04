const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LearningPath = sequelize.define('LearningPath', {
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
  topic: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resources: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('resources');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('resources', JSON.stringify(val));
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed'),
    defaultValue: 'pending'
  },
  progress_percent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  generated_by_ai: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'learning_paths',
  timestamps: true
});

module.exports = LearningPath;
