const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DisposalSite = sequelize.define('DisposalSite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    },
    comment: 'Chiqindixona nomi'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    },
    comment: 'Kod'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    },
    comment: 'Manzil'
  },
  type: {
    type: DataTypes.ENUM('tbo', 'smet', 'other'),
    defaultValue: 'tbo',
    validate: {
      isIn: [['tbo', 'smet', 'other']]
    },
    comment: 'Chiqindixona turi'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    },
    comment: 'Kenglik (GPS koordinatalar)'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    },
    comment: 'Uzunlik (GPS koordinatalar)'
  },
  working_hours: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ish vaqti'
  },
  contact_person: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Mas\'ul shaxs'
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    },
    comment: 'Aloqa telefoni'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Faol holat'
  }
}, {
  tableName: 'disposal_sites',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['code'],
      unique: true,
      where: {
        code: {
          [require('sequelize').Op.ne]: null
        }
      }
    }
  ]
});

module.exports = DisposalSite;
