const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
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
  plate_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [4, 20],
      isValidPlateNumber(value) {
        // O'zbekiston davlat raqamlari uchun aniq formatlar
        const cleanValue = value.replace(/[\s\-]/g, '').toUpperCase();
        
        // O'zbekiston davlat raqamlari formatları:
        // Format 1: 01038SMA (2 raqam + 3 raqam + 3 harf) - jami 8 belgi
        // Format 2: 01S038MA (2 raqam + 1 harf + 3 raqam + 2 harf) - jami 8 belgi
        const format1 = /^[0-9]{2}[0-9]{3}[A-Z]{3}$/; // XX XXX XXX
        const format2 = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/; // XX X XXX XX
        
        if (cleanValue.length !== 8 || (!format1.test(cleanValue) && !format2.test(cleanValue))) {
          throw new Error('Davlat raqami formati noto\'g\'ri. To\'g\'ri formatlar: 01038SMA yoki 01S038MA');
        }
      }
    }
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['garbage_truck', 'container_truck', 'compactor_truck', 'pickup_truck', 'other']]
    }
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1950,
      max: new Date().getFullYear() + 1
    }
  },
  capacity_m3: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0.1,
      max: 100
    }
  },
  fuel_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['diesel', 'gasoline', 'gas', 'electric', 'hybrid']]
    }
  },
  technical_passport_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [3, 50]
    }
  },
  fuel_tank_volume: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    validate: {
      min: 10,
      max: 1000
    },
    comment: 'Yoqilg\'i baki xajimi (litr)'
  },
  fuel_consumption_per_100km: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 1,
      max: 100
    },
    comment: '100 km ga yoqilg\'i sarfi normasi (litr)'
  },
  trip_consumption: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0.1,
      max: 50
    },
    comment: 'Har bir qatnov uchun belgilangan yoqilg\'i xajmi (litr)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'vehicles',
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
      fields: ['vehicle_type']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Vehicle;
