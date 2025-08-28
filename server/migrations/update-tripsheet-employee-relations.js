/**
 * TripSheet model - Employee bog'lanishlarni yangilash
 * driver_id, loader1_id, loader2_id maydonlarini User modeldan Employee modelga o'zgartirish
 */

const { sequelize } = require('../config/database');

const up = async () => {
  const QueryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 TripSheet modelini Employee bog\'lanishlar bilan yangilamoqda...');
  
  try {
    // Avval foreign key constraintlarni olib tashlash
    try {
      await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_driver_id_fkey');
      console.log('✅ driver_id constraint olib tashlandi');
    } catch (error) {
      console.log('⚠️  driver_id constraint topilmadi yoki allaqachon o\'chirilgan');
    }

    try {
      await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_loader1_id_fkey');  
      console.log('✅ loader1_id constraint olib tashlandi');
    } catch (error) {
      console.log('⚠️  loader1_id constraint topilmadi yoki allaqachon o\'chirilgan');
    }

    try {
      await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_loader2_id_fkey');
      console.log('✅ loader2_id constraint olib tashlandi');
    } catch (error) {
      console.log('⚠️  loader2_id constraint topilmadi yoki allaqachon o\'chirilgan');
    }
    
    // Yangi foreign key constraint'larni Employee modelga qo'shish
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['driver_id'],
      type: 'foreign key',
      name: 'trip_sheets_driver_id_employees_fkey',
      references: {
        table: 'employees',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    console.log('✅ driver_id Employee modelga bog\'landi');
    
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['loader1_id'],
      type: 'foreign key',
      name: 'trip_sheets_loader1_id_employees_fkey',
      references: {
        table: 'employees',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    console.log('✅ loader1_id Employee modelga bog\'landi');
    
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['loader2_id'],
      type: 'foreign key', 
      name: 'trip_sheets_loader2_id_employees_fkey',
      references: {
        table: 'employees',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    console.log('✅ loader2_id Employee modelga bog\'landi');
    
    console.log('✅ TripSheet - Employee bog\'lanishlar muvaffaqiyatli yangilandi');
    
  } catch (error) {
    console.error('❌ TripSheet yangilashda xatolik:', error);
    throw error;
  }
};

const down = async () => {
  const QueryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 TripSheet bog\'lanishlarini qaytarmoqda...');
  
  try {
    // Employee bog'lanishlarni olib tashlash
    await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_driver_id_employees_fkey');
    await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_loader1_id_employees_fkey');
    await QueryInterface.removeConstraint('trip_sheets', 'trip_sheets_loader2_id_employees_fkey');
    
    // User bog'lanishlarni qaytarish
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['driver_id'],
      type: 'foreign key',
      name: 'trip_sheets_driver_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['loader1_id'],
      type: 'foreign key',
      name: 'trip_sheets_loader1_id_fkey',
      references: {
        table: 'users', 
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    await QueryInterface.addConstraint('trip_sheets', {
      fields: ['loader2_id'],
      type: 'foreign key',
      name: 'trip_sheets_loader2_id_fkey', 
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    console.log('✅ TripSheet bog\'lanishlar User modelga qaytarildi');
  } catch (error) {
    console.error('❌ TripSheet qaytarishda xatolik:', error);
    throw error;
  }
};

// Migration ishga tushirish
if (require.main === module) {
  up()
    .then(() => {
      console.log('🎉 TripSheet Employee migration yakunlandi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 TripSheet Employee migration xatolik:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
