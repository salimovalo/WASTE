const { DisposalSite } = require('../models');

const addDisposalSites = async () => {
  try {
    console.log('🗑️ Chiqindixonalar qo\'shilmoqda...');

    // Oddiy chiqindixonalar - faqat asosiy maydonlar
    const disposalSites = [
      {
        name: 'Akkurgan chiqindixonasi',
        code: 'AKK001',
        address: 'Akkurgan tumani, Akhangaran yo\'li 15 km',
        type: 'tbo'
      },
      {
        name: 'Zangiota smet maskani',
        code: 'ZAN002',  
        address: 'Zangiota tumani, Zangiota shahri',
        type: 'smet'
      },
      {
        name: 'Sergeli chiqindixonasi',
        code: 'SER003',
        address: 'Sergeli tumani, Quyichirchiq yo\'li',
        type: 'mixed'
      },
      {
        name: 'Toshkent TBO poligoni',
        code: 'TSH004',
        address: 'Toshkent shahar atrofi, Qibray yo\'nalishi',
        type: 'tbo'
      }
    ];

    for (const siteData of disposalSites) {
      try {
        const [site, created] = await DisposalSite.findOrCreate({
          where: { code: siteData.code },
          defaults: {
            ...siteData,
            is_active: true
          }
        });
        
        if (created) {
          console.log(`✅ Chiqindixona yaratildi: ${site.name}`);
        } else {
          console.log(`📍 Chiqindixona mavjud: ${site.name}`);
        }
      } catch (error) {
        console.error(`❌ ${siteData.name} uchun xatolik:`, error.message);
      }
    }
    
    console.log('\n🎉 Chiqindixonalar qo\'shildi!');
    
    // Tekshirish
    const disposalCount = await DisposalSite.count();
    console.log(`🗑️ Jami chiqindixonalar: ${disposalCount} ta`);
    
  } catch (error) {
    console.error('❌ Umumiy xatolik:', error.message);
  }
};

if (require.main === module) {
  addDisposalSites()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { addDisposalSites };
