const { sequelize } = require('../models');
const { Vehicle, User, FuelStation, DisposalSite, Company, District, Role } = require('../models');

const checkData = async () => {
  try {
    console.log('🔍 Ma\'lumotlar bazasini tekshirmoqda...\n');
    
    // 1. Vehicles
    const vehicleCount = await Vehicle.count();
    console.log(`🚗 Texnikalar: ${vehicleCount} ta`);
    if (vehicleCount > 0) {
      const vehicles = await Vehicle.findAll({ limit: 3, raw: true });
      console.log('   Sample vehicles:', vehicles.map(v => `${v.brand} ${v.model} (${v.plate_number})`));
    }
    
    // 2. Users (all users)
    const userCount = await User.count();
    console.log(`👨‍💼 Xodimlar: ${userCount} ta`);
    
    if (userCount > 0) {
      const users = await User.findAll({ 
        limit: 3, 
        attributes: ['first_name', 'last_name', 'username'],
        include: [{
          model: Role,
          as: 'role',
          attributes: ['name', 'display_name']
        }],
        raw: true 
      });
      console.log('   Sample users:', users.map(u => `${u.first_name || u.username} (${u['role.name'] || 'no role'})`));
    }
    
    // 3. Fuel Stations
    const fuelCount = await FuelStation.count();
    console.log(`⛽ Zapravkalar: ${fuelCount} ta`);
    if (fuelCount > 0) {
      const stations = await FuelStation.findAll({ limit: 2, raw: true });
      console.log('   Sample stations:', stations.map(s => s.name));
    }
    
    // 4. Disposal Sites
    const disposalCount = await DisposalSite.count();
    console.log(`🗑️ Chiqindixonalar: ${disposalCount} ta`);
    if (disposalCount > 0) {
      const sites = await DisposalSite.findAll({ limit: 2, raw: true });
      console.log('   Sample sites:', sites.map(s => s.name));
    }
    
    // 5. Roles & Companies
    const roleCount = await Role.count();
    const companyCount = await Company.count();
    console.log(`🏢 Korxonalar: ${companyCount} ta`);
    console.log(`👥 Rollar: ${roleCount} ta`);
    
    console.log('\n✅ Ma\'lumotlar bazasi tekshiruvi tugadi');
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
};

// Agar to'g'ridan-to'g'ri chaqirilsa
if (require.main === module) {
  checkData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { checkData };
