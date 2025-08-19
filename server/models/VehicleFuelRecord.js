const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleFuelRecord = sequelize.define('VehicleFuelRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  fuel_station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fuel_stations',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: true,
      notFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('Sana kelajakda bo\'lishi mumkin emas');
        }
      }
    }
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  fuel_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['diesel', 'gasoline', 'gas', 'electric']]
    }
  },
  amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      min: 0.1,
      max: 1000
    },
    comment: 'Yoqilg\'i miqdori (litr yoki m³)'
  },
  price_per_liter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 999999
    },
    comment: 'Litr narxi (so\'m)'
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 99999999
    },
    comment: 'Umumiy narx (so\'m)'
  },
  odometer: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 9999999
    },
    comment: 'Kilometrajik ko\'rsatkichi'
  },
  receipt_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  supplier: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  driver_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'vehicle_fuel_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vehicle_id']
    },
    {
      fields: ['fuel_station_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['fuel_type']
    },
    {
      fields: ['is_approved']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['approved_by']
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // Umumiy narxni avtomatik hisoblash
      if (instance.amount && instance.price_per_liter) {
        instance.total_cost = Math.round(instance.amount * instance.price_per_liter * 100) / 100;
      }
    },
    beforeUpdate: (instance) => {
      // Tasdiqlash vaqtini o'rnatish
      if (instance.is_approved && !instance.approved_at) {
        instance.approved_at = new Date();
      }
    }
  }
});

module.exports = VehicleFuelRecord;


