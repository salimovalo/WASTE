const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');
const { sequelize } = require('../config/database');
const { 
  TripSheet, 
  Vehicle, 
  Company, 
  District,
  Polygon
} = require('../models');
const { authenticate } = require('../middleware/auth');

// Poligon hisobotlari
router.get('/reports', authenticate, async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      polygon_id,
      company_id,
      district_id
    } = req.query;

    // Date validation
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Sana oralig\'i talab qilinadi'
      });
    }

    // Build where clause for TripSheet
    const whereClause = {
      date: {
        [Op.between]: [start_date, end_date]
      }
    };

    // Filter by polygon if specified
    if (polygon_id) {
      whereClause[Op.or] = [
        { polygon_1: polygon_id },
        { polygon_2: polygon_id },
        { polygon_3: polygon_id },
        { polygon_4: polygon_id },
        { polygon_5: polygon_id }
      ];
    }

    // Get all trip sheets with filters
    const tripSheets = await TripSheet.findAll({
      where: whereClause,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          where: company_id ? { company_id } : {},
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            },
            {
              model: District,
              as: 'district',
              where: district_id ? { id: district_id } : {},
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Process data for reports
    const summary = {
      totalTrips: 0,
      totalVolume: 0,
      totalVehicles: new Set(),
      dates: new Set()
    };

    const byCompany = {};
    const byDistrict = {};
    const byVehicle = {};

    tripSheets.forEach(trip => {
      // Count trips that went to the specified polygon
      let tripCount = 0;
      const polygons = [trip.polygon_1, trip.polygon_2, trip.polygon_3, trip.polygon_4, trip.polygon_5];
      
      if (polygon_id) {
        tripCount = polygons.filter(p => String(p) === String(polygon_id)).length;
      } else {
        tripCount = trip.total_trips || 0;
      }

      if (tripCount > 0) {
        // Update summary
        summary.totalTrips += tripCount;
        summary.totalVolume += trip.waste_volume_m3 || 0;
        summary.totalVehicles.add(trip.vehicle_id);
        summary.dates.add(trip.date);

        // By Company
        const companyName = trip.vehicle?.company?.name || 'Noma\'lum';
        if (!byCompany[companyName]) {
          byCompany[companyName] = {
            company: companyName,
            trips: 0,
            volume: 0,
            vehicles: new Set()
          };
        }
        byCompany[companyName].trips += tripCount;
        byCompany[companyName].volume += trip.waste_volume_m3 || 0;
        byCompany[companyName].vehicles.add(trip.vehicle_id);

        // By District
        const districtName = trip.vehicle?.district?.name || 'Noma\'lum';
        const districtKey = `${companyName}_${districtName}`;
        if (!byDistrict[districtKey]) {
          byDistrict[districtKey] = {
            district: districtName,
            company: companyName,
            trips: 0,
            volume: 0,
            vehicles: new Set()
          };
        }
        byDistrict[districtKey].trips += tripCount;
        byDistrict[districtKey].volume += trip.waste_volume_m3 || 0;
        byDistrict[districtKey].vehicles.add(trip.vehicle_id);

        // By Vehicle
        const vehicleNumber = trip.vehicle?.plate_number || `Vehicle-${trip.vehicle_id}`;
        if (!byVehicle[vehicleNumber]) {
          byVehicle[vehicleNumber] = {
            vehicle: vehicleNumber,
            company: companyName,
            district: districtName,
            trips: 0,
            volume: 0
          };
        }
        byVehicle[vehicleNumber].trips += tripCount;
        byVehicle[vehicleNumber].volume += trip.waste_volume_m3 || 0;
      }
    });

    // Convert Sets to counts and calculate percentages
    const totalSummaryTrips = summary.totalTrips;
    
    const companyData = Object.values(byCompany).map((item, index) => ({
      key: index + 1,
      company: item.company,
      trips: item.trips,
      volume: Math.round(item.volume),
      vehicles: item.vehicles.size,
      percentage: totalSummaryTrips > 0 ? 
        `${Math.round((item.trips / totalSummaryTrips) * 100)}%` : '0%'
    }));

    const districtData = Object.values(byDistrict).map((item, index) => ({
      key: index + 1,
      district: item.district,
      company: item.company,
      trips: item.trips,
      volume: Math.round(item.volume),
      vehicles: item.vehicles.size
    }));

    const vehicleData = Object.values(byVehicle).map((item, index) => ({
      key: index + 1,
      vehicle: item.vehicle,
      company: item.company,
      district: item.district,
      trips: item.trips,
      volume: Math.round(item.volume)
    }));

    // Calculate average trips per day
    const uniqueDates = summary.dates.size || 1;
    const avgTripsPerDay = Math.round(summary.totalTrips / uniqueDates);

    res.json({
      success: true,
      data: {
        summary: {
          totalTrips: summary.totalTrips,
          totalVolume: Math.round(summary.totalVolume),
          totalVehicles: summary.totalVehicles.size,
          avgTripsPerDay
        },
        byCompany: companyData.sort((a, b) => b.trips - a.trips),
        byDistrict: districtData.sort((a, b) => b.trips - a.trips),
        byVehicle: vehicleData.sort((a, b) => b.trips - a.trips)
      }
    });

  } catch (error) {
    console.error('Polygon reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Hisobotni yuklashda xatolik',
      error: error.message
    });
  }
});

// Poligon statistikasi
router.get('/statistics/:polygonId', authenticate, async (req, res) => {
  try {
    const { polygonId } = req.params;
    const { month } = req.query; // YYYY-MM

    const startDate = month ? 
      moment(month + '-01').startOf('month').format('YYYY-MM-DD') :
      moment().startOf('month').format('YYYY-MM-DD');
    
    const endDate = month ?
      moment(month + '-01').endOf('month').format('YYYY-MM-DD') :
      moment().format('YYYY-MM-DD');

    // Get polygon info
    const polygon = await Polygon.findByPk(polygonId);
    
    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: 'Poligon topilmadi'
      });
    }

    // Get statistics
    const stats = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT vehicle_id) as total_vehicles,
        COUNT(DISTINCT date) as working_days,
        SUM(
          CASE WHEN polygon_1 = :polygonId THEN 1 ELSE 0 END +
          CASE WHEN polygon_2 = :polygonId THEN 1 ELSE 0 END +
          CASE WHEN polygon_3 = :polygonId THEN 1 ELSE 0 END +
          CASE WHEN polygon_4 = :polygonId THEN 1 ELSE 0 END +
          CASE WHEN polygon_5 = :polygonId THEN 1 ELSE 0 END
        ) as total_trips,
        SUM(waste_volume_m3) as total_volume
      FROM trip_sheets
      WHERE date BETWEEN :startDate AND :endDate
        AND (
          polygon_1 = :polygonId OR
          polygon_2 = :polygonId OR
          polygon_3 = :polygonId OR
          polygon_4 = :polygonId OR
          polygon_5 = :polygonId
        )
    `, {
      replacements: { 
        polygonId: String(polygonId), 
        startDate, 
        endDate 
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        polygon,
        statistics: stats[0] || {
          total_vehicles: 0,
          working_days: 0,
          total_trips: 0,
          total_volume: 0
        },
        period: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('Polygon statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani yuklashda xatolik',
      error: error.message
    });
  }
});

module.exports = router;




