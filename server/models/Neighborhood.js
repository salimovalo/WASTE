const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Neighborhood = sequelize.define('Neighborhood', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'districts',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  tozamakon_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'mixed',
    validate: {
      isIn: [['apartment_complex', 'private_houses', 'mixed']]
    }
  },
  households_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  population: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  collection_days: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Chiqindi yig\'ish kunlari: mon,wed,fri yoki daily'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'neighborhoods',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['district_id', 'code']
    },
    {
      fields: ['district_id']
    }
  ]
});

module.exports = Neighborhood;
