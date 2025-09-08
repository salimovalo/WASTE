const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Weather = sequelize.define('Weather', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true,
    validate: {
      min: -50,
      max: 60
    },
    comment: 'Harorat (Celsius)'
  },
  condition: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    },
    comment: 'Ob-havo holati (sunny, cloudy, rainy, etc.)'
  },
  humidity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Namlik (%)'
  },
  wind_speed: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Shamol tezligi (m/s)'
  },
  pressure: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true,
    validate: {
      min: 800,
      max: 1200
    },
    comment: 'Atmosfera bosimi (hPa)'
  },
  api_response: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'API dan kelgan to\'liq javob (JSON)'
  },
  source: {
    type: DataTypes.ENUM('manual', 'api', 'weatherapi', 'openweather', 'accuweather'),
    defaultValue: 'manual',
    comment: 'Ma\'lumot manbai'
  }
}, {
  tableName: 'weather_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['district_id', 'date']
    },
    {
      fields: ['date']
    },
    {
      fields: ['district_id']
    }
  ]
});

module.exports = Weather;
