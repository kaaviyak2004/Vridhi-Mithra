const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  }
}, {
  tableName: 'chat_messages',
  timestamps: true
});

module.exports = ChatMessage;
