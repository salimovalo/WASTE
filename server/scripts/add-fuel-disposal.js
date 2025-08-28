const { sequelize, FuelStation, DisposalSite, Company } = require('../models');

const addFuelAndDisposal = async () => {
  try {
    console.log('🚀 Zapravka va chiqindixonalar qo\'shilmoqda...');
    
    // Company olish (mavjud birinchi company)
    const company = await Company.findOne();
    
    if (!company) {
      throw new Error('Korxona topilmadi');
    }

    // Zapravkalar yaratish
    const fuelStations = [
      {
        name: 'UzPetrol - Yunusobod',
        iin_number: '100001001',
        address: 'Yunusobod tumani, Amir Temur ko\'chasi 1A',
        fuel_type: 'diesel',
        fuel_price_per_liter: 8500,
        phone: '+998712345678',
        manager_name: 'Alisher Karimov'
      },
      {
        name: 'Lukoil - Mirobod AZS',
        iin_number: '100001002',
        address: 'Mirobod tumani, Buyuk Ipak Yo\'li 25',
        fuel_type: 'diesel',
        fuel_price_per_liter: 8700,
        phone: '+998712345679',
        manager_name: 'Sardor Toshmatov'
      },
      {
        name: 'SOCAR - Chilonzor AZS',
        iin_number: '100001003',
        address: 'Chilonzor tumani, Bunyodkor shoh ko\'chasi 10',
        fuel_type: 'diesel',
        fuel_price_per_liter: 8600,
        phone: '+998712345680',
        manager_name: 'Jasur Rahmonov'
      }
    ];

    for (const stationData of fuelStations) {
      const [station, created] = await FuelStation.findOrCreate({
        where: { iin_number: stationData.iin_number },
        defaults: {
          ...stationData,
          company_id: company.id,
          capacity_liters: 50000,
          current_stock: 35000,
          is_active: true
        }
      });
      
      if (created) {
        console.log(`✅ Zapravka yaratildi: ${station.name}`);
      } else {
        console.log(`📍 Zapravka mavjud: ${station.name}`);
      }
    }

    // Chiqindixonalar yaratish
    const disposalSites = [
      {
        name: 'Akkurgan chiqindixonasi',
        code: 'AKK001',
        address: 'Akkurgan tumani, Akhangaran yo\'li 15 km',
        type: 'tbo',

        working_hours: '08:00-18:00',
        contact_person: 'Rustam Nazarov',
        contact_phone: '+998901111111'
      },
      {
        name: 'Zangiota smet maskani',
        code: 'ZAN002',  
        address: 'Zangiota tumani, Zangiota shahri',
        type: 'smet',

        working_hours: '24/7',
        contact_person: 'Jamshid Abdullayev',
        contact_phone: '+998901111112'
      },
      {
        name: 'Sergeli chiqindixonasi',
        code: 'SER003',
        address: 'Sergeli tumani, Quyichirchiq yo\'li',
        type: 'mixed',

        working_hours: '07:00-19:00',
        contact_person: 'Odil Yusupov',
        contact_phone: '+998901111113'
      },
      {
        name: 'Toshkent TBO poligoni',
        code: 'TSH004',
        address: 'Toshkent shahar atrofi, Qibray yo\'nalishi',
        type: 'tbo',

        working_hours: '06:00-20:00',
        contact_person: 'Shohrux Yusupov',
        contact_phone: '+998901111114'
      }
    ];

    for (const siteData of disposalSites) {
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
    }
    
    console.log('\n🎉 Zapravka va chiqindixonalar muvaffaqiyatli qo\'shildi!');
    
    // Tekshirish
    const fuelCount = await FuelStation.count();
    const disposalCount = await DisposalSite.count();
    console.log(`⛽ Jami zapravkalar: ${fuelCount} ta`);
    console.log(`🗑️ Jami chiqindixonalar: ${disposalCount} ta`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    throw error;
  }
};

if (require.main === module) {
  addFuelAndDisposal()
    .then(() => {
      console.log('Ma\'lumotlar tayyor!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { addFuelAndDisposal };
