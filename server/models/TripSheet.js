const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TripSheet = sequelize.define('TripSheet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trip_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50]
    },
    comment: 'Yo\'l varaqasi raqami'
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
    },
    comment: 'Ish sanasi'
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    },
    comment: 'Texnika ID'
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    },
    comment: 'Haydovchi ID (Employee modeldan)'
  },
  loader1_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
    },
    comment: 'Birinchi yuk ortuvchi ID (Employee modeldan)'
  },
  loader2_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
    },
    comment: 'Ikkinchi yuk ortuvchi ID (Employee modeldan)'
  },
  
  // Spidometr ko'rsatkichlari
  odometer_start: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      isInt: true
    },
    comment: 'Spidometr kun boshida'
  },
  odometer_end: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      isInt: true,
      isGreaterThanStart(value) {
        if (this.odometer_start && value < this.odometer_start) {
          throw new Error('Kun oxirida spidometr ko\'rsatkichi kun boshigidan kichik bo\'lishi mumkin emas');
        }
      }
    },
    comment: 'Spidometr kun oxirida'
  },
  
  // Ish vaqti
  work_hours_volume: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 24
    },
    comment: 'Ish soatlari (hajm)'
  },
  work_hours_other: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 24
    },
    comment: 'Ish soatlari (boshqa)'
  },
  machine_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 24
    },
    comment: 'Mashina soatlari'
  },
  
  // Jo'nalishlar
  total_trips: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    },
    comment: 'Jami jo\'nalishlar soni'
  },
  
  // Masofalar
  total_distance: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Jami yurgan masofa (km)'
  },
  other_distance: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Boshqa masofalar (km)'
  },
  loaded_distance: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Yuk bilan yurgan masofa (km)'
  },
  
  // Yoqilg'i hisobi
  fuel_start: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Kun boshida yoqilg\'i qoldig\'i (litr)'
  },
  fuel_refilled: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Olingan yoqilg\'i (litr)'
  },
  fuel_station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fuel_stations',
      key: 'id'
    },
    comment: 'Zapravka ID'
  },
  fuel_consumption_actual: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Haqiqiy yoqilg\'i sarfiyoti (litr)'
  },
  fuel_consumption_norm: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Normativ yoqilg\'i sarfiyoti (litr)'
  },
  fuel_end: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Kun oxirida yoqilg\'i qoldig\'i (litr)'
  },
  
  // Status va tasdiqlash
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'submitted', 'approved', 'rejected']]
    },
    comment: 'Holat'
  },
  submitted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Yuborgan operator'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Yuborilgan vaqt'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Tasdiqlagan admin'
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tasdiqlangan vaqt'
  },
  
  // Qo'shimcha ma'lumotlar
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    },
    comment: 'Izohlar'
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Kunlik rasim URL'
  }
}, {
  tableName: 'trip_sheets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['date', 'vehicle_id'],
      unique: true,
      name: 'unique_vehicle_date_trip'
    },
    {
      fields: ['trip_number'],
      unique: true
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['date']
    }
  ],
  hooks: {
    beforeValidate: (instance) => {
      // Yo'l varaqasi raqamini avtomatik yaratish
      if (!instance.trip_number && instance.date && instance.vehicle_id) {
        const dateStr = new Date(instance.date).toISOString().slice(0, 10).replace(/-/g, '');
        instance.trip_number = `${dateStr}-${instance.vehicle_id}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Yoqilg'i hisob-kitoblari
      if (instance.fuel_start !== undefined && instance.fuel_refilled !== undefined && instance.fuel_consumption_actual !== undefined) {
        instance.fuel_end = instance.fuel_start + instance.fuel_refilled - instance.fuel_consumption_actual;
      }
      
      // Jami masofani hisoblash
      if (instance.odometer_start !== undefined && instance.odometer_end !== undefined) {
        instance.total_distance = instance.odometer_end - instance.odometer_start;
      }
    }
  }
});

module.exports = TripSheet;
