const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');

const { 
  VehicleWorkStatus, 
  WorkStatusReason, 
  Vehicle, 
  User, 
  District,
  Company 
} = require('../models');
const { authenticate, applyDataFiltering } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

// Kunlik ish holatlarini olish (kalendar uchun)
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW_DAILY_WORK), async (req, res) => {
  try {
    const { date, district_id, month } = req.query;
    const user = req.user;
    
    let whereClause = {};
    
    // Agar sana berilgan bo'lsa
    if (date) {
      whereClause.date = date;
    }
    
    // Agar oy berilgan bo'lsa (statistika uchun)
    if (month) {
      const startOfMonth = moment(month).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment(month).endOf('month').format('YYYY-MM-DD');
      whereClause.date = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }
    
    // Ruxsatlar asosida filtering
    let vehicleWhere = {};
    vehicleWhere = applyDataFiltering(user, vehicleWhere);
    
    // Qo'shimcha district filter (agar berilgan bo'lsa)
    if (district_id && user.role.name === 'super_admin') {
      vehicleWhere.district_id = district_id;
    }

    const workStatuses = await VehicleWorkStatus.findAll({
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
          model: WorkStatusReason,
          as: 'reason',
          attributes: ['id', 'name', 'category', 'severity']
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: User,
          as: 'confirmer',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      order: [['date', 'DESC'], [{ model: Vehicle, as: 'vehicle' }, 'plate_number', 'ASC']]
    });

    res.json({
      success: true,
      data: workStatuses
    });
  } catch (error) {
    console.error('Error fetching daily work status:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik ish holatlarini olishda xatolik',
      error: error.message
    });
  }
});

// Kunlik ma'lumot kiritish sahifasi uchun texnikalar ro'yxati
router.get('/vehicles-for-entry', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const user = req.user;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Sana ko\'rsatilishi shart'
      });
    }

    // Foydalanuvchi ruxsatlariga qarab texnikalarni olish
    let vehicleWhere = { is_active: true };
    vehicleWhere = applyDataFiltering(user, vehicleWhere);

    // Texnikalar va ularning o'sha kungi holatini olish
    const vehicles = await Vehicle.findAll({
      where: vehicleWhere,
      include: [
        {
          model: VehicleWorkStatus,
          as: 'work_status',
          where: { date },
          required: false
        },
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
      ],
      order: [['plate_number', 'ASC']]
    });

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles for entry:', error);
    res.status(500).json({
      success: false,
      message: 'Texnikalar ro\'yxatini olishda xatolik',
      error: error.message
    });
  }
});

// Yangi ish holati yaratish yoki yangilash
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      vehicle_id, 
      date, 
      work_status, 
      reason_id, 
      reason_details,
      start_time,
      end_time,
      notes 
    } = req.body;
    
    const user = req.user;

    // Validatsiya
    if (!vehicle_id || !date || !work_status) {
      return res.status(400).json({
        success: false,
        message: 'Texnika, sana va ish holati majburiy'
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
    let workStatusRecord = await VehicleWorkStatus.findOne({
      where: { vehicle_id, date }
    });

    const workStatusData = {
      work_status,
      reason_id: work_status === 'not_working' ? reason_id : null,
      reason_details: work_status === 'not_working' ? reason_details : null,
      start_time,
      end_time,
      notes,
      operator_id: user.id,
      status: 'pending' // Operator kiritgan ma'lumot tasdiqlanishi kerak
    };

    if (workStatusRecord) {
      // Agar tasdiqlangan bo'lsa, faqat admin o'zgartira oladi
      if (workStatusRecord.status === 'confirmed' && 
          !['super_admin', 'company_admin'].includes(user.role.name)) {
        return res.status(403).json({
          success: false,
          message: 'Tasdiqlangan ma\'lumotni o\'zgartirish uchun ruxsat yo\'q'
        });
      }

      await workStatusRecord.update(workStatusData);
    } else {
      workStatusRecord = await VehicleWorkStatus.create({
        vehicle_id,
        date,
        ...workStatusData
      });
    }

    // Javobda to'liq ma'lumot qaytarish
    const result = await VehicleWorkStatus.findByPk(workStatusRecord.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [{ model: District, as: 'district' }]
        },
        {
          model: WorkStatusReason,
          as: 'reason'
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'username', 'full_name']
        }
      ]
    });

    res.json({
      success: true,
      message: workStatusRecord ? 'Ma\'lumot muvaffaqiyatli yangilandi' : 'Ma\'lumot muvaffaqiyatli yaratildi',
      data: result
    });

  } catch (error) {
    console.error('Error creating/updating work status:', error);
    res.status(500).json({
      success: false,
      message: 'Ma\'lumot saqlashda xatolik',
      error: error.message
    });
  }
});

// Ish holatini tasdiqlash (faqat adminlar)
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body; // 'confirmed' yoki 'rejected'
    const user = req.user;

    // Faqat adminlar tasdiqlashi mumkin
    if (!['super_admin', 'company_admin'].includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Tasdiqlash uchun ruxsat yo\'q'
      });
    }

    const workStatus = await VehicleWorkStatus.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [{ model: District, as: 'district' }]
        }
      ]
    });

    if (!workStatus) {
      return res.status(404).json({
        success: false,
        message: 'Yozuv topilmadi'
      });
    }

    // Kompaniya admini faqat o'z kompaniyasi ma'lumotlarini tasdiqlashi mumkin
    if (user.role.name === 'company_admin' && 
        workStatus.vehicle.company_id !== user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Bu ma\'lumotni tasdiqlash uchun ruxsat yo\'q'
      });
    }

    await workStatus.update({
      status,
      confirmed_by: user.id,
      confirmed_at: new Date(),
      rejection_reason: status === 'rejected' ? rejection_reason : null
    });

    res.json({
      success: true,
      message: status === 'confirmed' ? 'Ma\'lumot tasdiqlandi' : 'Ma\'lumot rad etildi'
    });

  } catch (error) {
    console.error('Error confirming work status:', error);
    res.status(500).json({
      success: false,
      message: 'Tasdiqlashda xatolik',
      error: error.message
    });
  }
});

// Statistika olish (oylik/kunlik)
router.get('/statistics', authenticate, async (req, res) => {
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

    const stats = await VehicleWorkStatus.findAll({
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
          model: WorkStatusReason,
          as: 'reason',
          attributes: ['id', 'name', 'category']
        }
      ],
      order: [['date', 'ASC']]
    });

    // Statistika hisoblash
    const summary = {
      total_records: stats.length,
      working_count: stats.filter(s => s.work_status === 'working').length,
      not_working_count: stats.filter(s => s.work_status === 'not_working').length,
      confirmed_count: stats.filter(s => s.status === 'confirmed').length,
      pending_count: stats.filter(s => s.status === 'pending').length,
      rejected_count: stats.filter(s => s.status === 'rejected').length
    };

    // Sabablar bo'yicha guruhlash
    const reasonStats = stats
      .filter(s => s.work_status === 'not_working' && s.reason)
      .reduce((acc, curr) => {
        const reasonName = curr.reason.name;
        acc[reasonName] = (acc[reasonName] || 0) + 1;
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        summary,
        reason_statistics: reasonStats,
        daily_data: stats
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistika olishda xatolik',
      error: error.message
    });
  }
});

// Tumanlar bo'yicha xulosani olish
router.get('/district-summary', authenticate, async (req, res) => {
  try {
    const { date, company_id } = req.query;
    const user = req.user;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Sana ko\'rsatilishi shart'
      });
    }

    // Ruxsatlar asosida filtering
    let vehicleWhere = { is_active: true };
    vehicleWhere = applyDataFiltering(user, vehicleWhere);
    
    // Super admin company filter
    if (company_id && user.role.name === 'super_admin') {
      vehicleWhere.company_id = company_id;
    }

    // Barcha texnikalarni olish
    const allVehicles = await Vehicle.findAll({
      where: vehicleWhere,
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'district_id']
    });

    // O'sha kungi ish holatlarini olish
    const workStatuses = await VehicleWorkStatus.findAll({
      where: { date },
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
        }
      ]
    });

    // Tumanlar bo'yicha guruhlash
    const districtMap = {};

    // Barcha texnikalarni tumanlarga ajratish
    allVehicles.forEach(vehicle => {
      const districtId = vehicle.district_id;
      const districtName = vehicle.district?.name || 'Noma\'lum tuman';

      if (!districtMap[districtId]) {
        districtMap[districtId] = {
          district_id: districtId,
          district_name: districtName,
          total_vehicles: 0,
          working: 0,
          not_working: 0,
          working_percentage: 0
        };
      }

      districtMap[districtId].total_vehicles += 1;
    });

    // Ish holatlarini qo'shish
    workStatuses.forEach(status => {
      const districtId = status.vehicle.district_id;
      
      if (districtMap[districtId]) {
        if (status.work_status === 'working') {
          districtMap[districtId].working += 1;
        } else if (status.work_status === 'not_working') {
          districtMap[districtId].not_working += 1;
        }
      }
    });

    // Foizlarni hisoblash
    Object.values(districtMap).forEach(district => {
      const totalWithData = district.working + district.not_working;
      if (totalWithData > 0) {
        district.working_percentage = Math.round((district.working / totalWithData) * 100);
      } else {
        district.working_percentage = 0;
      }
    });

    const districtSummary = Object.values(districtMap).sort((a, b) => 
      a.district_name.localeCompare(b.district_name)
    );

    res.json({
      success: true,
      data: districtSummary
    });

  } catch (error) {
    console.error('Error fetching district summary:', error);
    res.status(500).json({
      success: false,
      message: 'Tumanlar bo\'yicha xulosani olishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;
