const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Block = sequelize.define('Block', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'blocks',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'targetId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['targetId']
    }
  ]
});

// 관계 설정
Block.belongsTo(User, { foreignKey: 'userId', as: 'blocker' });
Block.belongsTo(User, { foreignKey: 'targetId', as: 'blocked' });

module.exports = Block;

