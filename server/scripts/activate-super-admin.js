/**
 * Super Admin'ni faollashtirish va parolini yangilash
 */

const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');

const activateSuperAdmin = async () => {
  try {
    console.log('🔄 Super Admin faollashtirmoqda...\n');
    
    // Super admin rolini topish
    const superAdminRole = await Role.findOne({ 
      where: { name: 'super_admin' } 
    });
    
    if (!superAdminRole) {
      console.log('❌ Super admin role topilmadi!');
      return;
    }
    
    // Super admin foydalanuvchini topish
    const superAdmin = await User.findOne({
      where: { 
        role_id: superAdminRole.id,
        username: 'admin'
      }
    });
    
    if (!superAdmin) {
      console.log('❌ Super admin foydalanuvchi topilmadi!');
      return;
    }
    
    console.log('📄 Hozirgi Super Admin ma\'lumotlari:');
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Username: ${superAdmin.username}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Active: ${superAdmin.is_active ? 'Ha' : 'Yo\'q'}`);
    console.log(`   Last Login: ${superAdmin.last_login || 'Hech qachon'}\n`);
    
    // Yangi parolni hash qilish
    const newPassword = 'admin123';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Super admin'ni yangilash
    await superAdmin.update({
      is_active: true,
      password_hash: passwordHash,
      updated_at: new Date()
    });
    
    console.log('✅ Super Admin muvaffaqiyatli yangilandi!');
    console.log('\n🎉 Login ma\'lumotlari:');
    console.log(`   Username: ${superAdmin.username}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Status: Faol\n`);
    
    // Tekshirish uchun qayta o'qish
    const updatedAdmin = await User.findByPk(superAdmin.id, {
      include: [
        {
          model: Role,
          as: 'role'
        }
      ]
    });
    
    console.log('🔍 Yangilangan ma\'lumotlar:');
    console.log(`   Active: ${updatedAdmin.is_active ? 'Ha' : 'Yo\'q'}`);
    console.log(`   Password Hash: ${updatedAdmin.password_hash ? 'Mavjud' : 'Yo\'q'}`);
    console.log(`   Role: ${updatedAdmin.role?.display_name || 'Noma\'lum'}`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  }
};

// Script ishga tushirish
if (require.main === module) {
  activateSuperAdmin()
    .then(() => {
      console.log('\n✅ Super Admin faollashtirish tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Super Admin faollashtirishda fatal xatolik:', error);
      process.exit(1);
    });
}

module.exports = activateSuperAdmin;
