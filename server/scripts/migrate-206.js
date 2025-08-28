const { sequelize } = require('../config/database');
const migration = require('../migrations/20241120000001-create-daily-vehicle-reports');

async function runMigration() {
  try {
    console.log('🚀 206 Xisobot migrationni ishga tushirish...');
    
    // Migration ni up qilish
    const queryInterface = sequelize.getQueryInterface();
    await migration.up(queryInterface, sequelize.Sequelize);
    
    console.log('✅ 206 Xisobot migration muvaffaqiyatli bajarildi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration bajarishda xatolik:', error);
    process.exit(1);
  }
}

runMigration();
