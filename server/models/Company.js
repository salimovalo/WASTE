const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 10]
    }
  },
  inn: {
    type: DataTypes.STRING(9),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [9, 9],
      isNumeric: true
    }
  },
  bank_account: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [20, 20],
      isNumeric: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  director_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  license_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Company;
