const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TripLoad = sequelize.define('TripLoad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trip_sheet_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trip_sheets',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Yo\'l varaqasi ID'
  },
  disposal_site_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'disposal_sites',
      key: 'id'
    },
    comment: 'Chiqindixona ID'
  },
  
  // Yuk ma'lumotlari
  trips_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    },
    comment: 'Jo\'nalishlar soni'
  },
  distance_with_load: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Yuk bilan masofa (km)'
  },
  
  // TBO (Qattiq maishiy chiqindilar)
  tbo_volume_m3: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'TBO hajmi (m3)'
  },
  tbo_weight_tn: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'TBO og\'irligi (tonna)'
  },
  
  // Smet (Yo'l axlati)
  smet_volume_m3: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Smet hajmi (m3)'
  },
  smet_weight_tn: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Smet og\'irligi (tonna)'
  },
  
  // Qo'shimcha ma'lumotlar
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    },
    comment: 'Izohlar'
  },
  
  // Vaqt belgilari (agar kerak bo'lsa)
  departure_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Jo\'nash vaqti'
  },
  arrival_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Yetib kelish vaqti'
  },
  unload_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Tushirish vaqti'
  }
}, {
  tableName: 'trip_loads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['trip_sheet_id']
    },
    {
      fields: ['disposal_site_id']
    },
    {
      fields: ['trip_sheet_id', 'disposal_site_id'],
      name: 'trip_disposal_index'
    }
  ],
  hooks: {
    beforeValidate: (instance) => {
      // Agar TBO hajmi berilgan bo'lsa, og'irlikni avtomatik hisoblash (taxminan 0.3 tonna/m3)
      if (instance.tbo_volume_m3 && !instance.tbo_weight_tn) {
        instance.tbo_weight_tn = instance.tbo_volume_m3 * 0.3;
      }
      
      // Agar smet hajmi berilgan bo'lsa, og'irlikni avtomatik hisoblash (taxminan 1.5 tonna/m3)
      if (instance.smet_volume_m3 && !instance.smet_weight_tn) {
        instance.smet_weight_tn = instance.smet_volume_m3 * 1.5;
      }
    }
  }
});

module.exports = TripLoad;
