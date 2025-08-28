/**
 * Employee table migration
 * Xodimlarni User modeldan ajratib, alohida Employee model yaratish
 */

const { sequelize } = require('../config/database');

const up = async () => {
  const QueryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Employee table yaratilmoqda...');
  
  try {
    // Employee table yaratish
    await QueryInterface.createTable('employees', {
      id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      last_name: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      middle_name: {
        type: 'VARCHAR(100)',
        allowNull: true
      },
      phone: {
        type: 'VARCHAR(20)',
        allowNull: true
      },
      passport: {
        type: 'VARCHAR(20)',
        allowNull: false,
        unique: true
      },
      position: {
        type: 'VARCHAR(20)',
        allowNull: false,
        defaultValue: 'driver'
      },
      hire_date: {
        type: 'DATE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_DATE')
      },
      birth_date: {
        type: 'DATE',
        allowNull: true
      },
      address: {
        type: 'TEXT',
        allowNull: true
      },
      emergency_contact: {
        type: 'VARCHAR(20)',
        allowNull: true
      },
      emergency_contact_name: {
        type: 'VARCHAR(255)',
        allowNull: true
      },
      salary: {
        type: 'DECIMAL(12,2)',
        allowNull: true
      },
      vehicle_id: {
        type: 'INTEGER',
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      company_id: {
        type: 'INTEGER',
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      district_id: {
        type: 'INTEGER',
        allowNull: true,
        references: {
          model: 'districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      is_active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      notes: {
        type: 'TEXT',
        allowNull: true
      },
      created_at: {
        type: 'DATETIME',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'DATETIME',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Indekslar qo'shish
    await QueryInterface.addIndex('employees', ['company_id'], {
      name: 'employees_company_id'
    });
    
    await QueryInterface.addIndex('employees', ['district_id'], {
      name: 'employees_district_id'
    });
    
    await QueryInterface.addIndex('employees', ['position'], {
      name: 'employees_position'
    });
    
    await QueryInterface.addIndex('employees', ['is_active'], {
      name: 'employees_is_active'
    });
    
    await QueryInterface.addIndex('employees', ['passport'], {
      name: 'employees_passport',
      unique: true
    });
    
    await QueryInterface.addIndex('employees', ['vehicle_id'], {
      name: 'employees_vehicle_id'
    });
    
    console.log('✅ Employee table muvaffaqiyatli yaratildi');
    
  } catch (error) {
    console.error('❌ Employee table yaratishda xatolik:', error);
    throw error;
  }
};

const down = async () => {
  const QueryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Employee table o\'chirilmoqda...');
  
  try {
    await QueryInterface.dropTable('employees');
    console.log('✅ Employee table muvaffaqiyatli o\'chirildi');
  } catch (error) {
    console.error('❌ Employee table o\'chirishda xatolik:', error);
    throw error;
  }
};

// Migration ishga tushirish
if (require.main === module) {
  up()
    .then(() => {
      console.log('🎉 Employee migration yakunlandi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Employee migration xatolik:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
