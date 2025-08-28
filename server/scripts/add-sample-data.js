const { sequelize } = require('../models');
const { 
  Company, 
  District, 
  User, 
  Role, 
  Vehicle,
  FuelStation,
  DisposalSite
} = require('../models');

const addSampleData = async () => {
  try {
    console.log('🚀 Demo ma\'lumotlar qo\'shilmoqda...');
    
    // 1. Role yaratish
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'super_admin' },
      defaults: {
        display_name: 'Super Administrator',
        permissions: {
          all: true,
          view_all: true,
          edit_all: true,
          delete_all: true
        }
      }
    });

    const [driverRole] = await Role.findOrCreate({
      where: { name: 'driver' },
      defaults: {
        display_name: 'Haydovchi',
        permissions: {
          view_vehicles: true,
          update_trip_sheets: true,
          view_daily_work: true
        }
      }
    });

    const [loaderRole] = await Role.findOrCreate({
      where: { name: 'loader' },
      defaults: {
        display_name: 'Yuk ortuvchi',
        permissions: {
          view_vehicles: true,
          view_daily_work: true
        }
      }
    });

    console.log('✅ Rollar yaratildi');

    // 2. Company yaratish
    const [company] = await Company.findOrCreate({
      where: { code: 'DEMO' },
      defaults: {
        name: 'Demo Korxona',
        code: 'DEMO',
        inn: '123456789',
        address: 'Demo manzil, Toshkent',
        phone: '+998901234567',
        email: 'demo@example.com',
        director_name: 'Demo Direktor'
      }
    });

    console.log('✅ Korxona yaratildi');

    // 3. District yaratish
    const [district] = await District.findOrCreate({
      where: { code: 'DEMO' },
      defaults: {
        name: 'Demo Tuman',
        code: 'DEMO',
        company_id: company.id
      }
    });

    console.log('✅ Tuman yaratildi');

    // 4. Admin user yaratish
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password_hash: '$2b$10$rGXrCHH6HUV8CRG5rKHRtOdK6gZ3cQYi0DzHvJ8VbdaALsOjPzHWm', // password: admin123
        first_name: 'Demo',
        last_name: 'Admin',
        email: 'admin@demo.com',
        role_id: adminRole.id,
        company_id: company.id,
        district_id: district.id,
        is_active: true
      }
    });

    // 5. Haydovchilar yaratish
    const drivers = [
      { username: 'driver1', first_name: 'Akmal', last_name: 'Karimov' },
      { username: 'driver2', first_name: 'Bobur', last_name: 'Toshmatov' },
      { username: 'driver3', first_name: 'Davron', last_name: 'Saidov' }
    ];

    for (const driverData of drivers) {
      await User.findOrCreate({
        where: { username: driverData.username },
        defaults: {
          ...driverData,
          password_hash: '$2b$10$rGXrCHH6HUV8CRG5rKHRtOdK6gZ3cQYi0DzHvJ8VbdaALsOjPzHWm',
          email: `${driverData.username}@demo.com`,
          role_id: driverRole.id,
          company_id: company.id,
          district_id: district.id,
          position: 'driver',
          is_active: true
        }
      });
    }

    // 6. Yuk ortuvchilar yaratish
    const loaders = [
      { username: 'loader1', first_name: 'Elyor', last_name: 'Normatov' },
      { username: 'loader2', first_name: 'Farrux', last_name: 'Qodirov' },
      { username: 'loader3', first_name: 'Gulom', last_name: 'Rahimov' },
      { username: 'loader4', first_name: 'Husan', last_name: 'Ismoilov' }
    ];

    for (const loaderData of loaders) {
      await User.findOrCreate({
        where: { username: loaderData.username },
        defaults: {
          ...loaderData,
          password_hash: '$2b$10$rGXrCHH6HUV8CRG5rKHRtOdK6gZ3cQYi0DzHvJ8VbdaALsOjPzHWm',
          email: `${loaderData.username}@demo.com`,
          role_id: loaderRole.id,
          company_id: company.id,
          district_id: district.id,
          position: 'loader',
          is_active: true
        }
      });
    }

    console.log('✅ Xodimlar yaratildi');

    // 7. Texnikalar yaratish
    const vehicles = [
      {
        brand: 'ISUZU',
        model: 'NPR75L',
        plate_number: '01A123AA',
        vin: 'JAAN12E50G0123456',
        fuel_type: 'diesel',
        fuel_tank_capacity: 100,
        waste_capacity_m3: 7,
        waste_capacity_kg: 3500
      },
      {
        brand: 'KAMAZ',
        model: '53605',
        plate_number: '01B456BB',
        vin: 'X3E53605D00234567',
        fuel_type: 'diesel',
        fuel_tank_capacity: 250,
        waste_capacity_m3: 20,
        waste_capacity_kg: 10000
      },
      {
        brand: 'HYUNDAI',
        model: 'HD78',
        plate_number: '01C789CC',
        vin: 'KMFHD78DPEA345678',
        fuel_type: 'diesel',
        fuel_tank_capacity: 120,
        waste_capacity_m3: 12,
        waste_capacity_kg: 6000
      }
    ];

    for (const vehicleData of vehicles) {
      await Vehicle.findOrCreate({
        where: { plate_number: vehicleData.plate_number },
        defaults: {
          ...vehicleData,
          company_id: company.id,
          district_id: district.id,
          manufacture_year: 2020,
          registration_date: new Date('2020-01-01'),
          is_active: true
        }
      });
    }

    console.log('✅ Texnikalar yaratildi');

    // 8. Zapravkalar yaratish
    const fuelStations = [
      {
        name: 'UzPetrol - Yunusobod filiali',
        iin_number: '123456789',
        address: 'Yunusobod tumani, Amir Temur ko\'chasi 1A',
        fuel_type: 'diesel',
        fuel_price_per_liter: 8500,
        phone: '+998712345678',
        manager_name: 'Alisher Karimov'
      },
      {
        name: 'Lukoil - Mirobod AZS',
        iin_number: '987654321',
        address: 'Mirobod tumani, Buyuk Ipak Yo\'li 25',
        fuel_type: 'diesel',
        fuel_price_per_liter: 8700,
        phone: '+998712345679',
        manager_name: 'Sardor Toshmatov'
      }
    ];

    for (const stationData of fuelStations) {
      await FuelStation.findOrCreate({
        where: { iin_number: stationData.iin_number },
        defaults: {
          ...stationData,
          company_id: company.id,
          capacity_liters: 50000,
          current_stock: 35000,
          is_active: true
        }
      });
    }

    console.log('✅ Zapravkalar yaratildi');

    // 9. Chiqindixonalar yaratish
    const disposalSites = [
      {
        name: 'Akkurgan chiqindixonasi',
        code: 'AKK_001',
        address: 'Akkurgan tumani, Akhangaran yo\'li 15 km',
        type: 'tbo',
        latitude: 41.2995,
        longitude: 69.2401,
        working_hours: '08:00-18:00',
        contact_person: 'Rustam Nazarov',
        contact_phone: '+998901111111'
      },
      {
        name: 'Zangiota smet joylashtirish maskani',
        code: 'ZAN_002',  
        address: 'Zangiota tumani, Zangiota shahri',
        type: 'smet',
        latitude: 41.1031,
        longitude: 69.0678,
        working_hours: '24/7',
        contact_person: 'Jamshid Abdullayev',
        contact_phone: '+998901111112'
      },
      {
        name: 'Sergeli chiqindixonasi',
        code: 'SER_003',
        address: 'Sergeli tumani, Quyichirchiq yo\'li',
        type: 'mixed',
        latitude: 41.2200,
        longitude: 69.3300,
        working_hours: '07:00-19:00',
        contact_person: 'Odil Yusupov',
        contact_phone: '+998901111113'
      }
    ];

    for (const siteData of disposalSites) {
      await DisposalSite.findOrCreate({
        where: { code: siteData.code },
        defaults: {
          ...siteData,
          is_active: true
        }
      });
    }

    console.log('✅ Chiqindixonalar yaratildi');
    
    console.log('🎉 Barcha demo ma\'lumotlar muvaffaqiyatli qo\'shildi!');
    
  } catch (error) {
    console.error('❌ Demo ma\'lumotlar qo\'shishda xatolik:', error);
    throw error;
  }
};

// Agar to'g'ridan-to'g'ri chaqirilsa
if (require.main === module) {
  addSampleData()
    .then(() => {
      console.log('Demo ma\'lumotlar tayyor!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { addSampleData };
