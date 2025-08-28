const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const { DisposalSite, TripLoad } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// Barcha chiqindixonalarni olish
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, type, is_active = true } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Active filter
    if (is_active !== undefined && is_active !== 'all') {
      whereClause.is_active = is_active === 'true';
    }
    
    // Type filter
    if (type) {
      whereClause.type = type;
    }
    
    // Search
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: disposalSites } = await DisposalSite.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: disposalSites,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching disposal sites:', error);
    res.status(500).json({
      success: false,
      message: 'Chiqindixonalarni olishda xatolik',
      error: error.message
    });
  }
});

// Bitta chiqindixonani olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const disposalSite = await DisposalSite.findByPk(req.params.id, {
      include: [
        {
          model: TripLoad,
          as: 'trip_loads',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!disposalSite) {
      return res.status(404).json({
        success: false,
        message: 'Chiqindixona topilmadi'
      });
    }

    res.json({
      success: true,
      data: disposalSite
    });
  } catch (error) {
    console.error('Error fetching disposal site:', error);
    res.status(500).json({
      success: false,
      message: 'Chiqindixonani olishda xatolik',
      error: error.message
    });
  }
});

// Yangi chiqindixona yaratish
router.post('/', authenticate, authorize(['super_admin', 'company_admin']), async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      type = 'tbo',
      latitude,
      longitude,
      working_hours,
      contact_person,
      contact_phone
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Chiqindixona nomi majburiy'
      });
    }

    const disposalSite = await DisposalSite.create({
      name,
      code,
      address,
      type,
      latitude,
      longitude,
      working_hours,
      contact_person,
      contact_phone
    });

    res.status(201).json({
      success: true,
      message: 'Chiqindixona muvaffaqiyatli yaratildi',
      data: disposalSite
    });

  } catch (error) {
    console.error('Error creating disposal site:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Bu kod allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Chiqindixona yaratishda xatolik',
      error: error.message
    });
  }
});

// Chiqindixonani yangilash
router.put('/:id', authenticate, authorize(['super_admin', 'company_admin']), async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      type,
      latitude,
      longitude,
      working_hours,
      contact_person,
      contact_phone,
      is_active
    } = req.body;

    const disposalSite = await DisposalSite.findByPk(req.params.id);

    if (!disposalSite) {
      return res.status(404).json({
        success: false,
        message: 'Chiqindixona topilmadi'
      });
    }

    await disposalSite.update({
      name: name || disposalSite.name,
      code: code !== undefined ? code : disposalSite.code,
      address: address !== undefined ? address : disposalSite.address,
      type: type || disposalSite.type,
      latitude: latitude !== undefined ? latitude : disposalSite.latitude,
      longitude: longitude !== undefined ? longitude : disposalSite.longitude,
      working_hours: working_hours !== undefined ? working_hours : disposalSite.working_hours,
      contact_person: contact_person !== undefined ? contact_person : disposalSite.contact_person,
      contact_phone: contact_phone !== undefined ? contact_phone : disposalSite.contact_phone,
      is_active: is_active !== undefined ? is_active : disposalSite.is_active
    });

    res.json({
      success: true,
      message: 'Chiqindixona muvaffaqiyatli yangilandi',
      data: disposalSite
    });

  } catch (error) {
    console.error('Error updating disposal site:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Bu kod allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Chiqindixonani yangilashda xatolik',
      error: error.message
    });
  }
});

// Chiqindixonani o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['super_admin', 'company_admin']), async (req, res) => {
  try {
    const disposalSite = await DisposalSite.findByPk(req.params.id);

    if (!disposalSite) {
      return res.status(404).json({
        success: false,
        message: 'Chiqindixona topilmadi'
      });
    }

    await disposalSite.update({ is_active: false });

    res.json({
      success: true,
      message: 'Chiqindixona muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('Error deleting disposal site:', error);
    res.status(500).json({
      success: false,
      message: 'Chiqindixonani o\'chirishda xatolik',
      error: error.message
    });
  }
});

// Chiqindixona statistikasi
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = {
      disposal_site_id: req.params.id
    };
    
    if (start_date && end_date) {
      // TripLoad jadvalida to'g'ridan-to'g'ri sana yo'q, 
      // shuning uchun TripSheet orqali filter qilishimiz kerak
    }

    const stats = await TripLoad.findAll({
      where: whereClause,
      attributes: [
        [DisposalSite.sequelize.fn('SUM', DisposalSite.sequelize.col('tbo_volume_m3')), 'total_tbo_volume'],
        [DisposalSite.sequelize.fn('SUM', DisposalSite.sequelize.col('tbo_weight_tn')), 'total_tbo_weight'],
        [DisposalSite.sequelize.fn('SUM', DisposalSite.sequelize.col('smet_volume_m3')), 'total_smet_volume'],
        [DisposalSite.sequelize.fn('SUM', DisposalSite.sequelize.col('smet_weight_tn')), 'total_smet_weight'],
        [DisposalSite.sequelize.fn('SUM', DisposalSite.sequelize.col('trips_count')), 'total_trips'],
        [DisposalSite.sequelize.fn('COUNT', '*'), 'total_records']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: stats[0] || {
        total_tbo_volume: 0,
        total_tbo_weight: 0,
        total_smet_volume: 0,
        total_smet_weight: 0,
        total_trips: 0,
        total_records: 0
      }
    });

  } catch (error) {
    console.error('Error fetching disposal site stats:', error);
    res.status(500).json({
      success: false,
      message: 'Chiqindixona statistikasini olishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;
