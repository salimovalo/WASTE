const express = require('express');
const { Op } = require('sequelize');
const { District, Company, Neighborhood, User } = require('../models');
const { authenticate, authorize, checkDistrictAccess, checkCompanyAccess } = require('../middleware/auth');

const router = express.Router();

// Barcha tumanlarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, company_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Korxona filtri
    if (company_id) {
      whereClause.company_id = company_id;
    } else if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      // Super admin bo'lmagan foydalanuvchilar faqat o'z korxonasi tumanlarini ko'radi
      whereClause.company_id = req.user.company_id;
    }
    
    // Tuman ruxsatlari filtri
    if (req.user.role.name !== 'super_admin' && req.user.district_access?.length > 0) {
      whereClause.id = { [Op.in]: req.user.district_access };
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: districts } = await District.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Neighborhood,
          as: 'neighborhoods',
          attributes: ['id', 'name', 'households_count'],
          where: { is_active: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      districts,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Tumanlarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Tumanlarni olishda xatolik'
    });
  }
});

// Bitta tumanni olish
router.get('/:id', authenticate, checkDistrictAccess, async (req, res) => {
  try {
    const district = await District.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company'
        },
        {
          model: Neighborhood,
          as: 'neighborhoods',
          where: { is_active: true },
          required: false
        }
      ]
    });
    
    if (!district) {
      return res.status(404).json({
        error: 'Tuman topilmadi'
      });
    }
    
    res.json({ district });
    
  } catch (error) {
    console.error('Tumanni olishda xatolik:', error);
    res.status(500).json({
      error: 'Tumanni olishda xatolik'
    });
  }
});

// Yangi tuman yaratish
router.post('/', authenticate, authorize(['create_districts']), async (req, res) => {
  try {
    const {
      company_id,
      name,
      code,
      region,
      population,
      area_km2,
      tozamakon_id
    } = req.body;
    
    if (!name || !code || !company_id) {
      return res.status(400).json({
        error: 'Tuman nomi, kodi va korxona ID si talab qilinadi'
      });
    }
    
    // Korxona mavjudligini tekshirish
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(400).json({
        error: 'Korxona topilmadi'
      });
    }
    
    const district = await District.create({
      company_id,
      name,
      code: code.toUpperCase(),
      region,
      population,
      area_km2,
      tozamakon_id
    });
    
    // Yaratilgan tumanni to'liq ma'lumotlar bilan qaytarish
    const newDistrict = await District.findByPk(district.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Tuman muvaffaqiyatli yaratildi',
      district: newDistrict
    });
    
  } catch (error) {
    console.error('Tuman yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu korxonada bunday kod allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Tuman yaratishda xatolik'
    });
  }
});

// Tumanni yangilash
router.put('/:id', authenticate, authorize(['edit_districts']), checkDistrictAccess, async (req, res) => {
  try {
    const {
      name,
      code,
      region,
      population,
      area_km2,
      tozamakon_id,
      is_active
    } = req.body;
    
    const district = await District.findByPk(req.params.id);
    
    if (!district) {
      return res.status(404).json({
        error: 'Tuman topilmadi'
      });
    }
    
    await district.update({
      name: name || district.name,
      code: code ? code.toUpperCase() : district.code,
      region: region !== undefined ? region : district.region,
      population: population !== undefined ? population : district.population,
      area_km2: area_km2 !== undefined ? area_km2 : district.area_km2,
      tozamakon_id: tozamakon_id !== undefined ? tozamakon_id : district.tozamakon_id,
      is_active: is_active !== undefined ? is_active : district.is_active
    });
    
    // Yangilangan tumanni to'liq ma'lumotlar bilan qaytarish
    const updatedDistrict = await District.findByPk(district.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.json({
      message: 'Tuman muvaffaqiyatli yangilandi',
      district: updatedDistrict
    });
    
  } catch (error) {
    console.error('Tumanni yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Tumanni yangilashda xatolik'
    });
  }
});

// Tumanni o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_districts']), async (req, res) => {
  try {
    const district = await District.findByPk(req.params.id);
    
    if (!district) {
      return res.status(404).json({
        error: 'Tuman topilmadi'
      });
    }
    
    await district.update({ is_active: false });
    
    res.json({
      message: 'Tuman muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Tumanni o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Tumanni o\'chirishda xatolik'
    });
  }
});

// Tuman statistikasi
router.get('/:id/stats', authenticate, checkDistrictAccess, async (req, res) => {
  try {
    const district = await District.findByPk(req.params.id, {
      include: [
        {
          model: Neighborhood,
          as: 'neighborhoods',
          where: { is_active: true },
          required: false
        }
      ]
    });
    
    if (!district) {
      return res.status(404).json({
        error: 'Tuman topilmadi'
      });
    }
    
    const neighborhoods = district.neighborhoods || [];
    const totalHouseholds = neighborhoods.reduce((sum, n) => sum + (n.households_count || 0), 0);
    const totalPopulation = neighborhoods.reduce((sum, n) => sum + (n.population || 0), 0);
    
    const stats = {
      neighborhoods_count: neighborhoods.length,
      total_households: totalHouseholds,
      total_population: totalPopulation,
      district_area_km2: district.area_km2 || 0,
      district_population: district.population || 0
    };
    
    res.json({ stats });
    
  } catch (error) {
    console.error('Tuman statistikasini olishda xatolik:', error);
    res.status(500).json({
      error: 'Statistikani olishda xatolik'
    });
  }
});

module.exports = router;
