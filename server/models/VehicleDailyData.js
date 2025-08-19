const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleDailyData = sequelize.define('VehicleDailyData', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      notFuture(value) {
        if (new Date(value) > new Date()) {
          throw new Error('Sana kelajakda bo\'lishi mumkin emas');
        }
      }
    }
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      isAfterStartTime(value) {
        if (value && this.start_time && value <= this.start_time) {
          throw new Error('Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak');
        }
      }
    }
  },
  start_km: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 9999999
    },
    comment: 'Ish boshlangandagi kilometrajik'
  },
  end_km: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 9999999,
      isGreaterThanStart(value) {
        if (value !== null && value < this.start_km) {
          throw new Error('Yakuniy kilometrajik boshlang\'ich kilometrajikdan kichik bo\'lishi mumkin emas');
        }
      }
    },
    comment: 'Ish yakunlangandagi kilometrajik'
  },
  distance_traveled: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 9999
    },
    comment: 'Bosib o\'tilgan masofa (km)'
  },
  fuel_amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1000
    },
    comment: 'Sarflangan yoqilg\'i miqdori (litr)'
  },
  work_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 24
    },
    comment: 'Ish soatlari'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'in_progress',
    validate: {
      isIn: [['in_progress', 'completed', 'cancelled', 'breakdown']]
    }
  },
  route_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
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
  tableName: 'vehicle_daily_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vehicle_id', 'date'],
      unique: true,
      name: 'unique_vehicle_date'
    },
    {
      fields: ['date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_by']
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // Masofa va ish soatlarini avtomatik hisoblash
      if (instance.start_km && instance.end_km) {
        instance.distance_traveled = instance.end_km - instance.start_km;
      }
      
      if (instance.start_time && instance.end_time) {
        const start = new Date(`1970-01-01T${instance.start_time}`);
        const end = new Date(`1970-01-01T${instance.end_time}`);
        const diffMs = end - start;
        instance.work_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }
  }
});

module.exports = VehicleDailyData;


