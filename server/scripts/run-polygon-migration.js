const { sequelize } = require('../config/database');
const migration = require('../migrations/create-polygons-table');

const runMigration = async () => {
  try {
    console.log('🚀 Poligonlar jadvalini yaratish boshlandi...');
    
    // Migration'ni ishga tushirish
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Poligonlar jadvali muvaffaqiyatli yaratildi');
    console.log('📊 Namunaviy ma\'lumotlar qo\'shildi');
    
    // Database connection'ni yopish
    await sequelize.close();
    console.log('🔌 Database aloqasi yopildi');
    
  } catch (error) {
    console.error('❌ Migration xatoligi:', error);
    process.exit(1);
  }
};

// Script'ni ishga tushirish
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
