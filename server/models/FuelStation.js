const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FuelStation = sequelize.define('FuelStation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  iin_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [9, 20],
      isNumeric: {
        msg: 'IIN raqami faqat raqamlardan iborat bo\'lishi kerak'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fuel_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['gas', 'diesel', 'gasoline']]
    }
  },
  fuel_price_per_liter: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Yoqilg\'i narxi (1 litr uchun so\'m)'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [7, 20]
    }
  },
  manager_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },
  capacity_liters: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 100
    },
    comment: 'Zapravka umumiy sig\'imi (litr)'
  },
  current_stock: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Hozirgi qoldiq (litr)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'GPS koordinatalari {lat: number, lng: number}'
  }
}, {
  tableName: 'fuel_stations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['fuel_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['iin_number'],
      unique: true
    }
  ]
});

module.exports = FuelStation;
