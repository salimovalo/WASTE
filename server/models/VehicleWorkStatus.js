const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleWorkStatus = sequelize.define('VehicleWorkStatus', {
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
    },
    comment: 'Texnika ID'
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
    comment: 'Sana'
  },
  work_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['working', 'not_working']]
    },
    comment: 'Ish holati (ishga chiqdi/chiqmadi)'
  },
  reason_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'work_status_reasons',
      key: 'id'
    },
    comment: 'Ishga chiqmaslik sababi ID (agar chiqmagan bo\'lsa)'
  },
  reason_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    },
    comment: 'Sabab haqida batafsil ma\'lumot'
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Ma\'lumot kiritgan operator'
  },
  confirmed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Tasdiqlagan admin'
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tasdiqlangan vaqt'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'rejected']]
    },
    comment: 'Tasdiqlash holati'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    },
    comment: 'Rad etish sababi'
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: true,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    comment: 'Ishni boshlash vaqti'
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
    },
    comment: 'Ishni tugatish vaqti'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    },
    comment: 'Qo\'shimcha izohlar'
  }
}, {
  tableName: 'vehicle_work_status',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vehicle_id', 'date'],
      unique: true,
      name: 'unique_vehicle_date_status'
    },
    {
      fields: ['date']
    },
    {
      fields: ['work_status']
    },
    {
      fields: ['status']
    },
    {
      fields: ['operator_id']
    },
    {
      fields: ['confirmed_by']
    }
  ],
  hooks: {
    beforeValidate: (instance) => {
      // Agar ishga chiqmagan bo'lsa, sabab majburiy
      if (instance.work_status === 'not_working' && !instance.reason_id) {
        throw new Error('Ishga chiqmaslik sababi ko\'rsatilishi shart');
      }
      
      // Agar ishga chiqgan bo'lsa, sabab bo'lmasligi kerak
      if (instance.work_status === 'working') {
        instance.reason_id = null;
        instance.reason_details = null;
      }
    }
  }
});

module.exports = VehicleWorkStatus;
