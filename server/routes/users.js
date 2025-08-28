const express = require('express');
const { Op } = require('sequelize');
const { User, Role, Company, District } = require('../models');
const { authenticate, authorize, checkCompanyAccess } = require('../middleware/auth');

const router = express.Router();

// Barcha foydalanuvchilarni olish
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role_id, company_id, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Korxona filtri
    if (company_id) {
      whereClause.company_id = company_id;
    }
    // Authentication o'chirib qo'yilgan - barcha xodimlar
    console.log('Loading users without auth filter');
    
    // Role filtri
    if (req.query.role) {
      // Role name bo'yicha filter
      const roleWhere = { name: req.query.role };
      const role = await Role.findOne({ where: roleWhere });
      if (role) {
        whereClause.role_id = role.id;
      }
    } else if (role_id) {
      whereClause.role_id = role_id;
    }
    
    // Active filter
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Foydalanuvchilarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Foydalanuvchilarni olishda xatolik'
    });
  }
});

// Bitta foydalanuvchini olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: Company,
          as: 'company'
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    // Foydalanuvchi faqat o'zini yoki super admin boshqalarni ko'ra oladi
    if (req.user.id !== user.id && req.user.role.name !== 'super_admin') {
      // Bir xil korxonadan bo'lsa ko'rishi mumkin
      if (req.user.company_id !== user.company_id) {
        return res.status(403).json({
          error: 'Bu foydalanuvchiga ruxsat yo\'q'
        });
      }
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Foydalanuvchini olishda xatolik:', error);
    res.status(500).json({
      error: 'Foydalanuvchini olishda xatolik'
    });
  }
});

// Yangi foydalanuvchi yaratish
router.post('/', authenticate, authorize(['create_users']), async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      middle_name,
      phone,
      role_id,
      company_id,
      district_access
    } = req.body;
    
    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Username, email, parol, ism va familiya talab qilinadi'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
      });
    }
    
    // Role mavjudligini tekshirish
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return res.status(400).json({
          error: 'Role topilmadi'
        });
      }
    }
    
    // Korxona mavjudligini tekshirish
    if (company_id) {
      const company = await Company.findByPk(company_id);
      if (!company) {
        return res.status(400).json({
          error: 'Korxona topilmadi'
        });
      }
    }
    
    const user = await User.create({
      username,
      email,
      password, // Model da hash qilinadi
      first_name,
      last_name,
      middle_name,
      phone,
      role_id,
      company_id,
      district_access: district_access || []
    });
    
    // Yaratilgan foydalanuvchini to'liq ma'lumotlar bilan qaytarish
    const newUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Foydalanuvchi muvaffaqiyatli yaratildi',
      user: newUser
    });
    
  } catch (error) {
    console.error('Foydalanuvchi yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      return res.status(400).json({
        error: `Bu ${field === 'username' ? 'foydalanuvchi nomi' : 'email'} allaqachon mavjud`
      });
    }
    
    res.status(500).json({
      error: 'Foydalanuvchi yaratishda xatolik'
    });
  }
});

// Foydalanuvchini yangilash
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      phone,
      email,
      role_id,
      company_id,
      district_access,
      is_active
    } = req.body;
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    // Ruxsatlarni tekshirish
    const canEdit = req.user.id === user.id || 
                   req.user.role.name === 'super_admin' ||
                   (req.user.company_id === user.company_id && req.user.role.permissions?.edit_users);
    
    if (!canEdit) {
      return res.status(403).json({
        error: 'Bu foydalanuvchini tahrirlash uchun ruxsat yo\'q'
      });
    }
    
    // Role o'zgartirishni faqat super admin bajarishi mumkin
    if (role_id && req.user.role.name !== 'super_admin') {
      return res.status(403).json({
        error: 'Rolni o\'zgartirish uchun ruxsat yo\'q'
      });
    }
    
    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      middle_name: middle_name !== undefined ? middle_name : user.middle_name,
      phone: phone !== undefined ? phone : user.phone,
      email: email || user.email,
      role_id: role_id || user.role_id,
      company_id: company_id || user.company_id,
      district_access: district_access || user.district_access,
      is_active: is_active !== undefined ? is_active : user.is_active
    });
    
    // Yangilangan foydalanuvchini to'liq ma'lumotlar bilan qaytarish
    const updatedUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.json({
      message: 'Foydalanuvchi muvaffaqiyatli yangilandi',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Foydalanuvchini yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Foydalanuvchini yangilashda xatolik'
    });
  }
});

// Foydalanuvchini o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_users']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    // O'zini o'chira olmaydi
    if (req.user.id === user.id) {
      return res.status(400).json({
        error: 'O\'zingizni o\'chira olmaysiz'
      });
    }
    
    await user.update({ is_active: false });
    
    res.json({
      message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Foydalanuvchini o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Foydalanuvchini o\'chirishda xatolik'
    });
  }
});

// Foydalanuvchi parolini reset qilish
router.put('/:id/reset-password', authenticate, authorize(['edit_users']), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak'
      });
    }
    
    // Faqat super admin parol reset qila oladi
    if (req.user.role.name !== 'super_admin') {
      return res.status(403).json({
        error: 'Parolni o\'zgartirish uchun ruxsat yo\'q'
      });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    await user.update({ password });
    
    res.json({
      message: 'Parol muvaffaqiyatli o\'zgartirildi'
    });
    
  } catch (error) {
    console.error('Parolni reset qilishda xatolik:', error);
    res.status(500).json({
      error: 'Parolni reset qilishda xatolik'
    });
  }
});

// Foydalanuvchi ruxsatlarini yangilash
router.put('/:id/permissions', authenticate, async (req, res) => {
  try {
    const { permissions } = req.body;
    
    // Faqat super admin ruxsatlarni o'zgartira oladi
    if (req.user.role.name !== 'super_admin') {
      return res.status(403).json({
        error: 'Ruxsatlarni o\'zgartirish uchun super admin huquqi kerak'
      });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    await user.update({ permissions: permissions || {} });
    
    // Yangilangan foydalanuvchini qaytarish
    const updatedUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.json({
      message: 'Ruxsatlar muvaffaqiyatli yangilandi',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Ruxsatlarni yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Ruxsatlarni yangilashda xatolik'
    });
  }
});

module.exports = router;
