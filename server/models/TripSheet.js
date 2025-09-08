const { DataTypes, Op } = require('sequelize');
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
      isInt: true
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
  fuel_remaining_start: {
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
  fuel_taken: {
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
  fuel_remaining_end: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Kun oxirida yoqilg\'i qoldig\'i (litr)'
  },
  
  // Chiqindilar hajmi
  waste_volume_m3: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Chiqindilar hajmi (m3)'
  },
  
  // Poligonlar
  polygon_1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Poligon 1'
  },
  polygon_2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Poligon 2'
  },
  polygon_3: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Poligon 3'
  },
  polygon_4: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Poligon 4'
  },
  polygon_5: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Poligon 5'
  },
  
  // Tungi smena
  is_night_shift: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Tungi smena belgisi'
  },
  after_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tungi smena qaysi kundan keyin'
  },
  
  // User tracking
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Yaratgan foydalanuvchi'
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
    },
    
    beforeCreate: async (instance) => {
      // Kunlik saqlash tartibini tekshirish - vaqtincha o'chirildi
      // await TripSheet.validateDailySequence(instance);
    },
    
    beforeUpdate: async (instance) => {
      // Faqat draft holatdagi yozuvlarni yangilash mumkin
      if (instance.status !== 'draft' && instance.changed('status') === false) {
        throw new Error('Faqat loyiha holatidagi yozuvlarni o\'zgartirish mumkin');
      }
    }
  }
});

// Static metodlar
TripSheet.validateDailySequence = async function(instance) {
  const { date, vehicle_id } = instance;
  
  if (!date || !vehicle_id) {
    return; // Agar sana yoki texnika ID yo'q bo'lsa, tekshirmaymiz
  }
  
  const currentDate = new Date(date);
  const previousDate = new Date(currentDate);
  previousDate.setDate(previousDate.getDate() - 1);
  
  // Oldingi kunni tekshirish
  const previousDay = await TripSheet.findOne({
    where: {
      vehicle_id: vehicle_id,
      date: previousDate.toISOString().split('T')[0],
      status: {
        [Op.in]: ['submitted', 'approved'] // Faqat yuborilgan yoki tasdiqlangan
      }
    }
  });
  
  // Agar oldingi kun mavjud bo'lsa va u yuborilmagan bo'lsa
  if (previousDay && previousDay.status === 'draft') {
    throw new Error(`${previousDate.toLocaleDateString('uz-UZ')} sanasi uchun ma'lumotlar avval yuborilishi kerak`);
  }
  
  // Agar oldingi kun umuman mavjud bo'lmasa va bu birinchi kun emas
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  if (!previousDay && currentDate > firstDayOfMonth) {
    // Oyning birinchi kunidan boshlab barcha kunlarni tekshirish
    const missingDays = [];
    const checkDate = new Date(firstDayOfMonth);
    
    while (checkDate < currentDate) {
      const existingDay = await TripSheet.findOne({
        where: {
          vehicle_id: vehicle_id,
          date: checkDate.toISOString().split('T')[0],
          status: {
            [Op.in]: ['submitted', 'approved']
          }
        }
      });
      
      if (!existingDay) {
        missingDays.push(checkDate.toLocaleDateString('uz-UZ'));
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (missingDays.length > 0) {
      throw new Error(`Avval quyidagi sanalar uchun ma'lumotlar yuborilishi kerak: ${missingDays.join(', ')}`);
    }
  }
};

TripSheet.getDailySaveStatus = async function(vehicleId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Oyning oxirgi kuni
  
  const savedDays = await TripSheet.findAll({
    where: {
      vehicle_id: vehicleId,
      date: {
        [Op.between]: [
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ]
      },
      status: {
        [Op.in]: ['submitted', 'approved']
      }
    },
    attributes: ['date', 'status'],
    order: [['date', 'ASC']]
  });
  
  const result = {};
  for (let day = 1; day <= endDate.getDate(); day++) {
    const dayDate = new Date(year, month - 1, day);
    const dayStr = dayDate.toISOString().split('T')[0];
    
    const savedDay = savedDays.find(d => d.date === dayStr);
    result[day] = {
      saved: !!savedDay,
      status: savedDay ? savedDay.status : 'not_saved',
      canSave: false
    };
  }
  
  // Har bir kun uchun saqlash imkoniyatini aniqlash
  let lastSavedDay = 0;
  for (let day = 1; day <= endDate.getDate(); day++) {
    if (result[day].saved) {
      lastSavedDay = day;
    }
  }
  
  // Keyingi kunni saqlash mumkin
  if (lastSavedDay < endDate.getDate()) {
    const nextDay = lastSavedDay + 1;
    if (result[nextDay]) {
      result[nextDay].canSave = true;
    }
  }
  
  return result;
};

module.exports = TripSheet;
