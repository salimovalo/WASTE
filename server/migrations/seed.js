const { syncDatabase } = require('../models');
const { Role, User, Company, District, Neighborhood } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Ma\'lumotlar bazasini to\'ldirish boshlandi...');
    
    // Ma'lumotlar bazasini sinxronlash
    await syncDatabase(false);
    
    // Rollarni yaratish
    console.log('👥 Rollarni yaratish...');
    const roles = await Role.bulkCreate([
      {
        name: 'super_admin',
        display_name: 'Super Administrator',
        description: 'Tizimning barcha imkoniyatlariga ega',
        permissions: {
          // Super admin uchun barcha ruxsatlar
          view_companies: true,
          create_companies: true,
          edit_companies: true,
          delete_companies: true,
          view_districts: true,
          create_districts: true,
          edit_districts: true,
          delete_districts: true,
          view_neighborhoods: true,
          create_neighborhoods: true,
          edit_neighborhoods: true,
          delete_neighborhoods: true,
          view_users: true,
          create_users: true,
          edit_users: true,
          delete_users: true,
          view_physical_persons: true,
          edit_physical_persons: true,
          view_legal_entities: true,
          edit_legal_entities: true,
          view_vehicles: true,
          edit_vehicles: true,
          view_service_quality: true,
          edit_service_quality: true,
          view_employees: true,
          edit_employees: true,
          view_reports: true,
          export_reports: true
        }
      },
      {
        name: 'company_admin',
        display_name: 'Korxona administratori',
        description: 'Korxona darajasidagi boshqaruvchi',
        permissions: {
          view_districts: true,
          edit_districts: true,
          view_neighborhoods: true,
          create_neighborhoods: true,
          edit_neighborhoods: true,
          view_users: true,
          create_users: true,
          edit_users: true,
          view_physical_persons: true,
          edit_physical_persons: true,
          view_legal_entities: true,
          edit_legal_entities: true,
          view_vehicles: true,
          edit_vehicles: true,
          view_service_quality: true,
          edit_service_quality: true,
          view_employees: true,
          edit_employees: true,
          view_reports: true
        }
      },
      {
        name: 'district_manager',
        display_name: 'Tuman menejeri',
        description: 'Tuman darajasidagi boshqaruvchi',
        permissions: {
          view_physical_persons: true,
          edit_physical_persons: true,
          view_legal_entities: true,
          edit_legal_entities: true,
          view_vehicles: true,
          edit_vehicles: true,
          view_service_quality: true,
          edit_service_quality: true,
          view_employees: true,
          view_reports: true
        }
      },
      {
        name: 'operator',
        display_name: 'Operator',
        description: 'Ma\'lumot kirituvchi operator',
        permissions: {
          view_physical_persons: true,
          edit_physical_persons: true,
          view_legal_entities: true,
          edit_legal_entities: true,
          view_service_quality: true,
          edit_service_quality: true
        }
      },
      {
        name: 'driver',
        display_name: 'Haydovchi',
        description: 'Transport vositasi haydovchisi',
        permissions: {
          view_vehicles: true
        }
      }
    ], { ignoreDuplicates: true });
    
    console.log(`✅ ${roles.length} ta rol yaratildi`);
    
    // Korxonalarni yaratish
    console.log('🏢 Korxonalarni yaratish...');
    const companies = await Company.bulkCreate([
      {
        name: 'ANGREN BUNYOD FAYZ',
        code: 'ABF',
        inn: '123456789',
        bank_account: '12345678901234567890',
        address: 'Angren shahri',
        phone: '+998 71 123-45-67',
        email: 'info@abf.uz',
        director_name: 'Karimov Aziz Umarovich',
        license_number: 'ABF-2024-001'
      },
      {
        name: 'ZERO WASTE',
        code: 'ZW',
        inn: '987654321',
        bank_account: '09876543210987654321',
        address: 'Toshkent viloyati',
        phone: '+998 71 234-56-78',
        email: 'contact@zerowaste.uz',
        director_name: 'Rahimova Dilnoza Akmalovna',
        license_number: 'ZW-2024-002'
      }
    ], { ignoreDuplicates: true });
    
    console.log(`✅ ${companies.length} ta korxona yaratildi`);
    
    // Tumanlarni yaratish
    console.log('🌍 Tumanlarni yaratish...');
    const districts = await District.bulkCreate([
      // ANGREN BUNYOD FAYZ tumanlar
      {
        company_id: companies[0].id,
        name: 'Nurafshon Shahar',
        code: 'NUR',
        region: 'Toshkent viloyati',
        population: 45000,
        area_km2: 120.5
      },
      {
        company_id: companies[0].id,
        name: 'Olmaliq Shahar',
        code: 'OLM',
        region: 'Toshkent viloyati',
        population: 135000,
        area_km2: 200.3
      },
      {
        company_id: companies[0].id,
        name: 'Oxangaron tumani',
        code: 'OXA',
        region: 'Toshkent viloyati',
        population: 95000,
        area_km2: 450.7
      },
      // ZERO WASTE tumanlar
      {
        company_id: companies[1].id,
        name: 'Angren Shahar',
        code: 'ANG',
        region: 'Toshkent viloyati',
        population: 175000,
        area_km2: 300.2
      },
      {
        company_id: companies[1].id,
        name: 'Parkent tumani',
        code: 'PAR',
        region: 'Toshkent viloyati',
        population: 78000,
        area_km2: 650.8
      },
      {
        company_id: companies[1].id,
        name: 'Yuqorichirchiq tumani',
        code: 'YUQ',
        region: 'Toshkent viloyati',
        population: 62000,
        area_km2: 720.4
      }
    ], { ignoreDuplicates: true });
    
    console.log(`✅ ${districts.length} ta tuman yaratildi`);
    
    // Super admin foydalanuvchini yaratish
    console.log('👤 Super admin foydalanuvchini yaratish...');
    const superAdminRole = await Role.findOne({ where: { name: 'super_admin' } });
    
    const superAdmin = await User.create({
      username: 'admin',
      email: 'admin@wastemanagement.uz',
      password_hash: await bcrypt.hash('admin123', 12),
      first_name: 'Super',
      last_name: 'Administrator',
      role_id: superAdminRole.id,
      district_access: districts.map(d => d.id) // Barcha tumanlarga ruxsat
    });
    
    console.log('✅ Super admin yaratildi');
    
    // Demo foydalanuvchilarni yaratish
    console.log('👥 Demo foydalanuvchilarini yaratish...');
    const companyAdminRole = await Role.findOne({ where: { name: 'company_admin' } });
    const operatorRole = await Role.findOne({ where: { name: 'operator' } });
    
    const demoUsers = await User.bulkCreate([
      {
        username: 'abf_admin',
        email: 'admin@abf.uz',
        password_hash: await bcrypt.hash('abf123', 12),
        first_name: 'Aziz',
        last_name: 'Karimov',
        role_id: companyAdminRole.id,
        company_id: companies[0].id,
        district_access: districts.slice(0, 3).map(d => d.id) // ABF tumanlar
      },
      {
        username: 'zw_admin',
        email: 'admin@zerowaste.uz',
        password_hash: await bcrypt.hash('zw123', 12),
        first_name: 'Dilnoza',
        last_name: 'Rahimova',
        role_id: companyAdminRole.id,
        company_id: companies[1].id,
        district_access: districts.slice(3).map(d => d.id) // ZW tumanlar
      },
      {
        username: 'operator1',
        email: 'operator1@abf.uz',
        password_hash: await bcrypt.hash('op123', 12),
        first_name: 'Bobur',
        last_name: 'Toshmatov',
        role_id: operatorRole.id,
        company_id: companies[0].id,
        district_access: [districts[0].id] // Faqat Nurafshon
      }
    ]);
    
    console.log(`✅ ${demoUsers.length} ta demo foydalanuvchi yaratildi`);
    
    // Maxallalarni yaratish
    console.log('🏘️ Maxallalarni yaratish...');
    const neighborhoods = await Neighborhood.bulkCreate([
      // Nurafshon maxallar
      {
        district_id: districts[0].id,
        name: 'Markaziy maxalla',
        code: 'NUR-01',
        tozamakon_id: 'TZM001',
        type: 'apartment_complex',
        households_count: 450,
        population: 1800,
        collection_days: 'mon,wed,fri'
      },
      {
        district_id: districts[0].id,
        name: 'Yangi shahar',
        code: 'NUR-02',
        tozamakon_id: 'TZM002',
        type: 'mixed',
        households_count: 320,
        population: 1280,
        collection_days: 'tue,thu,sat'
      },
      // Olmaliq maxallar
      {
        district_id: districts[1].id,
        name: 'Metallurg maxallasi',
        code: 'OLM-01',
        tozamakon_id: 'TZM003',
        type: 'apartment_complex',
        households_count: 890,
        population: 3560,
        collection_days: 'daily'
      },
      {
        district_id: districts[1].id,
        name: 'Chirchiq boʻyi',
        code: 'OLM-02',
        tozamakon_id: 'TZM004',
        type: 'private_houses',
        households_count: 567,
        population: 2268,
        collection_days: 'mon,wed,fri'
      },
      // Angren maxallar
      {
        district_id: districts[3].id,
        name: 'Sharq maxallasi',
        code: 'ANG-01',
        tozamakon_id: 'TZM005',
        type: 'apartment_complex',
        households_count: 1200,
        population: 4800,
        collection_days: 'daily'
      }
    ], { ignoreDuplicates: true });
    
    console.log(`✅ ${neighborhoods.length} ta maxalla yaratildi`);
    
    console.log('\n🎉 Ma\'lumotlar bazasi muvaffaqiyatli to\'ldirildi!');
    console.log('\n📋 Kirish ma\'lumotlari:');
    console.log('Super Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nABF Admin:');
    console.log('  Username: abf_admin');
    console.log('  Password: abf123');
    console.log('\nZero Waste Admin:');
    console.log('  Username: zw_admin');
    console.log('  Password: zw123');
    console.log('\nOperator:');
    console.log('  Username: operator1');
    console.log('  Password: op123');
    
  } catch (error) {
    console.error('❌ Seed jarayonida xatolik:', error);
    throw error;
  }
};

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seed muvaffaqiyatli tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed xatoligi:', error);
      process.exit(1);
    });
}

module.exports = seedData;
