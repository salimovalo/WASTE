const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');
const { TripSheet, Vehicle, Employee } = require('../models');
const { authenticate } = require('../middleware/auth');

// Bitta kunni saqlash
router.post('/single-day', authenticate, async (req, res) => {
  try {
    const {
      vehicle_id,
      date,
      trip_number,
      driver_id,
      loader1_id,
      loader2_id,
      odometer_start,
      odometer_end,
      total_distance,
      machine_hours,
      fuel_remaining_start,
      fuel_taken,
      fuel_remaining_end,
      waste_volume_m3,
      total_trips,
      polygon_1,
      polygon_2,
      polygon_3,
      polygon_4,
      polygon_5,
      status
    } = req.body;

    // Validation
    if (!vehicle_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Transport va sana talab qilinadi'
      });
    }

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Haydovchi tanlanmagan'
      });
    }

    // Check if record exists
    const existing = await TripSheet.findOne({
      where: {
        vehicle_id,
        date
      }
    });

    let tripSheet;
    
    if (existing) {
      // Update existing record
      tripSheet = await existing.update({
        trip_number: trip_number || existing.trip_number,
        driver_id,
        loader1_id,
        loader2_id,
        odometer_start,
        odometer_end,
        total_distance,
        machine_hours,
        fuel_remaining_start,
        fuel_taken,
        fuel_remaining_end,
        waste_volume_m3,
        total_trips,
        polygon_1,
        polygon_2,
        polygon_3,
        polygon_4,
        polygon_5,
        status: status || 'submitted',
        updated_by: req.user.id
      });
    } else {
      // Create new record
      // Generate trip number if not provided
      const tripNum = trip_number || `${vehicle_id}-${moment(date).format('YYYYMMDD')}`;
      
      tripSheet = await TripSheet.create({
        vehicle_id,
        date,
        trip_number: tripNum,
        driver_id,
        loader1_id,
        loader2_id,
        odometer_start,
        odometer_end,
        total_distance,
        machine_hours,
        fuel_remaining_start,
        fuel_taken,
        fuel_remaining_end,
        waste_volume_m3,
        total_trips,
        polygon_1,
        polygon_2,
        polygon_3,
        polygon_4,
        polygon_5,
        status: status || 'submitted',
        created_by: req.user.id
      });
    }

    res.json({
      success: true,
      message: 'Ma\'lumot muvaffaqiyatli saqlandi',
      data: tripSheet
    });

  } catch (error) {
    console.error('Single day save error:', error);
    res.status(500).json({
      success: false,
      message: 'Saqlashda xatolik',
      error: error.message
    });
  }
});

// Kunning saqlanganligini tekshirish
router.get('/check-day/:vehicleId/:date', authenticate, async (req, res) => {
  try {
    const { vehicleId, date } = req.params;
    
    const tripSheet = await TripSheet.findOne({
      where: {
        vehicle_id: vehicleId,
        date
      }
    });

    res.json({
      success: true,
      saved: !!tripSheet,
      data: tripSheet
    });

  } catch (error) {
    console.error('Check day error:', error);
    res.status(500).json({
      success: false,
      message: 'Tekshirishda xatolik',
      error: error.message
    });
  }
});

// Oylik saqlangan kunlar ro'yxati
router.get('/saved-days/:vehicleId', authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { month } = req.query; // YYYY-MM
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Oy parametri talab qilinadi'
      });
    }

    const monthStart = moment(month + '-01', 'YYYY-MM-DD').startOf('month');
    const monthEnd = moment(month + '-01', 'YYYY-MM-DD').endOf('month');

    const tripSheets = await TripSheet.findAll({
      where: {
        vehicle_id: vehicleId,
        date: {
          [Op.between]: [monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD')]
        }
      },
      attributes: ['date', 'id', 'trip_number'],
      order: [['date', 'ASC']]
    });

    const savedDays = tripSheets.map(ts => moment(ts.date).date());

    res.json({
      success: true,
      savedDays,
      tripSheets
    });

  } catch (error) {
    console.error('Get saved days error:', error);
    res.status(500).json({
      success: false,
      message: 'Saqlangan kunlarni olishda xatolik',
      error: error.message
    });
  }
});

module.exports = router;




