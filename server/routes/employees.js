const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');

const { 
  Employee, 
  Company, 
  District,
  Vehicle,
  User,
  TripSheet,
  TripLoad
} = require('../models');
const { authenticate, applyDataFiltering } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

// Xodimlar statistikasi
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { date, company_id, district_id } = req.query;
    const targetDate = date ? moment(date) : moment();
    
    // Filtering based on user permissions
    let whereClause = { is_active: true };
    if (company_id) whereClause.company_id = company_id;
    // Note: district filtering is handled through district_access JSON field
    
    // Total employees
    const totalEmployees = await Employee.count({
      where: whereClause
    });
    
    // Drivers count
    const activeDrivers = await Employee.count({
      where: {
        ...whereClause,
        position: 'driver'
      }
    });
    
    // Loaders count
    const activeLoaders = await Employee.count({
      where: {
        ...whereClause,
        position: 'loader'
      }
    });
    
    // Vehicles assigned
    const vehiclesAssigned = await Employee.count({
      where: {
        ...whereClause,
        vehicle_id: { [Op.ne]: null }
      }
    });
    
    // Today's attendance from trip sheets
    const todayTripSheets = await TripSheet.count({
      where: {
        date: targetDate.format('YYYY-MM-DD'),
        status: { [Op.in]: ['submitted', 'approved'] }
      }
    });
    
    const attendanceRate = totalEmployees > 0 ? Math.round((todayTripSheets / totalEmployees) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        total_employees: totalEmployees,
        active_drivers: activeDrivers,
        active_loaders: activeLoaders,
        on_duty_today: todayTripSheets,
        absent_today: totalEmployees - todayTripSheets,
        vehicles_assigned: vehiclesAssigned,
        attendance_rate: attendanceRate
      }
    });
  } catch (error) {
    console.error('Employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Xodimlar statistikasini yuklashda xatolik',
      error: error.message
    });
  }
});

// Bugungi jadval
router.get('/today-schedule', authenticate, async (req, res) => {
  try {
    const { date, company_id, district_id } = req.query;
    const targetDate = date ? moment(date) : moment();
    
    // Get today's trip sheets with employee and vehicle info
    const tripSheets = await TripSheet.findAll({
      where: {
        date: targetDate.format('YYYY-MM-DD')
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name'],
          include: [
            {
              model: Role,
              attributes: ['name']
            }
          ]
        },
        {
          model: Vehicle,
          attributes: ['id', 'plate_number', 'brand', 'model']
        }
      ]
    });
    
    const schedule = tripSheets.map(sheet => ({
      id: sheet.id,
      employee_name: sheet.driver ? `${sheet.driver.first_name} ${sheet.driver.last_name}` : 'Haydovchi ko\'rsatilmagan',
      position: 'Haydovchi',
      vehicle_number: sheet.Vehicle?.plate_number,
      status: sheet.status === 'approved' ? 'working' : (sheet.status === 'submitted' ? 'working' : 'absent'),
      shift_start: '07:00',
      shift_end: '16:00'
    }));
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Today schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Bugungi jadval ma\'lumotlarini yuklashda xatolik',
      error: error.message
    });
  }
});

// So'nggi faoliyat
router.get('/recent-activity', authenticate, async (req, res) => {
  try {
    const recentTripSheets = await TripSheet.findAll({
      limit: 10,
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Vehicle,
          attributes: ['plate_number']
        }
      ]
    });
    
    const activities = recentTripSheets.map(sheet => ({
      id: sheet.id,
      action: `206 xisoboti ${sheet.status === 'approved' ? 'tasdiqlandi' : 'yuborildi'}`,
      employee_name: sheet.driver ? `${sheet.driver.first_name} ${sheet.driver.last_name}` : 'Noma\'lum',
      vehicle: sheet.Vehicle?.plate_number,
      time: moment(sheet.updated_at).fromNow(),
      type: 'trip_sheet'
    }));
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'So\'nggi faoliyat ma\'lumotlarini yuklashda xatolik',
      error: error.message
    });
  }
});

// Barcha xodimlarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, company_id, district_id, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Filtering
    if (company_id) whereClause.company_id = company_id;
    // Note: district filtering is handled through district_access JSON field
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    
    // Search
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Position filter
    if (role) {
      whereClause.position = role; // 'driver' or 'loader'
    }

    const employees = await Employee.findAndCountAll({
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
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'brand', 'model'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: employees.rows,
      total: employees.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(employees.count / limit)
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Xodimlarni yuklashda xatolik',
      error: error.message
    });
  }
});

// Yangi xodim qo'shish
router.post('/', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    console.log('📝 Employee yaratish so\'rovi keldi:');
    console.log('  User:', req.user.username, '(' + req.user.role.name + ')');
    console.log('  Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      first_name, 
      last_name, 
      middle_name,
      phone, 
      position, 
      vehicle_id, 
      passport, 
      hire_date,
      birth_date,
      address,
      emergency_contact,
      emergency_contact_name,
      salary,
      notes,
      company_id,
      district_id,
      status = 'active' 
    } = req.body;
    
    console.log('  Validation checks:');
    console.log('    position:', position);
    console.log('    company_id:', company_id);
    console.log('    passport:', passport);
    
    if (!['driver', 'loader'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri lavozim. Faqat "driver" yoki "loader" bo\'lishi mumkin',
        received_position: position
      });
    }
    
    // Company_id validation
    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Korxona tanlanishi majburiy'
      });
    }
    
    console.log('  Creating employee with data:', {
      first_name,
      last_name,
      middle_name,
      phone,
      passport,
      position,
      hire_date: hire_date || new Date(),
      birth_date,
      address,
      emergency_contact,
      emergency_contact_name,
      salary,
      notes,
      company_id: company_id,
      district_id: district_id || null,
      vehicle_id: position === 'driver' ? vehicle_id : null,
      is_active: status === 'active'
    });
    
    const employee = await Employee.create({
      first_name,
      last_name,
      middle_name,
      phone,
      passport,
      position,
      hire_date: hire_date || new Date(),
      birth_date,
      address,
      emergency_contact,
      emergency_contact_name,
      salary,
      notes,
      company_id: company_id,
      district_id: district_id || null,
      vehicle_id: position === 'driver' ? vehicle_id : null,
      is_active: status === 'active'
    });
    
    console.log('✅ Employee yaratildi, ID:', employee.id);
    
    res.json({
      success: true,
      message: 'Xodim muvaffaqiyatli qo\'shildi',
      data: employee
    });
  } catch (error) {
    console.error('❌ Create employee error:', error);
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
    
    // Validation errors detail
    if (error.name === 'SequelizeValidationError') {
      console.log('🔍 Validation Errors:');
      error.errors.forEach(err => {
        console.log(`  - ${err.path}: ${err.message} (value: "${err.value}")`);
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation xatoliklari',
        validation_errors: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        })),
        error: error.message
      });
    }
    
    // Database errors detail  
    if (error.name === 'SequelizeDatabaseError') {
      console.log('🔍 Database Error:');
      console.log(`  SQL: ${error.sql}`);
      console.log(`  Parameters: ${JSON.stringify(error.parameters)}`);
      
      return res.status(500).json({
        success: false,
        message: 'Database xatolik',
        sql_error: error.original?.message,
        error: error.message
      });
    }
    
    // Unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('🔍 Unique Constraint Error:');
      console.log(`  Field: ${error.errors[0]?.path}`);
      console.log(`  Value: ${error.errors[0]?.value}`);
      
      return res.status(400).json({
        success: false,
        message: 'Bu ma\'lumot allaqachon mavjud',
        duplicate_field: error.errors[0]?.path,
        duplicate_value: error.errors[0]?.value,
        error: error.message
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      message: 'Xodim qo\'shishda xatolik',
      error: error.message,
      error_type: error.name
    });
  }
});

// Xodimni yangilash
router.put('/:id', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      middle_name,
      phone, 
      position, 
      vehicle_id, 
      passport, 
      hire_date,
      birth_date,
      address,
      emergency_contact,
      emergency_contact_name,
      salary,
      notes,
      company_id,
      district_id,
      status 
    } = req.body;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Xodim topilmadi'
      });
    }
    
    // Position validation
    if (position && !['driver', 'loader'].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri lavozim. Faqat "driver" yoki "loader" bo\'lishi mumkin'
      });
    }
    
    // Update employee data
    await employee.update({
      first_name: first_name || employee.first_name,
      last_name: last_name || employee.last_name,
      middle_name: middle_name !== undefined ? middle_name : employee.middle_name,
      phone: phone || employee.phone,
      passport: passport || employee.passport,
      position: position || employee.position,
      hire_date: hire_date || employee.hire_date,
      birth_date: birth_date !== undefined ? birth_date : employee.birth_date,
      address: address !== undefined ? address : employee.address,
      emergency_contact: emergency_contact !== undefined ? emergency_contact : employee.emergency_contact,
      emergency_contact_name: emergency_contact_name !== undefined ? emergency_contact_name : employee.emergency_contact_name,
      salary: salary !== undefined ? salary : employee.salary,
      notes: notes !== undefined ? notes : employee.notes,
      company_id: company_id || employee.company_id,
      district_id: district_id !== undefined ? district_id : employee.district_id,
      vehicle_id: vehicle_id !== undefined ? (position === 'driver' ? vehicle_id : null) : employee.vehicle_id,
      is_active: status !== undefined ? (status === 'active') : employee.is_active
    });
    
    res.json({
      success: true,
      message: 'Xodim ma\'lumotlari yangilandi',
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Xodim ma\'lumotlarini yangilashda xatolik',
      error: error.message
    });
  }
});

// Xodimni o'chirish
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Xodim topilmadi'
      });
    }
    
    // Soft delete - faqat is_active ni false qilish
    await employee.update({
      is_active: false,
      vehicle_id: null // Texnika bog'lanishini ham olib tashlash
    });
    
    res.json({
      success: true,
      message: 'Xodim o\'chirildi'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Xodim o\'chirishda xatolik',
      error: error.message
    });
  }
});

// Tabel export
router.get('/tabel/export', authenticate, async (req, res) => {
  try {
    const { month, employee_id, category } = req.query;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Oy parametri kerak'
      });
    }
    
    // Mock Excel export
    res.json({
      success: true,
      message: 'Tabel export qilindi',
      file_path: `/exports/tabel_${month}.xlsx`
    });
  } catch (error) {
    console.error('Tabel export error:', error);
    res.status(500).json({
      success: false,
      message: 'Tabel export qilishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;
