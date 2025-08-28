/**
 * Demo Employee ma'lumotlari yaratish scripti
 * Xodimlar modulini sinash uchun
 */

const { Employee, Company, District } = require('../models');

const createDemoEmployees = async () => {
  try {
    console.log('🔄 Demo Employees yaratilmoqda...');
    
    // Korxona topish
    const company = await Company.findOne();
    if (!company) {
      console.error('❌ Korxona topilmadi. Avval korxona yarating.');
      return;
    }
    
    // Tuman topish
    const district = await District.findOne();
    
    const demoEmployees = [
      {
        first_name: 'Karim',
        last_name: 'Ahmedov', 
        middle_name: 'Orifovich',
        phone: '+998901234567',
        passport: 'AC1234567',
        position: 'driver',
        hire_date: '2023-01-15',
        birth_date: '1985-05-20',
        address: 'Angren shahar, Mustaqillik 123',
        emergency_contact: '+998901234999',
        emergency_contact_name: 'Maryam Ahmedova',
        salary: 3500000,
        company_id: company.id,
        district_id: district?.id,
        notes: 'Tajribali haydovchi, 15 yil ish staji',
        is_active: true
      },
      {
        first_name: 'Bobur',
        last_name: 'Toshmatov',
        middle_name: 'Umidovich', 
        phone: '+998901234568',
        passport: 'AC1234568',
        position: 'loader',
        hire_date: '2023-02-10',
        birth_date: '1992-08-15',
        address: 'Angren shahar, Bog\'bon 45',
        emergency_contact: '+998901234888',
        emergency_contact_name: 'Dilshod Toshmatov',
        salary: 2800000,
        company_id: company.id,
        district_id: district?.id,
        notes: 'Ishchan va mas\'uliyatli xodim',
        is_active: true
      },
      {
        first_name: 'Islom',
        last_name: 'Ibrohimov',
        phone: '+998901234569',
        passport: 'AC1234569',
        position: 'driver',
        hire_date: '2022-11-20',
        birth_date: '1988-03-10',
        address: 'Angren shahar, Navoi 78',
        emergency_contact: '+998901234777',
        emergency_contact_name: 'Zarina Ibrohimova',
        salary: 3800000,
        company_id: company.id,
        district_id: district?.id,
        notes: 'Kategoriya B va C litsenziyasi bor',
        is_active: true
      },
      {
        first_name: 'Aziz',
        last_name: 'Karimov',
        middle_name: 'Shavkatovich',
        phone: '+998901234570',
        passport: 'AC1234570',
        position: 'loader',
        hire_date: '2023-03-05',
        birth_date: '1995-12-01',
        address: 'Angren shahar, Guliston 12',
        emergency_contact: '+998901234666',
        emergency_contact_name: 'Nodira Karimova',
        salary: 2700000,
        company_id: company.id,
        district_id: district?.id,
        notes: 'Yangi xodim, o\'qishga ishtiyoqmand',
        is_active: true
      },
      {
        first_name: 'Dilshod',
        last_name: 'Rahmonov',
        phone: '+998901234571',
        passport: 'AC1234571',
        position: 'driver',
        hire_date: '2023-01-10',
        birth_date: '1980-07-25',
        address: 'Angren shahar, Yangiobod 67',
        salary: 3200000,
        company_id: company.id,
        district_id: district?.id,
        notes: 'Hozircha texnika biriktirilmagan',
        is_active: false // Faol emas
      }
    ];
    
    for (const empData of demoEmployees) {
      try {
        const existing = await Employee.findOne({ 
          where: { passport: empData.passport } 
        });
        
        if (!existing) {
          await Employee.create(empData);
          console.log(`✅ ${empData.first_name} ${empData.last_name} yaratildi`);
        } else {
          console.log(`⚠️  ${empData.first_name} ${empData.last_name} allaqachon mavjud`);
        }
      } catch (error) {
        console.error(`❌ ${empData.first_name} ${empData.last_name} yaratishda xatolik:`, error.message);
      }
    }
    
    const totalEmployees = await Employee.count();
    console.log(`🎉 Jami xodimlar soni: ${totalEmployees}`);
    
  } catch (error) {
    console.error('❌ Demo employees yaratishda xatolik:', error);
  }
};

// Script ishga tushirish
if (require.main === module) {
  createDemoEmployees()
    .then(() => {
      console.log('✅ Demo employees yaratish tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo employees yaratishda fatal xatolik:', error);
      process.exit(1);
    });
}

module.exports = createDemoEmployees;
