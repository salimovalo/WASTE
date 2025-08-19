const { sequelize } = require('../models');

const addDailyWorkStatusTables = async () => {
  try {
    console.log('🚀 Daily Work Status jadvallarini yaratish boshlandi...');

    // Work Status Reasons jadvali
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS work_status_reasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL DEFAULT 'technical',
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (category IN ('technical', 'maintenance', 'administrative', 'weather', 'fuel', 'driver', 'other')),
        CHECK (severity IN ('low', 'medium', 'high', 'critical'))
      );
    `);

    // Vehicle Work Status jadvali
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vehicle_work_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        work_status VARCHAR(20) NOT NULL,
        reason_id INTEGER REFERENCES work_status_reasons(id),
        reason_details TEXT,
        operator_id INTEGER NOT NULL REFERENCES users(id),
        confirmed_by INTEGER REFERENCES users(id),
        confirmed_at TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        start_time TIME,
        end_time TIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(vehicle_id, date),
        CHECK (work_status IN ('working', 'not_working')),
        CHECK (status IN ('pending', 'confirmed', 'rejected'))
      );
    `);

    // Indexlar yaratish
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_status_reasons_category 
      ON work_status_reasons(category);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_status_reasons_severity 
      ON work_status_reasons(severity);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_work_status_reasons_active 
      ON work_status_reasons(is_active);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_work_status_date 
      ON vehicle_work_status(date);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_work_status_work_status 
      ON vehicle_work_status(work_status);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_work_status_status 
      ON vehicle_work_status(status);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_work_status_operator 
      ON vehicle_work_status(operator_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_work_status_confirmer 
      ON vehicle_work_status(confirmed_by);
    `);

    console.log('✅ Daily Work Status jadvallari muvaffaqiyatli yaratildi');
    
  } catch (error) {
    console.error('❌ Daily Work Status jadvallarini yaratishda xatolik:', error);
    throw error;
  }
};

module.exports = { addDailyWorkStatusTables };
