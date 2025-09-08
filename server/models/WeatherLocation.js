const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WeatherLocation = sequelize.define('WeatherLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'districts',
      key: 'id'
    },
    comment: 'Tuman ID'
  },
  weather_city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    },
    comment: 'Ob-havo API dagi shahar nomi'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    },
    comment: 'Kenglik (latitude)'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    },
    comment: 'Uzunlik (longitude)'
  },
  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true,
    defaultValue: 'UZ',
    validate: {
      len: [2, 2]
    },
    comment: 'Davlat kodi'
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Asia/Tashkent',
    comment: 'Vaqt zonasi'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Faol holat'
  }
}, {
  tableName: 'weather_locations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['district_id']
    },
    {
      fields: ['weather_city']
    }
  ]
});

module.exports = WeatherLocation;
