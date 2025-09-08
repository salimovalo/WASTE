const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');

async function runMigration() {
  try {
    console.log('Migration boshlandi...');
    
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('trip_sheets');
    
    // fuel_remaining_start qo'shish
    if (!tableInfo.fuel_remaining_start) {
      console.log('fuel_remaining_start ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'fuel_remaining_start', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // fuel_taken qo'shish
    if (!tableInfo.fuel_taken) {
      console.log('fuel_taken ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'fuel_taken', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // fuel_remaining_end qo'shish
    if (!tableInfo.fuel_remaining_end) {
      console.log('fuel_remaining_end ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'fuel_remaining_end', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // waste_volume_m3 qo'shish
    if (!tableInfo.waste_volume_m3) {
      console.log('waste_volume_m3 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'waste_volume_m3', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // polygon_1 qo'shish
    if (!tableInfo.polygon_1) {
      console.log('polygon_1 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'polygon_1', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_2 qo'shish
    if (!tableInfo.polygon_2) {
      console.log('polygon_2 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'polygon_2', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_3 qo'shish
    if (!tableInfo.polygon_3) {
      console.log('polygon_3 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'polygon_3', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_4 qo'shish
    if (!tableInfo.polygon_4) {
      console.log('polygon_4 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'polygon_4', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_5 qo'shish
    if (!tableInfo.polygon_5) {
      console.log('polygon_5 ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'polygon_5', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // is_night_shift qo'shish
    if (!tableInfo.is_night_shift) {
      console.log('is_night_shift ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'is_night_shift', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      });
    }
    
    // after_day qo'shish
    if (!tableInfo.after_day) {
      console.log('after_day ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'after_day', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    
    // created_by qo'shish
    if (!tableInfo.created_by) {
      console.log('created_by ustuni qo\'shilmoqda...');
      await queryInterface.addColumn('trip_sheets', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }
    
    console.log('Migration muvaffaqiyatli tugadi!');
    process.exit(0);
  } catch (error) {
    console.error('Migration xatoligi:', error);
    process.exit(1);
  }
}

runMigration();
