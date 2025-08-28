const { sequelize } = require('../models');
const { User, Role, Company, District } = require('../models');
const bcrypt = require('bcryptjs');

const createDemoUser = async () => {
  try {
    console.log('🚀 Demo user yaratilmoqda...');
    
    // Company va Role olish
    const company = await Company.findOne();
    const district = await District.findOne();
    const role = await Role.findOne({ where: { name: 'super_admin' } });
    
    if (!company || !role) {
      throw new Error('Company yoki Role topilmadi');
    }

    // Demo user yaratish
    const [user, created] = await User.findOrCreate({
      where: { username: 'demo' },
      defaults: {
        username: 'demo',
        password_hash: await bcrypt.hash('demo123', 12),
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@example.com',
        role_id: role.id,
        company_id: company.id,
        district_id: district?.id,
        is_active: true
      }
    });

    if (created) {
      console.log('✅ Demo user yaratildi');
      console.log('   Username: demo');
      console.log('   Password: demo123');
    } else {
      console.log('📍 Demo user allaqachon mavjud');
    }

    // User ma'lumotlarini ko'rsatish
    const fullUser = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'display_name'] },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'] }
      ]
    });

    console.log('👤 User ma\'lumotlari:');
    console.log('   ID:', fullUser.id);
    console.log('   Role:', fullUser.role?.name);
    console.log('   Company:', fullUser.company?.name);
    console.log('   District:', fullUser.district?.name || 'Tayinlanmagan');
    
    console.log('\n🎉 Demo user tayyor!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    throw error;
  }
};

if (require.main === module) {
  createDemoUser()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Xatolik:', error);
      process.exit(1);
    });
}

module.exports = { createDemoUser };
