const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { Op } = require('sequelize');
const { Vehicle, VehicleDailyData, VehicleFuelRecord, Company, District, FuelStation, User } = require('../models');
const { authenticate, authorize, checkCompanyAccess, applyDataFiltering } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

const router = express.Router();

// Multer konfiguratsiyasi Excel fayl upload uchun
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Faqat Excel fayllar (.xlsx, .xls) qabul qilinadi'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Barcha texnikalarni olish
// Bitta texnikani ID orqali olish
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: Company,
          attributes: ['name', 'code']
        },
        {
          model: District,
          attributes: ['name', 'code']
        }
      ]
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Texnika topilmadi'
      });
    }
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vehicle_type, fuel_type, is_active, company_id, district_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // User role bo'yicha data filtering
    whereClause = applyDataFiltering(req.user, whereClause);
    
    console.log('User filtering applied:', {
      user_id: req.user?.id,
      role: req.user?.role?.name,
      company_id: req.user?.company_id,
      district_id: req.user?.district_id,
      whereClause
    });
    
    // Qo'shimcha filtri (agar berilgan bo'lsa)
    if (company_id) {
      whereClause.company_id = company_id;
    }
    
    if (district_id) {
      whereClause.district_id = district_id;
    }
    
    // Texnika turi filtri
    if (vehicle_type) {
      whereClause.vehicle_type = vehicle_type;
    }
    
    // Yoqilg'i turi filtri
    if (fuel_type) {
      whereClause.fuel_type = fuel_type;
    }
    
    // Faol holat filtri
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { plate_number: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { technical_passport_number: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'tozamakon_id']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      vehicles,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Texnikalarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Texnikalarni olishda xatolik'
    });
  }
});

// Bitta texnikani olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'tozamakon_id']
        }
      ]
    });
    
    if (!vehicle) {
      return res.status(404).json({
        error: 'Texnika topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== vehicle.company_id) {
      return res.status(403).json({
        error: 'Bu texnikaga ruxsat yo\'q'
      });
    }
    
    res.json({ vehicle });
    
  } catch (error) {
    console.error('Texnikani olishda xatolik:', error);
    res.status(500).json({
      error: 'Texnikani olishda xatolik'
    });
  }
});

// Yangi transport yaratish
router.post('/', authenticate, authorize(['create_vehicles']), async (req, res) => {
  try {
    const {
      plate_number,
      vehicle_type,
      brand,
      model,
      year,
      capacity_m3,
      fuel_type,
      technical_passport_number,
      fuel_tank_volume,
      fuel_consumption_per_100km,
      trip_consumption,
      company_id,
      district_id
    } = req.body;
    
    if (!plate_number || !brand || !model) {
      return res.status(400).json({
        error: 'Davlat raqami, marka va model talab qilinadi'
      });
    }

    // Korxona tekshiruvi
    let finalCompanyId = company_id;
    if (req.user.role.name !== 'super_admin') {
      finalCompanyId = req.user.company_id;
    }

    if (finalCompanyId) {
      const company = await Company.findByPk(finalCompanyId);
      if (!company) {
        return res.status(400).json({
          error: 'Korxona topilmadi'
        });
      }
    }

    // Tuman tekshiruvi
    if (district_id) {
      const district = await District.findByPk(district_id);
      if (!district || (finalCompanyId && district.company_id !== finalCompanyId)) {
        return res.status(400).json({
          error: 'Tuman topilmadi yoki korxonaga tegishli emas'
        });
      }
    }
    
    const vehicle = await Vehicle.create({
      plate_number,
      vehicle_type,
      brand,
      model,
      year,
      capacity_m3,
      fuel_type,
      technical_passport_number,
      fuel_tank_volume,
      fuel_consumption_per_100km,
      trip_consumption,
      company_id: finalCompanyId,
      district_id
    });
    
    // Yaratilgan transportni to'liq ma'lumotlar bilan qaytarish
    const newVehicle = await Vehicle.findByPk(vehicle.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'tozamakon_id']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Texnika muvaffaqiyatli yaratildi',
      vehicle: newVehicle
    });
    
  } catch (error) {
    console.error('Texnika yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu davlat raqami allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Texnika yaratishda xatolik'
    });
  }
});

// Texnikani yangilash
router.put('/:id', authenticate, authorize(['edit_vehicles']), async (req, res) => {
  try {
    const {
      plate_number,
      vehicle_type,
      brand,
      model,
      year,
      capacity_m3,
      fuel_type,
      technical_passport_number,
      fuel_tank_volume,
      fuel_consumption_per_100km,
      trip_consumption,
      district_id,
      is_active
    } = req.body;
    
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        error: 'Texnika topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== vehicle.company_id) {
      return res.status(403).json({
        error: 'Bu transportni tahrirlash uchun ruxsat yo\'q'
      });
    }

    // Tuman tekshiruvi
    if (district_id) {
      const district = await District.findByPk(district_id);
      if (!district || district.company_id !== vehicle.company_id) {
        return res.status(400).json({
          error: 'Tuman topilmadi yoki korxonaga tegishli emas'
        });
      }
    }
    
    await vehicle.update({
      plate_number: plate_number || vehicle.plate_number,
      vehicle_type: vehicle_type || vehicle.vehicle_type,
      brand: brand || vehicle.brand,
      model: model || vehicle.model,
      year: year || vehicle.year,
      capacity_m3: capacity_m3 !== undefined ? capacity_m3 : vehicle.capacity_m3,
      fuel_type: fuel_type || vehicle.fuel_type,
      technical_passport_number: technical_passport_number !== undefined ? technical_passport_number : vehicle.technical_passport_number,
      fuel_tank_volume: fuel_tank_volume !== undefined ? fuel_tank_volume : vehicle.fuel_tank_volume,
      fuel_consumption_per_100km: fuel_consumption_per_100km !== undefined ? fuel_consumption_per_100km : vehicle.fuel_consumption_per_100km,
      trip_consumption: trip_consumption !== undefined ? trip_consumption : vehicle.trip_consumption,
      district_id: district_id !== undefined ? district_id : vehicle.district_id,
      is_active: is_active !== undefined ? is_active : vehicle.is_active
    });
    
    // Yangilangan transportni to'liq ma'lumotlar bilan qaytarish
    const updatedVehicle = await Vehicle.findByPk(vehicle.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'tozamakon_id']
        }
      ]
    });
    
    res.json({
      message: 'Texnika muvaffaqiyatli yangilandi',
      vehicle: updatedVehicle
    });
    
  } catch (error) {
    console.error('Texnikani yangilashda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu davlat raqami allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Texnikani yangilashda xatolik'
    });
  }
});

// Texnikani o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_vehicles']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        error: 'Texnika topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== vehicle.company_id) {
      return res.status(403).json({
        error: 'Bu transportni o\'chirish uchun ruxsat yo\'q'
      });
    }
    
    await vehicle.update({ is_active: false });
    
    res.json({
      message: 'Texnika muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Texnikani o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Texnikani o\'chirishda xatolik'
    });
  }
});

// Excel orqali transportlarni import qilish
router.post('/import', authenticate, authorize(['create_vehicles']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Excel fayl talab qilinadi'
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        error: 'Excel faylda ma\'lumot topilmadi'
      });
    }

    const results = {
      success: 0,
      errors: []
    };

    // Korxona ID ni aniqlash
    let companyId = req.body.company_id;
    if (req.user.role.name !== 'super_admin') {
      companyId = req.user.company_id;
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Ma'lumotlarni to'g'rilash va tekshirish
        const vehicleData = {
          plate_number: row['Davlat raqami'] || row['plate_number'],
          vehicle_type: row['Texnika turi'] || row['vehicle_type'] || 'other',
          brand: row['Marka'] || row['brand'],
          model: row['Model'] || row['model'],
          year: row['Yil'] || row['year'] ? parseInt(row['Yil'] || row['year']) : null,
          capacity_m3: row['Sig\'im (m3)'] || row['capacity_m3'] ? parseFloat(row['Sig\'im (m3)'] || row['capacity_m3']) : null,
          fuel_type: row['Yoqilg\'i turi'] || row['fuel_type'] || 'diesel',
          technical_passport_number: row['Texnik pasport raqami'] || row['technical_passport_number'],
          fuel_tank_volume: row['Yoqilg\'i baki xajimi'] || row['fuel_tank_volume'] ? parseFloat(row['Yoqilg\'i baki xajimi'] || row['fuel_tank_volume']) : null,
          fuel_consumption_per_100km: row['100km sarfi'] || row['fuel_consumption_per_100km'] ? parseFloat(row['100km sarfi'] || row['fuel_consumption_per_100km']) : null,
          trip_consumption: row['Qatnov sarfi'] || row['trip_consumption'] ? parseFloat(row['Qatnov sarfi'] || row['trip_consumption']) : null,
          company_id: companyId
        };

        // Majburiy maydonlarni tekshirish
        if (!vehicleData.plate_number || !vehicleData.brand || !vehicleData.model) {
          results.errors.push({
            row: i + 2, // Excel qatorini ko'rsatish (1-qator sarlavha)
            error: 'Davlat raqami, marka va model majburiy maydonlar'
          });
          continue;
        }
        
        // Davlat raqami formatini tekshirish (O'zbekiston formatlari)
        const plateNumber = vehicleData.plate_number.toString().trim().replace(/[\s\-]/g, '').toUpperCase();
        const format1 = /^[0-9]{2}[0-9]{3}[A-Z]{3}$/; // 01038SMA
        const format2 = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/; // 01S038MA
        
        if (plateNumber.length !== 8 || (!format1.test(plateNumber) && !format2.test(plateNumber))) {
          results.errors.push({
            row: i + 2,
            error: `Davlat raqami noto'g'ri format (${vehicleData.plate_number}). To'g'ri: 01038SMA yoki 01S038MA`
          });
          continue;
        }

        // Mavjudligini tekshirish
        const existingVehicle = await Vehicle.findOne({
          where: { plate_number: vehicleData.plate_number }
        });
        
        if (existingVehicle) {
          results.errors.push({
            row: i + 2,
            error: `Davlat raqami allaqachon mavjud: ${vehicleData.plate_number}`
          });
          continue;
        }
        
        await Vehicle.create(vehicleData);
        results.success++;

      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message || 'Noma\'lum xatolik'
        });
      }
    }

    res.json({
      message: `Import yakunlandi. ${results.success} ta texnika muvaffaqiyatli qo'shildi`,
      results
    });

  } catch (error) {
    console.error('Excel import qilishda xatolik:', error);
    res.status(500).json({
      error: 'Excel import qilishda xatolik'
    });
  }
});

// Texnika statistikalari
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    
    // Korxona filtri
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      whereClause.company_id = req.user.company_id;
    }

    const [
      totalVehicles,
      activeVehicles,
      vehiclesByType,
      vehiclesByFuelType
    ] = await Promise.all([
      Vehicle.count({ where: whereClause }),
      Vehicle.count({ where: { ...whereClause, is_active: true } }),
      Vehicle.findAll({
        where: whereClause,
        attributes: ['vehicle_type', [Vehicle.sequelize.fn('COUNT', '*'), 'count']],
        group: ['vehicle_type'],
        raw: true
      }),
      Vehicle.findAll({
        where: whereClause,
        attributes: ['fuel_type', [Vehicle.sequelize.fn('COUNT', '*'), 'count']],
        group: ['fuel_type'],
        raw: true
      })
    ]);

    res.json({
      totalVehicles,
      activeVehicles,
      inactiveVehicles: totalVehicles - activeVehicles,
      vehiclesByType,
      vehiclesByFuelType
    });

  } catch (error) {
    console.error('Texnika statistikasini olishda xatolik:', error);
    res.status(500).json({
      error: 'Texnika statistikasini olishda xatolik'
    });
  }
});

// Kunlik ma'lumotlar API
router.get('/daily-data', authenticate, async (req, res) => {
  try {
    const { date, vehicle_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Korxona filtri
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      // Faqat o'z korxonasining texnikalarini ko'rish
      const companyVehicles = await Vehicle.findAll({
        where: { company_id: req.user.company_id },
        attributes: ['id']
      });
      const vehicleIds = companyVehicles.map(v => v.id);
      whereClause.vehicle_id = { [Op.in]: vehicleIds };
    }
    
    // Sana filtri
    if (date) {
      whereClause.date = date;
    }
    
    // Texnika filtri
    if (vehicle_id) {
      whereClause.vehicle_id = vehicle_id;
    }
    
    const { count, rows: records } = await VehicleDailyData.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'brand', 'model', 'vehicle_type'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC'], ['created_at', 'DESC']]
    });
    
    res.json({
      records,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching daily data:', error);
    res.status(500).json({
      error: 'Kunlik ma\'lumotlarni olishda xatolik'
    });
  }
});

// Kunlik ma'lumot qo'shish
router.post('/daily-data', authenticate, authorize(['create_daily_data']), async (req, res) => {
  try {
    const {
      vehicle_id,
      date,
      start_time,
      end_time,
      start_km,
      end_km,
      fuel_amount,
      route_description,
      notes,
      status = 'in_progress'
    } = req.body;
    
    if (!vehicle_id || !date || !start_time || !start_km) {
      return res.status(400).json({
        error: 'Texnika, sana, boshlanish vaqti va boshlang\'ich kilometrajik talab qilinadi'
      });
    }
    
    // Texnikani tekshirish va ruxsat
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        error: 'Texnika topilmadi'
      });
    }
    
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== vehicle.company_id) {
      return res.status(403).json({
        error: 'Bu texnika uchun ruxsat yo\'q'
      });
    }
    
    // Bir kun uchun bir marta ma'lumot kiritish tekshiruvi
    const existingRecord = await VehicleDailyData.findOne({
      where: { vehicle_id, date }
    });
    
    if (existingRecord) {
      return res.status(400).json({
        error: 'Bu sana uchun allaqachon ma\'lumot kiritilgan'
      });
    }
    
    const dailyData = await VehicleDailyData.create({
      vehicle_id,
      date,
      start_time,
      end_time,
      start_km,
      end_km,
      fuel_amount,
      route_description,
      notes,
      status,
      created_by: req.user.id
    });
    
    // To'liq ma'lumot bilan qaytarish
    const newRecord = await VehicleDailyData.findByPk(dailyData.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'brand', 'model']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Kunlik ma\'lumot muvaffaqiyatli qo\'shildi',
      record: newRecord
    });
    
  } catch (error) {
    console.error('Error creating daily data:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Kunlik ma\'lumot qo\'shishda xatolik'
    });
  }
});

// Yoqilg'i yozuvlari API
router.get('/fuel-records', authenticate, async (req, res) => {
  try {
    const { date, vehicle_id, fuel_type, page = 1, limit = 10, is_approved } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Korxona filtri
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      const companyVehicles = await Vehicle.findAll({
        where: { company_id: req.user.company_id },
        attributes: ['id']
      });
      const vehicleIds = companyVehicles.map(v => v.id);
      whereClause.vehicle_id = { [Op.in]: vehicleIds };
    }
    
    // Sana filtri
    if (date) {
      whereClause.date = date;
    }
    
    // Texnika filtri
    if (vehicle_id) {
      whereClause.vehicle_id = vehicle_id;
    }
    
    // Yoqilg'i turi filtri
    if (fuel_type) {
      whereClause.fuel_type = fuel_type;
    }
    
    // Tasdiqlash holati filtri
    if (is_approved !== undefined) {
      whereClause.is_approved = is_approved === 'true';
    }
    
    const { count, rows: records } = await VehicleFuelRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'brand', 'model', 'fuel_type'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: FuelStation,
          as: 'fuel_station',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC'], ['time', 'DESC']]
    });
    
    res.json({
      records,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fuel records:', error);
    res.status(500).json({
      error: 'Yoqilg\'i ma\'lumotlarini olishda xatolik'
    });
  }
});

// Yoqilg'i statistikasi
router.get('/fuel-stats', authenticate, async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;
    
    let whereClause = {};
    
    // Korxona filtri
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      const companyVehicles = await Vehicle.findAll({
        where: { company_id: req.user.company_id },
        attributes: ['id']
      });
      const vehicleIds = companyVehicles.map(v => v.id);
      whereClause.vehicle_id = { [Op.in]: vehicleIds };
    }
    
    // Texnika filtri
    if (vehicle_id) {
      whereClause.vehicle_id = vehicle_id;
    }
    
    // Sana oralig'i filtri
    if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [start_date, end_date]
      };
    }
    
    const [
      totalStats,
      fuelTypeStats,
      monthlyStats
    ] = await Promise.all([
      // Umumiy statistika
      VehicleFuelRecord.findOne({
        where: whereClause,
        attributes: [
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('amount')), 'totalFuel'],
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('total_cost')), 'totalCost'],
          [VehicleFuelRecord.sequelize.fn('AVG', VehicleFuelRecord.sequelize.col('price_per_liter')), 'averagePrice'],
          [VehicleFuelRecord.sequelize.fn('COUNT', '*'), 'totalRecords']
        ],
        raw: true
      }),
      
      // Yoqilg'i turi bo'yicha statistika
      VehicleFuelRecord.findAll({
        where: whereClause,
        attributes: [
          'fuel_type',
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('amount')), 'totalAmount'],
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('total_cost')), 'totalCost'],
          [VehicleFuelRecord.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['fuel_type'],
        raw: true
      }),
      
      // Oylik statistika
      VehicleFuelRecord.findAll({
        where: whereClause,
        attributes: [
          [VehicleFuelRecord.sequelize.fn('DATE_TRUNC', 'month', VehicleFuelRecord.sequelize.col('date')), 'month'],
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('amount')), 'totalAmount'],
          [VehicleFuelRecord.sequelize.fn('SUM', VehicleFuelRecord.sequelize.col('total_cost')), 'totalCost']
        ],
        group: [VehicleFuelRecord.sequelize.fn('DATE_TRUNC', 'month', VehicleFuelRecord.sequelize.col('date'))],
        order: [[VehicleFuelRecord.sequelize.fn('DATE_TRUNC', 'month', VehicleFuelRecord.sequelize.col('date')), 'DESC']],
        limit: 12,
        raw: true
      })
    ]);
    
    res.json({
      totalFuel: parseFloat(totalStats?.totalFuel || 0),
      totalCost: parseFloat(totalStats?.totalCost || 0),
      averagePrice: parseFloat(totalStats?.averagePrice || 0),
      totalRecords: parseInt(totalStats?.totalRecords || 0),
      fuelTypeStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Error fetching fuel stats:', error);
    res.status(500).json({
      error: 'Yoqilg\'i statistikasini olishda xatolik'
    });
  }
});

// Yoqilg'i yozuv qo'shish
router.post('/fuel-records', authenticate, authorize(['create_fuel_records']), async (req, res) => {
  try {
    const {
      vehicle_id,
      fuel_station_id,
      date = new Date().toISOString().split('T')[0],
      time = new Date().toTimeString().split(' ')[0].substr(0, 5),
      fuel_type,
      amount,
      price_per_liter,
      odometer,
      receipt_number,
      supplier,
      driver_name,
      notes
    } = req.body;
    
    if (!vehicle_id || !fuel_type || !amount || !price_per_liter || !odometer) {
      return res.status(400).json({
        error: 'Texnika, yoqilg\'i turi, miqdor, narx va kilometrajik talab qilinadi'
      });
    }
    
    // Texnikani tekshirish va ruxsat
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        error: 'Texnika topilmadi'
      });
    }
    
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== vehicle.company_id) {
      return res.status(403).json({
        error: 'Bu texnika uchun ruxsat yo\'q'
      });
    }
    
    // Yoqilg'i bekat tekshiruvi (agar ko'rsatilgan bo'lsa)
    if (fuel_station_id) {
      const fuelStation = await FuelStation.findByPk(fuel_station_id);
      if (!fuelStation) {
        return res.status(404).json({
          error: 'Yoqilg\'i bekati topilmadi'
        });
      }
    }
    
    const fuelRecord = await VehicleFuelRecord.create({
      vehicle_id,
      fuel_station_id,
      date,
      time,
      fuel_type,
      amount,
      price_per_liter,
      total_cost: amount * price_per_liter,
      odometer,
      receipt_number,
      supplier,
      driver_name,
      notes,
      created_by: req.user.id
    });
    
    // To'liq ma'lumot bilan qaytarish
    const newRecord = await VehicleFuelRecord.findByPk(fuelRecord.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'brand', 'model']
        },
        {
          model: FuelStation,
          as: 'fuel_station',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Yoqilg\'i ma\'lumoti muvaffaqiyatli qo\'shildi',
      record: newRecord
    });
    
  } catch (error) {
    console.error('Error creating fuel record:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Yoqilg\'i ma\'lumotini qo\'shishda xatolik'
    });
  }
});

module.exports = router;
