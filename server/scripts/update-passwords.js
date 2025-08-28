const { sequelize } = require('../models');
const { User, Role, Company, District } = require('../models');
const bcrypt = require('bcryptjs');

const updatePasswords = async () => {
  try {
    console.log('🔑 Parollarni yangilamoqda...');
    
    // Barcha foydalanuvchilarni olish (super_admin dan tashqari)
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
          attributes: ['id', 'name']
        }
      ],
      where: {
        is_active: true
      }
    });

    console.log(`Jami ${users.length} ta faol foydalanuvchi topildi\n`);

    // Yangi parol hash
    const newPasswordHash = await bcrypt.hash('123456', 12);
    
    let updatedCount = 0;
    const loginList = [];

    for (const user of users) {
      const shouldUpdate = user.role?.name !== 'super_admin';
      
      if (shouldUpdate) {
        // Parolni yangilash
        await user.update({ password_hash: newPasswordHash });
        updatedCount++;
        
        loginList.push({
          username: user.username,
          password: '123456',
          full_name: `${user.first_name} ${user.last_name}`,
          role: user.role?.display_name || user.role?.name,
          company: user.company?.name || 'N/A'
        });
      } else {
        // Super admin uchun asl parol
        loginList.push({
          username: user.username,
          password: 'demo123', // Super admin paroli o\'zgartirilmadi
          full_name: `${user.first_name} ${user.last_name}`,
          role: user.role?.display_name || user.role?.name,
          company: user.company?.name || 'N/A'
        });
      }
    }

    console.log(`✅ ${updatedCount} ta foydalanuvchi parolini yangilandi\n`);
    
    // Login ro'yxati
    console.log('📋 LOGIN-PAROL RO\'YXATI:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('| Username    | Parol    | F.I.Sh              | Lavozim              | Korxona      |');
    console.log('|-------------|----------|---------------------|----------------------|--------------|');
    
    loginList.forEach(item => {
      console.log(`| ${item.username.padEnd(11)} | ${item.password.padEnd(8)} | ${item.full_name.padEnd(19)} | ${item.role.padEnd(20)} | ${item.company.padEnd(12)} |`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // JSON format ham berish
    console.log('📄 JSON FORMAT:');
    console.log(JSON.stringify(loginList, null, 2));
    
    console.log('\n🎉 Barcha parollar yangilandi!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    throw error;
  }
};

if (require.main === module) {
  updatePasswords()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { updatePasswords };
