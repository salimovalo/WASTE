const express = require('express');
const { User, Company, District, Neighborhood, Role, Vehicle, LegalEntity } = require('../models');
const { authenticate, applyDataFiltering } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistikasi
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { company_id, district_id } = req.query;
    const user = req.user;
    
    // Data filtering'ni qo'llash
    let vehicleWhere = { is_active: true };
    let legalEntityWhere = { is_active: true };
    let districtWhere = { is_active: true };
    let neighborhoodWhere = { is_active: true };
    
    vehicleWhere = applyDataFiltering(user, vehicleWhere);
    legalEntityWhere = applyDataFiltering(user, legalEntityWhere);
    districtWhere = applyDataFiltering(user, districtWhere);
    
    // Super admin company filter
    if (company_id && user.role.name === 'super_admin') {
      vehicleWhere.company_id = company_id;
      legalEntityWhere.company_id = company_id;
      districtWhere.company_id = company_id;
    }
    
    // District filter
    if (district_id) {
      vehicleWhere.district_id = district_id;
      legalEntityWhere.district_id = district_id;
      neighborhoodWhere.district_id = district_id;
    }

    // Statistikalarni hisoblash
    const [
      totalVehicles,
      activeVehicles,
      totalHouseholds,
      totalLegalEntities,
      activeDistricts
    ] = await Promise.all([
      Vehicle.count({ where: vehicleWhere }),
      Vehicle.count({ where: { ...vehicleWhere, is_active: true } }),
      Neighborhood.count({
        include: [{
          model: District,
          where: districtWhere,
          attributes: []
        }],
        where: neighborhoodWhere
      }),
      LegalEntity.count({ where: legalEntityWhere }),
      District.count({ where: districtWhere })
    ]);

    // Dashboard ma'lumotlari
    const dashboardData = {
      totalHouseholds: totalHouseholds,
      totalLegalEntities: totalLegalEntities,
      totalVehicles: totalVehicles,
      monthlyRevenue: Math.floor(Math.random() * 1000000) + 500000, // Demo
      serviceQualityScore: 4.2 + Math.random() * 0.8, // Demo: 4.2-5.0
      activeDistricts: activeDistricts,
      dailyCollections: Math.floor(Math.random() * 30) + 85, // Demo: 85-115%
      monthlyTarget: 100,
      activeVehicles: activeVehicles,
      inactiveVehicles: totalVehicles - activeVehicles
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard statistika xatoligi:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard statistikasini olishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;