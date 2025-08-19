const express = require('express');
const { Op } = require('sequelize');
const { Company, District, User } = require('../models');
const { authenticate, authorize, checkCompanyAccess, applyDataFiltering } = require('../middleware/auth');

const router = express.Router();

// Barcha korxonalarni olish
router.get('/', authenticate, authorize(['view_companies']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // User role bo'yicha filtering
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      whereClause.id = req.user.company_id;
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name', 'code']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      companies,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Korxonalarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Korxonalarni olishda xatolik'
    });
  }
});

// Bitta korxonani olish
router.get('/:id', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'districts',
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['id', 'username', 'first_name', 'last_name']
            }
          ]
        }
      ]
    });
    
    if (!company) {
      return res.status(404).json({
        error: 'Korxona topilmadi'
      });
    }
    
    res.json({ company });
    
  } catch (error) {
    console.error('Korxonani olishda xatolik:', error);
    res.status(500).json({
      error: 'Korxonani olishda xatolik'
    });
  }
});

// Yangi korxona yaratish (faqat super admin)
router.post('/', authenticate, authorize(['create_companies']), async (req, res) => {
  try {
    const {
      name,
      code,
      inn,
      bank_account,
      address,
      phone,
      email,
      director_name,
      license_number
    } = req.body;
    
    if (!name || !code || !inn) {
      return res.status(400).json({
        error: 'Korxona nomi, kodi va INN raqami talab qilinadi'
      });
    }
    
    const company = await Company.create({
      name,
      code: code.toUpperCase(),
      inn,
      bank_account,
      address,
      phone,
      email,
      director_name,
      license_number
    });
    
    res.status(201).json({
      message: 'Korxona muvaffaqiyatli yaratildi',
      company
    });
    
  } catch (error) {
    console.error('Korxona yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu nom yoki kod allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Korxona yaratishda xatolik'
    });
  }
});

// Korxonani yangilash
router.put('/:id', authenticate, authorize(['edit_companies']), checkCompanyAccess, async (req, res) => {
  try {
    const {
      name,
      code,
      inn,
      bank_account,
      address,
      phone,
      email,
      director_name,
      license_number,
      is_active
    } = req.body;
    
    const company = await Company.findByPk(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        error: 'Korxona topilmadi'
      });
    }
    
    await company.update({
      name: name || company.name,
      code: code ? code.toUpperCase() : company.code,
      inn: inn || company.inn,
      bank_account: bank_account !== undefined ? bank_account : company.bank_account,
      address: address !== undefined ? address : company.address,
      phone: phone !== undefined ? phone : company.phone,
      email: email !== undefined ? email : company.email,
      director_name: director_name !== undefined ? director_name : company.director_name,
      license_number: license_number !== undefined ? license_number : company.license_number,
      is_active: is_active !== undefined ? is_active : company.is_active
    });
    
    res.json({
      message: 'Korxona muvaffaqiyatli yangilandi',
      company
    });
    
  } catch (error) {
    console.error('Korxonani yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Korxonani yangilashda xatolik'
    });
  }
});

// Korxonani o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_companies']), async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        error: 'Korxona topilmadi'
      });
    }
    
    await company.update({ is_active: false });
    
    res.json({
      message: 'Korxona muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Korxonani o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Korxonani o\'chirishda xatolik'
    });
  }
});

// Korxona statistikasi
router.get('/:id/stats', authenticate, checkCompanyAccess, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'districts',
          where: { is_active: true },
          required: false
        },
        {
          model: User,
          as: 'users',
          where: { is_active: true },
          required: false
        }
      ]
    });
    
    if (!company) {
      return res.status(404).json({
        error: 'Korxona topilmadi'
      });
    }
    
    const stats = {
      districts_count: company.districts?.length || 0,
      employees_count: company.users?.length || 0,
      active_districts: company.districts?.filter(d => d.is_active).length || 0,
      active_employees: company.users?.filter(u => u.is_active).length || 0
    };
    
    res.json({ stats });
    
  } catch (error) {
    console.error('Korxona statistikasini olishda xatolik:', error);
    res.status(500).json({
      error: 'Statistikani olishda xatolik'
    });
  }
});

module.exports = router;
