const express = require('express');
const { Op } = require('sequelize');
const { Neighborhood, District, Company } = require('../models');
const { authenticate, authorize, checkDistrictAccess } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');

const router = express.Router();

// File upload uchun multer konfiguratsiyasi
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat Excel fayllari ruxsat etilgan'), false);
    }
  }
});

// Barcha maxallalarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, district_id, company_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let districtWhere = {};
    
    // District filtri
    if (district_id) {
      whereClause.district_id = district_id;
    }
    
    // Company filtri
    if (company_id) {
      districtWhere.company_id = company_id;
    } else if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      districtWhere.company_id = req.user.company_id;
    }
    
    // District access filtri
    if (req.user.role.name !== 'super_admin' && req.user.district_access?.length > 0) {
      whereClause.district_id = { [Op.in]: req.user.district_access };
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { tozamakon_id: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: neighborhoods } = await Neighborhood.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: District,
          as: 'district',
          where: districtWhere,
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      neighborhoods,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Maxallalarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Maxallalarni olishda xatolik'
    });
  }
});

// Bitta maxallani olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findByPk(req.params.id, {
      include: [
        {
          model: District,
          as: 'district',
          include: [
            {
              model: Company,
              as: 'company'
            }
          ]
        }
      ]
    });
    
    if (!neighborhood) {
      return res.status(404).json({
        error: 'Maxalla topilmadi'
      });
    }
    
    res.json({ neighborhood });
    
  } catch (error) {
    console.error('Maxallani olishda xatolik:', error);
    res.status(500).json({
      error: 'Maxallani olishda xatolik'
    });
  }
});

// Kod avtomatik yaratish funksiyasi
function generateNeighborhoodCode(districtCode, neighborhoodName) {
  // Maxalla nomining birinchi 3 ta harfini olish
  const namePrefix = neighborhoodName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  
  // Random raqam qo'shish
  const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${districtCode}-${namePrefix}${randomNum}`;
}

// Yangi maxalla yaratish
router.post('/', authenticate, authorize(['create_neighborhoods']), async (req, res) => {
  try {
    const {
      district_id,
      name,
      tozamakon_id,
      type
    } = req.body;
    
    if (!district_id || !name) {
      return res.status(400).json({
        error: 'Tuman va maxalla nomi talab qilinadi'
      });
    }
    
    // District mavjudligini tekshirish
    const district = await District.findByPk(district_id);
    if (!district) {
      return res.status(400).json({
        error: 'Tuman topilmadi'
      });
    }
    
    // Kod avtomatik yaratish
    let code;
    let attempts = 0;
    do {
      code = generateNeighborhoodCode(district.code, name);
      attempts++;
      
      // Kodni tekshirish - mavjudligini ko'rish
      const existingNeighborhood = await Neighborhood.findOne({
        where: { code: code }
      });
      
      if (!existingNeighborhood) break;
      
      if (attempts > 10) {
        // Agar 10 ta urinishdan keyin ham kod yaratilmasa, timestamp qo'shamiz
        code = `${district.code}-${name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${Date.now().toString().slice(-3)}`;
        break;
      }
    } while (true);
    
    const neighborhood = await Neighborhood.create({
      district_id,
      name,
      code: code.toUpperCase(),
      tozamakon_id,
      type: type || 'rural'
    });
    
    // Yaratilgan maxallani to'liq ma'lumotlar bilan qaytarish
    const newNeighborhood = await Neighborhood.findByPk(neighborhood.id, {
      include: [
        {
          model: District,
          as: 'district',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      message: 'Maxalla muvaffaqiyatli yaratildi',
      neighborhood: newNeighborhood
    });
    
  } catch (error) {
    console.error('Maxalla yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu tumanda bunday kod allaqachon mavjud'
      });
    }
    
    res.status(500).json({
      error: 'Maxalla yaratishda xatolik'
    });
  }
});

// Maxallani yangilash
router.put('/:id', authenticate, authorize(['edit_neighborhoods']), async (req, res) => {
  try {
    const {
      name,
      code,
      tozamakon_id,
      type,
      households_count,
      population,
      collection_days,
      is_active
    } = req.body;
    
    const neighborhood = await Neighborhood.findByPk(req.params.id);
    
    if (!neighborhood) {
      return res.status(404).json({
        error: 'Maxalla topilmadi'
      });
    }
    
    await neighborhood.update({
      name: name || neighborhood.name,
      code: code ? code.toUpperCase() : neighborhood.code,
      tozamakon_id: tozamakon_id !== undefined ? tozamakon_id : neighborhood.tozamakon_id,
      type: type || neighborhood.type,
      households_count: households_count !== undefined ? households_count : neighborhood.households_count,
      population: population !== undefined ? population : neighborhood.population,
      collection_days: collection_days !== undefined ? collection_days : neighborhood.collection_days,
      is_active: is_active !== undefined ? is_active : neighborhood.is_active
    });
    
    // Yangilangan maxallani to'liq ma'lumotlar bilan qaytarish
    const updatedNeighborhood = await Neighborhood.findByPk(neighborhood.id, {
      include: [
        {
          model: District,
          as: 'district',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ]
    });
    
    res.json({
      message: 'Maxalla muvaffaqiyatli yangilandi',
      neighborhood: updatedNeighborhood
    });
    
  } catch (error) {
    console.error('Maxallani yangilashda xatolik:', error);
    res.status(500).json({
      error: 'Maxallani yangilashda xatolik'
    });
  }
});

// Maxallani o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_neighborhoods']), async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findByPk(req.params.id);
    
    if (!neighborhood) {
      return res.status(404).json({
        error: 'Maxalla topilmadi'
      });
    }
    
    await neighborhood.update({ is_active: false });
    
    res.json({
      message: 'Maxalla muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Maxallani o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Maxallani o\'chirishda xatolik'
    });
  }
});

// Excel import
router.post('/import', authenticate, authorize(['create_neighborhoods']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Excel fayl yuklanmadi'
      });
    }
    
    // Excel faylni o'qish
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return res.status(400).json({
        error: 'Excel faylida ma\'lumot topilmadi'
      });
    }
    
    const results = {
      success: 0,
      errors: []
    };
    
    // Har bir qatorni qayta ishlash
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Kerakli maydonlarni tekshirish
        if (!row.district_id || !row.name) {
          results.errors.push({
            row: i + 2, // Excel da 1-qator header, shuning uchun +2
            error: 'District ID va nom majburiy'
          });
          continue;
        }
        
        // District mavjudligini tekshirish
        const district = await District.findByPk(row.district_id);
        if (!district) {
          results.errors.push({
            row: i + 2,
            error: `Tuman ID ${row.district_id} topilmadi`
          });
          continue;
        }
        
        // Kod avtomatik yaratish
        let code;
        let attempts = 0;
        do {
          code = generateNeighborhoodCode(district.code, row.name);
          attempts++;
          
          // Kodni tekshirish - mavjudligini ko'rish
          const existingNeighborhood = await Neighborhood.findOne({
            where: { code: code }
          });
          
          if (!existingNeighborhood) break;
          
          if (attempts > 10) {
            // Agar 10 ta urinishdan keyin ham kod yaratilmasa, timestamp qo'shamiz
            code = `${district.code}-${row.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}${Date.now().toString().slice(-3)}`;
            break;
          }
        } while (true);
        
        await Neighborhood.create({
          district_id: row.district_id,
          name: row.name,
          code: code.toUpperCase(),
          tozamakon_id: row.tozamakon_id || null,
          type: row.type || 'rural'
        });
        
        results.success++;
        
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message
        });
      }
    }
    
    // Faylni o'chirish
    const fs = require('fs');
    fs.unlinkSync(req.file.path);
    
    res.json({
      message: 'Import yakunlandi',
      results
    });
    
  } catch (error) {
    console.error('Excel import xatoligi:', error);
    res.status(500).json({
      error: 'Excel import qilishda xatolik'
    });
  }
});

module.exports = router;
