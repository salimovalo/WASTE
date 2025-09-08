'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('trip_sheets');
    
    // fuel_remaining_start qo'shish
    if (!tableInfo.fuel_remaining_start) {
      await queryInterface.addColumn('trip_sheets', 'fuel_remaining_start', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // fuel_taken qo'shish
    if (!tableInfo.fuel_taken) {
      await queryInterface.addColumn('trip_sheets', 'fuel_taken', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // fuel_remaining_end qo'shish
    if (!tableInfo.fuel_remaining_end) {
      await queryInterface.addColumn('trip_sheets', 'fuel_remaining_end', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // waste_volume_m3 qo'shish
    if (!tableInfo.waste_volume_m3) {
      await queryInterface.addColumn('trip_sheets', 'waste_volume_m3', {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: true
      });
    }
    
    // polygon_1 qo'shish
    if (!tableInfo.polygon_1) {
      await queryInterface.addColumn('trip_sheets', 'polygon_1', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_2 qo'shish
    if (!tableInfo.polygon_2) {
      await queryInterface.addColumn('trip_sheets', 'polygon_2', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_3 qo'shish
    if (!tableInfo.polygon_3) {
      await queryInterface.addColumn('trip_sheets', 'polygon_3', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_4 qo'shish
    if (!tableInfo.polygon_4) {
      await queryInterface.addColumn('trip_sheets', 'polygon_4', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // polygon_5 qo'shish
    if (!tableInfo.polygon_5) {
      await queryInterface.addColumn('trip_sheets', 'polygon_5', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    // is_night_shift qo'shish
    if (!tableInfo.is_night_shift) {
      await queryInterface.addColumn('trip_sheets', 'is_night_shift', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      });
    }
    
    // after_day qo'shish
    if (!tableInfo.after_day) {
      await queryInterface.addColumn('trip_sheets', 'after_day', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
    
    // created_by qo'shish
    if (!tableInfo.created_by) {
      await queryInterface.addColumn('trip_sheets', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert qilish uchun
    const columnsToRemove = [
      'fuel_remaining_start',
      'fuel_taken', 
      'fuel_remaining_end',
      'waste_volume_m3',
      'polygon_1',
      'polygon_2',
      'polygon_3',
      'polygon_4',
      'polygon_5',
      'is_night_shift',
      'after_day',
      'created_by'
    ];
    
    for (const column of columnsToRemove) {
      const tableInfo = await queryInterface.describeTable('trip_sheets');
      if (tableInfo[column]) {
        await queryInterface.removeColumn('trip_sheets', column);
      }
    }
  }
};
