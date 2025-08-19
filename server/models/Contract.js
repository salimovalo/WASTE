const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contract_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  legal_entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'legal_entities',
      key: 'id'
    }
  },
  contract_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contract_types',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      notEmpty: true
    }
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isAfterStartDate(value) {
        if (value && this.start_date && new Date(value) <= new Date(this.start_date)) {
          throw new Error('Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak');
        }
      }
    }
  },
  monthly_volume_m3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  price_per_m3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  monthly_fixed_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  signed_at: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['legal_entity_id']
    },
    {
      fields: ['contract_type_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Contract;
