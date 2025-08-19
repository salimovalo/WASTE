const express = require('express');
const { Op } = require('sequelize');
const { FuelStation, Company, District, DistrictFuelStation } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Barcha zapravkalarni olish
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, fuel_type, is_active, company_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Korxona filtri
    if (company_id) {
      whereClause.company_id = company_id;
    } else if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      whereClause.company_id = req.user.company_id;
    }
    
    // Yoqilg'i turi filtri
    if (fuel_type) {
      whereClause.fuel_type = fuel_type;
    }
    
    // Faol holat filtri
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    // Qidiruv
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { iin_number: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { manager_name: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const { count, rows: fuelStations } = await FuelStation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name'],
          through: {
            attributes: ['is_primary', 'allocation_percentage']
          }
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      fuel_stations: fuelStations,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Zapravkalarni olishda xatolik:', error);
    res.status(500).json({
      error: 'Zapravkalarni olishda xatolik'
    });
  }
});

// Bitta zapravkani olish
router.get('/:id', authenticate, async (req, res) => {
  try {
    const fuelStation = await FuelStation.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name'],
          through: {
            attributes: ['is_primary', 'allocation_percentage']
          }
        }
      ]
    });
    
    if (!fuelStation) {
      return res.status(404).json({
        error: 'Zapravka topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== fuelStation.company_id) {
      return res.status(403).json({
        error: 'Bu zapravkaga ruxsat yo\'q'
      });
    }
    
    res.json({ fuel_station: fuelStation });
    
  } catch (error) {
    console.error('Zapravkani olishda xatolik:', error);
    res.status(500).json({
      error: 'Zapravkani olishda xatolik'
    });
  }
});

// Yangi zapravka yaratish
router.post('/', authenticate, authorize(['create_fuel_stations']), async (req, res) => {
  try {
    const {
      name,
      iin_number,
      address,
      fuel_type,
      fuel_price_per_liter,
      phone,
      manager_name,
      capacity_liters,
      current_stock,
      coordinates,
      company_id,
      district_ids = []
    } = req.body;
    
    if (!name || !iin_number || !fuel_type || !fuel_price_per_liter) {
      return res.status(400).json({
        error: 'Nom, IIN raqami, yoqilg\'i turi va narxi talab qilinadi'
      });
    }

    // Korxona tekshiruvi
    let finalCompanyId = company_id;
    if (req.user.role.name !== 'super_admin') {
      finalCompanyId = req.user.company_id;
    }

    if (finalCompanyId) {
      const company = await Company.findByPk(finalCompanyId);
      if (!company) {
        return res.status(400).json({
          error: 'Korxona topilmadi'
        });
      }
    }
    
    const fuelStation = await FuelStation.create({
      name,
      iin_number,
      address,
      fuel_type,
      fuel_price_per_liter,
      phone,
      manager_name,
      capacity_liters,
      current_stock: current_stock || 0,
      coordinates,
      company_id: finalCompanyId
    });

    // Tumanlarga bog'lash
    if (district_ids.length > 0) {
      const districtAssociations = district_ids.map(districtId => ({
        district_id: districtId,
        fuel_station_id: fuelStation.id
      }));
      await DistrictFuelStation.bulkCreate(districtAssociations);
    }
    
    // Yaratilgan zapravkani to'liq ma'lumotlar bilan qaytarish
    const newFuelStation = await FuelStation.findByPk(fuelStation.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name'],
          through: {
            attributes: ['is_primary', 'allocation_percentage']
          }
        }
      ]
    });
    
    res.status(201).json({
      message: 'Zapravka muvaffaqiyatli yaratildi',
      fuel_station: newFuelStation
    });
    
  } catch (error) {
    console.error('Zapravka yaratishda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu IIN raqami allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Zapravka yaratishda xatolik'
    });
  }
});

// Zapravkani yangilash
router.put('/:id', authenticate, authorize(['edit_fuel_stations']), async (req, res) => {
  try {
    const {
      name,
      iin_number,
      address,
      fuel_type,
      fuel_price_per_liter,
      phone,
      manager_name,
      capacity_liters,
      current_stock,
      coordinates,
      is_active,
      district_ids
    } = req.body;
    
    const fuelStation = await FuelStation.findByPk(req.params.id);
    
    if (!fuelStation) {
      return res.status(404).json({
        error: 'Zapravka topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== fuelStation.company_id) {
      return res.status(403).json({
        error: 'Bu zapravkani tahrirlash uchun ruxsat yo\'q'
      });
    }
    
    await fuelStation.update({
      name: name || fuelStation.name,
      iin_number: iin_number || fuelStation.iin_number,
      address: address !== undefined ? address : fuelStation.address,
      fuel_type: fuel_type || fuelStation.fuel_type,
      fuel_price_per_liter: fuel_price_per_liter || fuelStation.fuel_price_per_liter,
      phone: phone !== undefined ? phone : fuelStation.phone,
      manager_name: manager_name !== undefined ? manager_name : fuelStation.manager_name,
      capacity_liters: capacity_liters !== undefined ? capacity_liters : fuelStation.capacity_liters,
      current_stock: current_stock !== undefined ? current_stock : fuelStation.current_stock,
      coordinates: coordinates !== undefined ? coordinates : fuelStation.coordinates,
      is_active: is_active !== undefined ? is_active : fuelStation.is_active
    });

    // Tuman bog'lanishlarini yangilash
    if (district_ids !== undefined) {
      await DistrictFuelStation.destroy({
        where: { fuel_station_id: fuelStation.id }
      });
      
      if (district_ids.length > 0) {
        const districtAssociations = district_ids.map(districtId => ({
          district_id: districtId,
          fuel_station_id: fuelStation.id
        }));
        await DistrictFuelStation.bulkCreate(districtAssociations);
      }
    }
    
    // Yangilangan zapravkani to'liq ma'lumotlar bilan qaytarish
    const updatedFuelStation = await FuelStation.findByPk(fuelStation.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        },
        {
          model: District,
          as: 'districts',
          attributes: ['id', 'name'],
          through: {
            attributes: ['is_primary', 'allocation_percentage']
          }
        }
      ]
    });
    
    res.json({
      message: 'Zapravka muvaffaqiyatli yangilandi',
      fuel_station: updatedFuelStation
    });
    
  } catch (error) {
    console.error('Zapravkani yangilashda xatolik:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bu IIN raqami allaqachon mavjud'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors[0]?.message || 'Validatsiya xatosi'
      });
    }
    
    res.status(500).json({
      error: 'Zapravkani yangilashda xatolik'
    });
  }
});

// Zapravkani o'chirish (soft delete)
router.delete('/:id', authenticate, authorize(['delete_fuel_stations']), async (req, res) => {
  try {
    const fuelStation = await FuelStation.findByPk(req.params.id);
    
    if (!fuelStation) {
      return res.status(404).json({
        error: 'Zapravka topilmadi'
      });
    }

    // Korxona ruxsatini tekshirish
    if (req.user.role.name !== 'super_admin' && req.user.company_id !== fuelStation.company_id) {
      return res.status(403).json({
        error: 'Bu zapravkani o\'chirish uchun ruxsat yo\'q'
      });
    }
    
    await fuelStation.update({ is_active: false });
    
    res.json({
      message: 'Zapravka muvaffaqiyatli o\'chirildi'
    });
    
  } catch (error) {
    console.error('Zapravkani o\'chirishda xatolik:', error);
    res.status(500).json({
      error: 'Zapravkani o\'chirishda xatolik'
    });
  }
});

// Zapravka statistikalari
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    
    // Korxona filtri
    if (req.user.role.name !== 'super_admin' && req.user.company_id) {
      whereClause.company_id = req.user.company_id;
    }

    const [
      totalStations,
      activeStations,
      stationsByFuelType,
      totalCapacity,
      totalStock
    ] = await Promise.all([
      FuelStation.count({ where: whereClause }),
      FuelStation.count({ where: { ...whereClause, is_active: true } }),
      FuelStation.findAll({
        where: whereClause,
        attributes: ['fuel_type', [FuelStation.sequelize.fn('COUNT', '*'), 'count']],
        group: ['fuel_type'],
        raw: true
      }),
      FuelStation.sum('capacity_liters', { where: whereClause }),
      FuelStation.sum('current_stock', { where: whereClause })
    ]);

    res.json({
      totalStations,
      activeStations,
      inactiveStations: totalStations - activeStations,
      stationsByFuelType,
      totalCapacity: totalCapacity || 0,
      totalStock: totalStock || 0
    });

  } catch (error) {
    console.error('Zapravka statistikasini olishda xatolik:', error);
    res.status(500).json({
      error: 'Zapravka statistikasini olishda xatolik'
    });
  }
});

module.exports = router;
