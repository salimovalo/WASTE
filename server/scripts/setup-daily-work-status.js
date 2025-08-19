const { sequelize } = require('../models');
const { addDailyWorkStatusTables } = require('../migrations/add-daily-work-status');
const { seedWorkStatusReasons } = require('../migrations/seed-work-status-reasons');

const setupDailyWorkStatus = async () => {
  try {
    console.log('🚀 Daily Work Status tizimini o\'rnatish boshlandi...');
    
    // Database ulanishini tekshirish
    await sequelize.authenticate();
    console.log('✅ Database ulanishi tasdiqlandi');
    
    // Jadvallarni yaratish
    await addDailyWorkStatusTables();
    
    // Default sabablarni yaratish
    await seedWorkStatusReasons();
    
    console.log('🎉 Daily Work Status tizimi muvaffaqiyatli o\'rnatildi!');
    console.log('');
    console.log('📋 Quyidagi sahifalar mavjud:');
    console.log('   - /vehicles/daily-work-status - Kunlik dashboard');
    console.log('   - /vehicles/daily-work-status/entry - Ma\'lumot kiritish');
    console.log('   - /vehicles/daily-work-status/statistics - Statistika');
    console.log('   - /vehicles/work-status-reasons - Sabablar boshqaruvi');
    console.log('');
    console.log('🔧 API Endpoints:');
    console.log('   - GET /api/daily-work-status - Kunlik ma\'lumotlar');
    console.log('   - POST /api/daily-work-status - Ma\'lumot yaratish');
    console.log('   - GET /api/work-status-reasons - Sabablar ro\'yxati');
    console.log('   - POST /api/work-status-reasons - Yangi sabab yaratish');
    
  } catch (error) {
    console.error('❌ Setup jarayonida xatolik:', error);
    process.exit(1);
  }
};

// Agar fayl to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  setupDailyWorkStatus()
    .then(() => {
      console.log('✅ Setup yakunlandi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup xatoligi:', error);
      process.exit(1);
    });
}

module.exports = { setupDailyWorkStatus };
