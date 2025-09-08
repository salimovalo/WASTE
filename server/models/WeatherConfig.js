const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WeatherConfig = sequelize.define('WeatherConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  api_provider: {
    type: DataTypes.ENUM('weatherapi', 'openweather', 'accuweather', 'visualcrossing'),
    allowNull: false,
    defaultValue: 'weatherapi',
    comment: 'Ob-havo API ta\'minlovchi'
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 255]
    },
    comment: 'API kaliti'
  },
  api_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'API asosiy URL'
  },
  update_interval: {
    type: DataTypes.INTEGER,
    defaultValue: 3600,
    validate: {
      min: 300,
      max: 86400
    },
    comment: 'Yangilanish davri (soniyalarda)'
  },
  auto_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Avtomatik yangilanish'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Faol holat'
  }
}, {
  tableName: 'weather_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WeatherConfig;
