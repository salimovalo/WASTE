const express = require('express');
const { Op } = require('sequelize');
const { Polygon, District, Company } = require('../models');
const { authenticate, authorize, checkDistrictAccess } = require('../middleware/auth');
const polygonReportsRouter = require('./polygon-reports');

const router = express.Router();

// Mount reports routes
router.use('/', polygonReportsRouter);

// Barcha poligonlarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      district_id, 
      company_id, 
      is_active = true 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Active filter
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    // Company filter
    if (company_id) {
      whereClause.company_id = company_id;
    } else if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      whereClause.company_id = req.user.company_id;
    }
    
    // District filter
    if (district_id) {
      whereClause.district_id = district_id;
    }
    
    // District access control
    if (req.user.role.name !== 'super_admin' && req.user.district_access?.length > 0) {
      whereClause.district_id = { [Op.in]: req.user.district_access };
    }
    
    // Search
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: polygons } = await Polygon.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
          required: false
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      polygons,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Poligonlarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Poligonlarni olishda xatolik'
    });
  }
});

// Bitta poligonni olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const polygon = await Polygon.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!polygon) {
      return res.status(404).json({
        error: 'Poligon topilmadi'
      });
    }
    
    // Access control
    if (req.user.role.name !== 'super_admin') {
      if (req.user.company_id && polygon.company_id !== req.user.company_id) {
        return res.status(403).json({
          error: 'Bu poligonni ko\'rish uchun ruxsatingiz yo\'q'
        });
      }
      
      if (req.user.district_access?.length > 0 && 
          polygon.district_id && 
          !req.user.district_access.includes(polygon.district_id)) {
        return res.status(403).json({
          error: 'Bu poligonni ko\'rish uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    res.json({ polygon });
    
  } catch (error) {
    console.error('Poligonni olishda xatolik:', error);
    res.status(500).json({
      error: 'Poligonni olishda xatolik'
    });
  }
});

// Yangi poligon yaratish
router.post('/', authenticate, authorize(['create_polygons']), async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      address,
      capacity_m3,
      district_id,
      company_id,
      coordinates,
      contact_person,
      contact_phone,
      operating_hours,
      waste_types,
      price_per_m3,
      is_public
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Poligon nomi talab qilinadi'
      });
    }
    
    // Set company_id if user is not super_admin
    let finalCompanyId = company_id;
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      finalCompanyId = req.user.company_id;
    }
    
    // Validate district access
    if (district_id && req.user.role.name !== 'super_admin') {
      if (req.user.district_access?.length > 0 && 
          !req.user.district_access.includes(district_id)) {
        return res.status(403).json({
          error: 'Bu tumanda poligon yaratish uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    const polygon = await Polygon.create({
      name,
      code: code?.toUpperCase(),
      description,
      address,
      capacity_m3,
      district_id,
      company_id: finalCompanyId,
      coordinates,
      contact_person,
      contact_phone,
      operating_hours,
      waste_types: waste_types || [],
      price_per_m3,
      is_public: is_public !== undefined ? is_public : true
    });
    
    // Return with relations
    const newPolygon = await Polygon.findByPk(polygon.id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Poligon muvaffaqiyatli yaratildi',
      polygon: newPolygon
    });
    
  } catch (error) {
    console.error('Poligon yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu kod allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Poligon yaratishda xatolik'
    });
  }
});

// Poligonni yangilash
router.put('/:id', authenticate, authorize(['edit_polygons']), async (req, res) => {
  try {
    const polygon = await Polygon.findByPk(req.params.id);
    
    if (!polygon) {
      return res.status(404).json({
        error: 'Poligon topilmadi'
      });
    }
    
    // Access control
    if (req.user.role.name !== 'super_admin') {
      if (req.user.company_id && polygon.company_id !== req.user.company_id) {
        return res.status(403).json({
          error: 'Bu poligonni tahrirlash uchun ruxsatingiz yo\'q'
        });
      }
      
      if (req.user.district_access?.length > 0 && 
          polygon.district_id && 
          !req.user.district_access.includes(polygon.district_id)) {
        return res.status(403).json({
          error: 'Bu poligonni tahrirlash uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    const {
      name,
      code,
      description,
      address,
      capacity_m3,
      current_volume_m3,
      district_id,
      company_id,
      coordinates,
      contact_person,
      contact_phone,
      operating_hours,
      waste_types,
      price_per_m3,
      is_public,
      is_active
    } = req.body;
    
    // Validate district access for new district
    if (district_id && district_id !== polygon.district_id && req.user.role.name !== 'super_admin') {
      if (req.user.district_access?.length > 0 && 
          !req.user.district_access.includes(district_id)) {
        return res.status(403).json({
          error: 'Bu tumanga poligon o\'tkazish uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    // Don't allow changing company_id if not super_admin
    let finalCompanyId = company_id;
    if (req.user.role.name !== 'super_admin') {
      finalCompanyId = polygon.company_id;
    }
    
    await polygon.update({
      name: name || polygon.name,
      code: code ? code.toUpperCase() : polygon.code,
      description,
      address,
      capacity_m3,
      current_volume_m3,
      district_id,
      company_id: finalCompanyId,
      coordinates,
      contact_person,
      contact_phone,
      operating_hours,
      waste_types: waste_types !== undefined ? waste_types : polygon.waste_types,
      price_per_m3,
      is_public: is_public !== undefined ? is_public : polygon.is_public,
      is_active: is_active !== undefined ? is_active : polygon.is_active
    });
    
    // Return updated polygon with relations
    const updatedPolygon = await Polygon.findByPk(polygon.id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    res.json({
      message: 'Poligon muvaffaqiyatli yangilandi',
      polygon: updatedPolygon
    });
    
  } catch (error) {
    console.error('Poligonni yangilashda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu kod allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Poligonni yangilashda xatolik'
    });
  }
});

// Poligonni o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_polygons']), async (req, res) => {
  try {
    const polygon = await Polygon.findByPk(req.params.id);
    
    if (!polygon) {
      return res.status(404).json({
        error: 'Poligon topilmadi'
      });
    }
    
    // Access control
    if (req.user.role.name !== 'super_admin') {
      if (req.user.company_id && polygon.company_id !== req.user.company_id) {
        return res.status(403).json({
          error: 'Bu poligonni o\'chirish uchun ruxsatingiz yo\'q'
        });
      }
      
      if (req.user.district_access?.length > 0 && 
          polygon.district_id && 
          !req.user.district_access.includes(polygon.district_id)) {
        return res.status(403).json({
          error: 'Bu poligonni o\'chirish uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    // Soft delete
    await polygon.update({ is_active: false });
    
    res.json({
      message: 'Poligon muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Poligonni o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Poligonni o\'chirishda xatolik'
    });
  }
});

// Poligonni qayta faollashtirish
router.patch('/:id/activate', authenticate, authorize(['edit_polygons']), async (req, res) => {
  try {
    const polygon = await Polygon.findByPk(req.params.id);
    
    if (!polygon) {
      return res.status(404).json({
        error: 'Poligon topilmadi'
      });
    }
    
    // Access control
    if (req.user.role.name !== 'super_admin') {
      if (req.user.company_id && polygon.company_id !== req.user.company_id) {
        return res.status(403).json({
          error: 'Bu poligonni faollashtirish uchun ruxsatingiz yo\'q'
        });
      }
    }
    
    await polygon.update({ is_active: true });
    
    res.json({
      message: 'Poligon muvaffaqiyatli faollashtirildi'
    });
    
  } catch (error) {
    console.error('Poligonni faollashtirish xatolik:', error);
    res.status(500).json({
      error: 'Poligonni faollashtirish xatolik'
    });
  }
});

module.exports = router;
