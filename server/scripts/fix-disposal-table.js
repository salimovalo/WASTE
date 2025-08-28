const { sequelize } = require('../config/database');

const fixDisposalTable = async () => {
  try {
    console.log('🔧 DisposalSite jadvalini tuzatmoqda...');
    
    // Avval jadval mavjudligini tekshirish
    const [results] = await sequelize.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='disposal_sites';
    `);
    
    if (results.length === 0) {
      console.log('📝 disposal_sites jadvali mavjud emas. Yaratilmoqda...');
      
      // Jadvalni yaratish
      await sequelize.query(`
        CREATE TABLE disposal_sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(200) NOT NULL,
          code VARCHAR(50),
          address TEXT,
          type VARCHAR(50) DEFAULT 'tbo',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ disposal_sites jadvali yaratildi');
      
    } else {
      console.log('📍 disposal_sites jadvali mavjud');
      
      // Jadval strukturasini ko'rish
      const [columns] = await sequelize.query(`PRAGMA table_info(disposal_sites);`);
      console.log('Mavjud columnlar:', columns.map(c => c.name));
      
      // Agar latitude/longitude yo'q bo'lsa, qo'shamiz
      if (!columns.find(c => c.name === 'latitude')) {
        console.log('🔧 latitude va longitude qo\'shilmoqda...');
        await sequelize.query(`ALTER TABLE disposal_sites ADD COLUMN latitude DECIMAL(10, 8);`);
        await sequelize.query(`ALTER TABLE disposal_sites ADD COLUMN longitude DECIMAL(11, 8);`);
        await sequelize.query(`ALTER TABLE disposal_sites ADD COLUMN working_hours VARCHAR(100);`);
        await sequelize.query(`ALTER TABLE disposal_sites ADD COLUMN contact_person VARCHAR(200);`);
        await sequelize.query(`ALTER TABLE disposal_sites ADD COLUMN contact_phone VARCHAR(20);`);
        console.log('✅ Yangi columnlar qo\'shildi');
      }
    }
    
    console.log('🎉 DisposalSite jadvali tayyor!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    throw error;
  }
};

if (require.main === module) {
  fixDisposalTable()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { fixDisposalTable };
