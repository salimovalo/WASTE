const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Polygon = sequelize.define('Polygon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [1, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity_m3: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Poligon sig\'imi (kub metr)'
  },
  current_volume_m3: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Hozirgi hajm (kub metr)'
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'districts',
      key: 'id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  coordinates: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'GPS koordinatalar: {"lat": 41.123, "lng": 69.456}'
  },
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  operating_hours: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ish vaqti: 08:00-18:00'
  },
  waste_types: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Qabul qilinadigan chiqindi turlari: ["tbo", "construction", "organic"]'
  },
  price_per_m3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Kub metr uchun narx'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Ommaviy foydalanish uchun ochiq'
  }
}, {
  tableName: 'polygons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['district_id']
    },
    {
      fields: ['company_id']
    },
    {
      fields: ['is_active']
    },
    {
      unique: true,
      fields: ['code'],
      where: {
        code: {
          [Op.ne]: null
        }
      }
    }
  ]
});

module.exports = Polygon;
