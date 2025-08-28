/**
 * Database da foydalanuvchilar va super admin borligini tekshirish
 */

const { User, Role, Company } = require('../models');

const checkUsers = async () => {
  try {
    console.log('🔍 Database da foydalanuvchilarni tekshirmoqda...\n');
    
    // Barcha rollarni ko'rish
    const roles = await Role.findAll();
    console.log('📋 Mavjud rollar:');
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, Name: ${role.name}, Display: ${role.display_name}`);
    });
    console.log();
    
    // Barcha foydalanuvchilarni ko'rish
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    console.log(`👥 Jami foydalanuvchilar soni: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ Hech qanday foydalanuvchi topilmadi!');
      return;
    }
    
    console.log('👥 Foydalanuvchilar ro\'yxati:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Username: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Full Name: ${user.first_name} ${user.last_name}`);
      console.log(`    Role: ${user.role?.name || 'Role yo\'q'} (${user.role?.display_name || 'N/A'})`);
      console.log(`    Company: ${user.company?.name || 'Company yo\'q'}`);
      console.log(`    Active: ${user.is_active ? 'Ha' : 'Yo\'q'}`);
      console.log(`    Last Login: ${user.last_login || 'Hech qachon'}`);
      console.log();
    });
    
    // Super admin borligini tekshirish
    const superAdmin = await User.findOne({
      include: [
        {
          model: Role,
          as: 'role',
          where: { name: 'super_admin' }
        }
      ]
    });
    
    if (superAdmin) {
      console.log('✅ Super admin topildi:');
      console.log(`   Username: ${superAdmin.username}`);
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Active: ${superAdmin.is_active ? 'Ha' : 'Yo\'q'}`);
      console.log(`   Password Hash: ${superAdmin.password_hash ? 'Mavjud' : 'Yo\'q'}`);
    } else {
      console.log('❌ Super admin topilmadi!');
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  }
};

// Script ishga tushirish
if (require.main === module) {
  checkUsers()
    .then(() => {
      console.log('✅ Users tekshirish tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Users tekshirishda fatal xatolik:', error);
      process.exit(1);
    });
}

module.exports = checkUsers;
