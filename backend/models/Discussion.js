const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiscussionPost = sequelize.define('DiscussionPost', {
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
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'courses', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('doubt', 'discussion', 'resource', 'announcement'),
    defaultValue: 'discussion'
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  college_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'colleges', key: 'id' }
  }
}, {
  tableName: 'discussion_posts',
  timestamps: true
});

const DiscussionReply = sequelize.define('DiscussionReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'discussion_posts', key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'discussion_replies',
  timestamps: true
});

module.exports = { DiscussionPost, DiscussionReply };
