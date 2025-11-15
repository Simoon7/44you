const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Compatibility = sequelize.define('Compatibility', {
  user1Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  user2Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  matchingScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: '궁합 점수 (0.00 ~ 100.00)'
  },
  traits1: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'user1의 성향 데이터 (JSON 형식)'
  },
  traits2: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'user2의 성향 데이터 (JSON 형식)'
  },
  calculatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'compatibilities',
  timestamps: false, // createdAt, updatedAt 사용 안 함 (calculatedAt 사용)
  indexes: [
    {
      unique: true,
      fields: ['user1Id', 'user2Id']
    }
  ]
});

module.exports = Compatibility;




