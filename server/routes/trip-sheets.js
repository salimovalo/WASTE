const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');
const multer = require('multer');
const path = require('path');

const { 
  TripSheet, 
  TripLoad,
  DisposalSite,
  Vehicle, 
  User, 
  Employee,
  FuelStation,
  District,
  Company 
} = require('../models');
const { authenticate, applyDataFiltering } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

// Multer konfiguratsiyasi rasim upload uchun
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/trip-photos/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'trip-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllar qabul qilinadi'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Barcha yo'l varaqalarini olish
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW_VEHICLES), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      date, 
      vehicle_id, 
      driver_id, 
      status,
      start_date,
      end_date
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // User role bo'yicha data filtering
    let vehicleWhere = {};
    vehicleWhere = applyDataFiltering(req.user, vehicleWhere);
    
    // Sana filtri
    if (date) {
      whereClause.date = date;
    } else if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [start_date, end_date]
      };
    }
    
    // Boshqa filtrlar
    if (vehicle_id) whereClause.vehicle_id = vehicle_id;
    if (driver_id) whereClause.driver_id = driver_id;
    if (status) whereClause.status = status;

    const { count, rows: tripSheets } = await TripSheet.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: vehicleWhere,
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            },
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'position']
        },
        {
          model: Employee,
          as: 'loader1',
          attributes: ['id', 'first_name', 'last_name', 'position']
        },
        {
          model: Employee,
          as: 'loader2',
          attributes: ['id', 'first_name', 'last_name', 'position']
        },
        {
          model: FuelStation,
          as: 'fuel_station',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: TripLoad,
          as: 'loads',
          include: [
            {
              model: DisposalSite,
              as: 'disposal_site',
              attributes: ['id', 'name', 'type']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: tripSheets,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trip sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Yo\'l varaqalarini olishda xatolik',
      error: error.message
    });
  }
});

// Bitta yo'l varaqasini olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tripSheet = await TripSheet.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            { model: District, as: 'district' },
            { model: Company, as: 'company' }
          ]
        },
        { model: Employee, as: 'driver' },
        { model: Employee, as: 'loader1' },
        { model: Employee, as: 'loader2' },
        { model: FuelStation, as: 'fuel_station' },
        { model: User, as: 'submitter' },
        { model: User, as: 'approver' },
        {
          model: TripLoad,
          as: 'loads',
          include: [{ model: DisposalSite, as: 'disposal_site' }]
        }
      ]
    });

    if (!tripSheet) {
      return res.status(404).json({
        success: false,
        message: 'Yo\'l varaqasi topilmadi'
      });
    }

    res.json({
      success: true,
      data: tripSheet
    });
  } catch (error) {
    console.error('Error fetching trip sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Yo\'l varaqasini olishda xatolik',
      error: error.message
    });
  }
});

// Yangi yo'l varaqasi yaratish yoki yangilash
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const {
      date,
      vehicle_id,
      driver_id,
      loader1_id,
      loader2_id,
      odometer_start,
      odometer_end,
      work_hours_volume = 0,
      work_hours_other = 0,
      machine_hours = 0,
      total_trips = 0,
      other_distance = 0,
      fuel_start = 0,
      fuel_refilled = 0,
      fuel_station_id,
      fuel_consumption_actual = 0,
      fuel_consumption_norm = 0,
      notes,
      loads = []
    } = req.body;
    
    const user = req.user;

    // Validatsiya
    if (!date || !vehicle_id || !driver_id || odometer_start === undefined || odometer_end === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Sana, texnika, haydovchi va spidometr ko\'rsatkichlari majburiy'
      });
    }

    // Texnikani tekshirish va ruxsat
    const vehicle = await Vehicle.findByPk(vehicle_id, {
      include: [{ model: District, as: 'district' }]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Texnika topilmadi'
      });
    }

    // Operator faqat o'z tumani texnikalariga ma'lumot kirita oladi
    if (user.role.name === 'operator' && vehicle.district_id !== user.district_id) {
      return res.status(403).json({
        success: false,
        message: 'Sizda bu texnika uchun ruxsat yo\'q'
      });
    }

    // Mavjud yozuvni tekshirish
    let tripSheet = await TripSheet.findOne({
      where: { vehicle_id, date }
    });

    // Rasim URL
    const photo_url = req.file ? `/uploads/trip-photos/${req.file.filename}` : null;

    const tripSheetData = {
      date,
      vehicle_id,
      driver_id,
      loader1_id,
      loader2_id,
      odometer_start: parseInt(odometer_start),
      odometer_end: parseInt(odometer_end),
      work_hours_volume: parseFloat(work_hours_volume),
      work_hours_other: parseFloat(work_hours_other),
      machine_hours: parseFloat(machine_hours),
      total_trips: parseInt(total_trips),
      other_distance: parseFloat(other_distance),
      fuel_start: parseFloat(fuel_start),
      fuel_refilled: parseFloat(fuel_refilled),
      fuel_station_id,
      fuel_consumption_actual: parseFloat(fuel_consumption_actual),
      fuel_consumption_norm: parseFloat(fuel_consumption_norm),
      notes,
      submitted_by: user.id,
      submitted_at: new Date(),
      status: 'submitted'
    };

    if (photo_url) {
      tripSheetData.photo_url = photo_url;
    }

    if (tripSheet) {
      // Agar tasdiqlangan bo'lsa, faqat admin o'zgartira oladi
      if (tripSheet.status === 'approved' && 
          !['super_admin', 'company_admin'].includes(user.role.name)) {
        return res.status(403).json({
          success: false,
          message: 'Tasdiqlangan ma\'lumotni o\'zgartirish uchun ruxsat yo\'q'
        });
      }

      await tripSheet.update(tripSheetData);
    } else {
      tripSheet = await TripSheet.create(tripSheetData);
    }

    // Yuk ma'lumotlarini saqlash
    if (loads && loads.length > 0) {
      // Eski yuk ma'lumotlarini o'chirish
      await TripLoad.destroy({
        where: { trip_sheet_id: tripSheet.id }
      });

      // Yangi yuk ma'lumotlarini qo'shish
      const loadsData = JSON.parse(loads).map(load => ({
        trip_sheet_id: tripSheet.id,
        disposal_site_id: load.disposal_site_id,
        trips_count: parseInt(load.trips_count || 0),
        distance_with_load: parseFloat(load.distance_with_load || 0),
        tbo_volume_m3: parseFloat(load.tbo_volume_m3 || 0),
        tbo_weight_tn: parseFloat(load.tbo_weight_tn || 0),
        smet_volume_m3: parseFloat(load.smet_volume_m3 || 0),
        smet_weight_tn: parseFloat(load.smet_weight_tn || 0),
        notes: load.notes
      }));

      await TripLoad.bulkCreate(loadsData);
    }

    // Javobda to'liq ma'lumot qaytarish
    const result = await TripSheet.findByPk(tripSheet.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [{ model: District, as: 'district' }]
        },
        { model: Employee, as: 'driver' },
        { model: Employee, as: 'loader1' },
        { model: Employee, as: 'loader2' },
        { model: FuelStation, as: 'fuel_station' },
        {
          model: TripLoad,
          as: 'loads',
          include: [{ model: DisposalSite, as: 'disposal_site' }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Yo\'l varaqasi muvaffaqiyatli saqlandi',
      data: result
    });

  } catch (error) {
    console.error('Error creating/updating trip sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Ma\'lumot saqlashda xatolik',
      error: error.message
    });
  }
});

// Yo'l varaqasini tasdiqlash (faqat adminlar)
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body; // 'approved' yoki 'rejected'
    const user = req.user;

    // Faqat adminlar tasdiqlashi mumkin
    if (!['super_admin', 'company_admin'].includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Tasdiqlash uchun ruxsat yo\'q'
      });
    }

    const tripSheet = await TripSheet.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [{ model: District, as: 'district' }]
        }
      ]
    });

    if (!tripSheet) {
      return res.status(404).json({
        success: false,
        message: 'Yo\'l varaqasi topilmadi'
      });
    }

    // Kompaniya admini faqat o'z kompaniyasi ma'lumotlarini tasdiqlashi mumkin
    if (user.role.name === 'company_admin' && 
        tripSheet.vehicle.company_id !== user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Bu ma\'lumotni tasdiqlash uchun ruxsat yo\'q'
      });
    }

    const updateData = {
      status,
      approved_by: user.id,
      approved_at: new Date()
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    }

    await tripSheet.update(updateData);

    res.json({
      success: true,
      message: status === 'approved' ? 'Yo\'l varaqasi tasdiqlandi' : 'Yo\'l varaqasi rad etildi'
    });

  } catch (error) {
    console.error('Error approving trip sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Tasdiqlashda xatolik',
      error: error.message
    });
  }
});

// Statistika olish
// Oylik ma'lumotlarni olish
router.get('/monthly/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { month } = req.query; // Format: YYYY-MM
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Oy parametri kerak'
      });
    }
    
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const tripSheets = await TripSheet.findAll({
      where: {
        vehicle_id: vehicleId,
        date: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd
        }
      },
      include: [
        {
          model: TripLoad,
          as: 'loads'
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name', 'position']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.json({
      success: true,
      data: tripSheets
    });
  } catch (error) {
    console.error('Get monthly trip sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
});

// Oylik ma'lumotlarni saqlash
router.post('/monthly/:vehicleId', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { month, data } = req.body;
    
    if (!month || !data) {
      return res.status(400).json({
        success: false,
        message: 'Oy va ma\'lumotlar parametrlari kerak'
      });
    }
    
    // Ma'lumotlarni saqlash yoki yangilash
    const results = [];
    
    for (const dayData of data) {
      if (dayData.trip_number || dayData.odometer_start > 0) {
        const tripDate = new Date(month + '-' + String(dayData.key).padStart(2, '0'));
        
        const [tripSheet, created] = await TripSheet.findOrCreate({
          where: {
            vehicle_id: vehicleId,
            date: tripDate
          },
          defaults: {
            vehicle_id: vehicleId,
            date: tripDate,
            trip_number: dayData.trip_number,
            driver_id: null, // To be updated with actual driver selection
            odometer_start: dayData.odometer_start || 0,
            odometer_end: dayData.odometer_end || 0,
            fuel_start: dayData.fuel_remaining_start || 0,
            fuel_taken: dayData.fuel_taken || 0,
            fuel_consumption_actual: dayData.fuel_consumed_actual || 0,
            total_trips: dayData.waste_tbo_trips || 0,
            status: 'draft',
            created_by: req.user.id
          }
        });
        
        if (!created) {
          // Update existing record
          await tripSheet.update({
            trip_number: dayData.trip_number,
            odometer_start: dayData.odometer_start || 0,
            odometer_end: dayData.odometer_end || 0,
            fuel_start: dayData.fuel_remaining_start || 0,
            fuel_taken: dayData.fuel_taken || 0,
            fuel_consumption_actual: dayData.fuel_consumed_actual || 0,
            total_trips: dayData.waste_tbo_trips || 0,
            updated_by: req.user.id
          });
        }
        
        results.push(tripSheet);
      }
    }
    
    res.json({
      success: true,
      message: `${results.length} ta yozuv saqlandi`,
      data: results
    });
  } catch (error) {
    console.error('Save monthly trip sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
});

// Excel export
router.get('/export/:vehicleId', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { month, format = 'excel' } = req.query;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Oy parametri kerak'
      });
    }
    
    // Get vehicle info
    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [
        { model: Company, attributes: ['name'] },
        { model: District, attributes: ['name'] }
      ]
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Texnika topilmadi'
      });
    }
    
    // Get monthly data
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const tripSheets = await TripSheet.findAll({
      where: {
        vehicle_id: vehicleId,
        date: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd
        }
      },
      include: [
        {
          model: TripLoad,
          as: 'loads'
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['first_name', 'last_name', 'position']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    if (format === 'excel') {
      const XLSX = require('xlsx');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = [];
      
      // Header
      excelData.push([
        'KARTOCHKA',
        `учёта работы автомашины ${vehicle.brand} ${vehicle.model} гос № ${vehicle.plate_number} за ${moment(monthStart).format('MM')} месяц ${moment(monthStart).format('YYYY')} год`
      ]);
      excelData.push([]); // Empty row
      
      // Column headers
      excelData.push([
        'Дата',
        '№ путевого листа',
        'Ф.И.О. Водителя',
        'Спидометр выезд',
        'Спидометр заезд',
        'Маш дни работ Объем',
        'Маш дни работ Прочи',
        'маш часы',
        'Общее кол-во ездок с Объемом Общий',
        'Общее кол-во ездок с Объемом Прочи',
        'пробег авто машин км. Число',
        'пробег ездок с грузом км.',
        'Объем ТБО',
        'Смет',
        'Итого ТБО',
        'Итого ТБО',
        'Сделано м3, тн.',
        'Остаток на начало дня',
        'Заправка',
        'по норме',
        'Факти чески Объем',
        'Факти чески Прочи',
        'Остаток на конеч дня'
      ]);
      
      // Data rows
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const currentDate = moment(monthStart).date(day);
        const tripSheet = tripSheets.find(ts => moment(ts.date).date() === day);
        
        excelData.push([
          currentDate.format('DD'),
          tripSheet?.trip_number || '',
          tripSheet?.driver ? `${tripSheet.driver.first_name} ${tripSheet.driver.last_name}` : 'Ахмадалиев К',
          tripSheet?.odometer_start || 0,
          tripSheet?.odometer_end || 0,
          tripSheet?.fuel_volume_plan || 0,
          tripSheet?.fuel_volume_other || 0,
          currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 7,
          tripSheet?.total_trips || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 3),
          0,
          21.00,
          tripSheet?.loads?.reduce((sum, load) => sum + (load.tbo_volume_m3 || 0) + (load.smet_volume_m3 || 0), 0) || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 63),
          tripSheet?.loads?.reduce((sum, load) => sum + (load.tbo_volume_m3 || 0), 0) || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 21),
          0,
          tripSheet?.loads?.reduce((sum, load) => sum + (load.tbo_volume_m3 || 0), 0) || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 21),
          tripSheet?.loads?.reduce((sum, load) => sum + (load.tbo_volume_m3 || 0), 0) || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 21),
          tripSheet?.fuel_consumption_actual || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 56.5),
          day === 1 ? 50 : 0,
          tripSheet?.fuel_taken || 0,
          currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 56.5,
          tripSheet?.fuel_consumption_actual || (currentDate.day() === 0 || currentDate.day() === 6 ? 0 : 56.5),
          0,
          0
        ]);
      }
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 10 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Kartochka');
      
      // Generate Excel file
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=kartochka_${vehicle.plate_number}_${month}.xlsx`);
      res.send(buffer);
    } else {
      res.json({
        success: true,
        data: tripSheets
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Export qilishda xatolik',
      error: error.message
    });
  }
});

// Photo upload
router.post('/upload-photo', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { vehicle_id, date } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Rasim fayl kerak'
      });
    }
    
    const photoUrl = `/uploads/trip-photos/${req.file.filename}`;
    
    // Find or create trip sheet for this day
    const [tripSheet, created] = await TripSheet.findOrCreate({
      where: {
        vehicle_id,
        date: new Date(date)
      },
      defaults: {
        vehicle_id,
        date: new Date(date),
        photo_url: photoUrl,
        status: 'draft',
        created_by: req.user.id
      }
    });
    
    if (!created) {
      await tripSheet.update({
        photo_url: photoUrl,
        updated_by: req.user.id
      });
    }
    
    res.json({
      success: true,
      message: 'Rasim yuklandi',
      photo_url: photoUrl
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasim yuklashda xatolik',
      error: error.message
    });
  }
});

router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, district_id } = req.query;
    const user = req.user;

    let whereClause = {};
    if (start_date && end_date) {
      whereClause.date = {
        [Op.between]: [start_date, end_date]
      };
    }

    // Ruxsatlar
    let vehicleWhere = {};
    if (user.role.name === 'operator') {
      vehicleWhere.district_id = user.district_id;
    } else if (user.role.name === 'company_admin') {
      vehicleWhere.company_id = user.company_id;
    } else if (district_id) {
      vehicleWhere.district_id = district_id;
    }

    const stats = await TripSheet.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: vehicleWhere,
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: TripLoad,
          as: 'loads'
        }
      ],
      order: [['date', 'ASC']]
    });

    // Statistika hisoblash
    const summary = {
      total_trips: stats.length,
      approved_trips: stats.filter(s => s.status === 'approved').length,
      pending_trips: stats.filter(s => s.status === 'submitted').length,
      rejected_trips: stats.filter(s => s.status === 'rejected').length,
      total_distance: stats.reduce((sum, s) => sum + parseFloat(s.total_distance || 0), 0),
      total_fuel_consumed: stats.reduce((sum, s) => sum + parseFloat(s.fuel_consumption_actual || 0), 0),
      total_tbo_volume: 0,
      total_tbo_weight: 0
    };

    // TBO va smet yuk ma'lumotlarini hisoblash
    stats.forEach(tripSheet => {
      if (tripSheet.loads) {
        tripSheet.loads.forEach(load => {
          summary.total_tbo_volume += parseFloat(load.tbo_volume_m3 || 0);
          summary.total_tbo_weight += parseFloat(load.tbo_weight_tn || 0);
        });
      }
    });

    res.json({
      success: true,
      data: {
        summary,
        daily_data: stats
      }
    });

  } catch (error) {
    console.error('Error fetching trip sheet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistika olishda xatolik',
      error: error.message
    });
  }
});

// Haydovchi va yuk ortuvchilar ro'yxati olish
router.get('/employees/drivers', authenticate, async (req, res) => {
  try {
    const { company_id, district_id } = req.query;
    let whereClause = { 
      position: 'driver',
      is_active: true
    };
    
    // Company va district filtrlari
    if (company_id) {
      whereClause.company_id = company_id;
    }
    if (district_id) {
      whereClause.district_id = district_id;
    }
    
    const drivers = await Employee.findAll({
      where: whereClause,
      attributes: ['id', 'first_name', 'last_name', 'position'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Haydovchilar ro\'yxatini olishda xatolik',
      error: error.message
    });
  }
});

router.get('/employees/loaders', authenticate, async (req, res) => {
  try {
    const { company_id, district_id } = req.query;
    let whereClause = { 
      position: 'loader',
      is_active: true
    };
    
    // Company va district filtrlari
    if (company_id) {
      whereClause.company_id = company_id;
    }
    if (district_id) {
      whereClause.district_id = district_id;
    }
    
    const loaders = await Employee.findAll({
      where: whereClause,
      attributes: ['id', 'first_name', 'last_name', 'position'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });

    res.json({
      success: true,
      data: loaders
    });
  } catch (error) {
    console.error('Error fetching loaders:', error);
    res.status(500).json({
      success: false,
      message: 'Yuk ortuvchilar ro\'yxatini olishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;
