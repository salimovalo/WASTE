const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DistrictFuelStation = sequelize.define('DistrictFuelStation', {
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
  fuel_station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'fuel_stations',
      key: 'id'
    }
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Bu tuman uchun asosiy zapravka ekan'
  },
  allocation_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Bu tuman uchun ajratilgan foiz'
  }
}, {
  tableName: 'district_fuel_stations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['district_id', 'fuel_station_id'],
      unique: true
    },
    {
      fields: ['district_id']
    },
    {
      fields: ['fuel_station_id']
    }
  ]
});

module.exports = DistrictFuelStation;
