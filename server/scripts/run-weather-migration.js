const { sequelize } = require('../config/database');
const weatherMigration = require('../migrations/add-weather-system');

async function runWeatherMigration() {
  try {
    console.log('🔄 Ob-havo tizimi migration ishga tushmoqda...');
    
    // Migration ni ishga tushirish
    await weatherMigration.up(sequelize.getQueryInterface());
    
    console.log('✅ Ob-havo tizimi muvaffaqiyatli o\'rnatildi!');
    console.log('📊 Yaratilgan jadvallar:');
    console.log('   - weather_data (ob-havo ma\'lumotlari)');
    console.log('   - weather_config (API konfiguratsiya)');
    console.log('   - weather_locations (tumanlar xaritasi)');
    console.log('🔑 Default API key: 86d37b917bf0444798a90831253008');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration xatosi:', error);
    console.error('📝 Xato tafsilotlari:', error.message);
    process.exit(1);
  }
}

runWeatherMigration();
