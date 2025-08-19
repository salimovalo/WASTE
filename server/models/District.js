const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
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
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 10]
    }
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  population: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  area_km2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tozamakon_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [3, 50]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'districts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'code']
    },
    {
      fields: ['company_id']
    }
  ]
});

module.exports = District;
