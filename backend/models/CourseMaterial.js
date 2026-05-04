const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CourseMaterial = sequelize.define('CourseMaterial', {
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
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('pdf', 'video', 'document', 'link', 'other'),
    defaultValue: 'other'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'course_materials',
  timestamps: true
});

module.exports = CourseMaterial;
