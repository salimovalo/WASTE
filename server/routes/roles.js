const express = require('express');
const { Role } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Barcha rollarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: roles } = await Role.findAndCountAll({
      limit: parseInt(limit),
      offset,
      order: [['id', 'ASC']]
    });
    
    res.json({
      roles,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Rollarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Rollarni olishda xatolik'
    });
  }
});

// Bitta rolni olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        error: 'Rol topilmadi'
      });
    }
    
    res.json({ role });
    
  } catch (error) {
    console.error('Rolni olishda xatolik:', error);
    res.status(500).json({
      error: 'Rolni olishda xatolik'
    });
  }
});

// Yangi rol yaratish (faqat super admin)
router.post('/', authenticate, authorize(['create_roles']), async (req, res) => {
  try {
    const { name, display_name, description, permissions } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({
        error: 'Rol nomi va ko\'rsatiladigan nom talab qilinadi'
      });
    }
    
    const role = await Role.create({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      display_name,
      description,
      permissions: permissions || {}
    });
    
    res.status(201).json({
      message: 'Rol muvaffaqiyatli yaratildi',
      role
    });
    
  } catch (error) {
    console.error('Rol yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bunday nomli rol allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Rol yaratishda xatolik'
    });
  }
});

// Rolni yangilash (faqat super admin)
router.put('/:id', authenticate, authorize(['edit_roles']), async (req, res) => {
  try {
    const { display_name, description, permissions } = req.body;
    
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        error: 'Rol topilmadi'
      });
    }
    
    // Super admin rolini tahrirlashni taqiqlash
    if (role.name === 'super_admin') {
      return res.status(403).json({
        error: 'Super admin rolini tahrirlash mumkin emas'
      });
    }
    
    await role.update({
      display_name,
      description,
      permissions: permissions || role.permissions
    });
    
    res.json({
      message: 'Rol muvaffaqiyatli yangilandi',
      role
    });
    
  } catch (error) {
    console.error('Rolni yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Rolni yangilashda xatolik'
    });
  }
});

// Rolni o'chirish (faqat super admin)
router.delete('/:id', authenticate, authorize(['delete_roles']), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        error: 'Rol topilmadi'
      });
    }
    
    // Super admin rolini o'chirishni taqiqlash
    if (role.name === 'super_admin') {
      return res.status(403).json({
        error: 'Super admin rolini o\'chirish mumkin emas'
      });
    }
    
    // Roldan foydalanayotgan foydalanuvchilar borligini tekshirish
    const { User } = require('../models');
    const usersCount = await User.count({ where: { role_id: role.id } });
    
    if (usersCount > 0) {
      return res.status(400).json({
        error: `Bu roldan ${usersCount} ta foydalanuvchi foydalanmoqda. Avval ularning rolini o'zgartiring`
      });
    }
    
    await role.destroy();
    
    res.json({
      message: 'Rol muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Rolni o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Rolni o\'chirishda xatolik'
    });
  }
});

module.exports = router;
