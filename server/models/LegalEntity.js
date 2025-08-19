const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LegalEntity = sequelize.define('LegalEntity', {
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
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  tax_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [5, 50]
    }
  },
  legal_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [2, 255]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'legal_entities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['district_id']
    },
    {
      fields: ['tax_id']
    }
  ]
});

module.exports = LegalEntity;
