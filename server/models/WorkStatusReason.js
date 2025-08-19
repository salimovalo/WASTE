const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorkStatusReason = sequelize.define('WorkStatusReason', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    },
    comment: 'Sababning nomi'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    },
    comment: 'Sabab tavsifi'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'technical',
    validate: {
      isIn: [['technical', 'maintenance', 'administrative', 'weather', 'fuel', 'driver', 'other']]
    },
    comment: 'Sabab kategoriyasi'
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']]
    },
    comment: 'Sababning jiddiyligi'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Faol holat'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Kim yaratgan'
  }
}, {
  tableName: 'work_status_reasons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = WorkStatusReason;
