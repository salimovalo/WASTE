const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

const { WorkStatusReason, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

// Barcha sabablarni olish
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW_WORK_REASONS), async (req, res) => {
  try {
    const { category, is_active = true } = req.query;
    
    let whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const reasons = await WorkStatusReason.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: reasons
    });
  } catch (error) {
    console.error('Error fetching work status reasons:', error);
    res.status(500).json({
      success: false,
      message: 'Sabablarni olishda xatolik',
      error: error.message
    });
  }
});

// Kategoriyalar ro'yxati
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = [
      { value: 'technical', label: 'Texnik muammolar', color: '#ff4d4f' },
      { value: 'maintenance', label: 'Profilaktika/Ta\'mir', color: '#faad14' },
      { value: 'administrative', label: 'Ma\'muriy sabab', color: '#1890ff' },
      { value: 'weather', label: 'Ob-havo sharoiti', color: '#52c41a' },
      { value: 'fuel', label: 'Yoqilg\'i muammosi', color: '#722ed1' },
      { value: 'driver', label: 'Haydovchi bilan bog\'liq', color: '#fa541c' },
      { value: 'other', label: 'Boshqa sabab', color: '#8c8c8c' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kategoriyalarni olishda xatolik',
      error: error.message
    });
  }
});

// Yangi sabab yaratish (faqat adminlar)
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('POST /work-status-reasons - Request body:', req.body);
    console.log('POST /work-status-reasons - User:', req.user?.username);
    
    const { name, description, category, severity = 'medium' } = req.body;
    const user = req.user;

    // Faqat adminlar yangi sabab yarata oladi
    if (!['super_admin', 'company_admin'].includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Sabab yaratish uchun ruxsat yo\'q'
      });
    }

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nomi va kategoriya majburiy'
      });
    }

    // Bir xil nomli sabab borligini tekshirish (SQLite uchun) 
    const existingReason = await WorkStatusReason.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('work_status_reasons.name')),
        sequelize.fn('LOWER', name.trim())
      )
    });

    if (existingReason) {
      return res.status(400).json({
        success: false,
        message: 'Bu nomli sabab allaqachon mavjud'
      });
    }

    const reason = await WorkStatusReason.create({
      name: name.trim(),
      description: description?.trim(),
      category,
      severity,
      created_by: user.id
    });

    const result = await WorkStatusReason.findByPk(reason.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sabab muvaffaqiyatli yaratildi',
      data: result
    });

  } catch (error) {
    console.error('Error creating work status reason - Full error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Sabab yaratishda xatolik',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Sababni yangilash (faqat adminlar)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, severity, is_active } = req.body;
    const user = req.user;

    // Faqat adminlar yangilashi mumkin
    if (!['super_admin', 'company_admin'].includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Sabab yangilash uchun ruxsat yo\'q'
      });
    }

    const reason = await WorkStatusReason.findByPk(id);
    if (!reason) {
      return res.status(404).json({
        success: false,
        message: 'Sabab topilmadi'
      });
    }

    // Nom o'zgargan bo'lsa, takrorlanishni tekshirish
    if (name && name.trim() !== reason.name) {
      const existingReason = await WorkStatusReason.findOne({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('work_status_reasons.name')),
              sequelize.fn('LOWER', name.trim())
            ),
            {
              id: {
                [Op.ne]: id
              }
            }
          ]
        }
      });

      if (existingReason) {
        return res.status(400).json({
          success: false,
          message: 'Bu nomli sabab allaqachon mavjud'
        });
      }
    }

    await reason.update({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(category && { category }),
      ...(severity && { severity }),
      ...(is_active !== undefined && { is_active })
    });

    const result = await WorkStatusReason.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Sabab muvaffaqiyatli yangilandi',
      data: result
    });

  } catch (error) {
    console.error('Error updating work status reason:', error);
    res.status(500).json({
      success: false,
      message: 'Sabab yangilashda xatolik',
      error: error.message
    });
  }
});

// Sababni o'chirish (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Faqat super admin o'chirishi mumkin
    if (user.role.name !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Sabab o\'chirish uchun ruxsat yo\'q'
      });
    }

    const reason = await WorkStatusReason.findByPk(id);
    if (!reason) {
      return res.status(404).json({
        success: false,
        message: 'Sabab topilmadi'
      });
    }

    // Soft delete - is_active = false
    await reason.update({ is_active: false });

    res.json({
      success: true,
      message: 'Sabab muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('Error deleting work status reason:', error);
    res.status(500).json({
      success: false,
      message: 'Sabab o\'chirishda xatolik',
      error: error.message
    });
  }
});

// Sababni qayta faollashtirish
router.put('/:id/activate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Faqat adminlar faollashtira oladi
    if (!['super_admin', 'company_admin'].includes(user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Sabab faollashtirish uchun ruxsat yo\'q'
      });
    }

    const reason = await WorkStatusReason.findByPk(id);
    if (!reason) {
      return res.status(404).json({
        success: false,
        message: 'Sabab topilmadi'
      });
    }

    await reason.update({ is_active: true });

    res.json({
      success: true,
      message: 'Sabab muvaffaqiyatli faollashtirildi'
    });

  } catch (error) {
    console.error('Error activating work status reason:', error);
    res.status(500).json({
      success: false,
      message: 'Sabab faollashtirshda xatolik',
      error: error.message
    });
  }
});

module.exports = router;
