// Quick security fixes for immediate deployment

const { sequelize, User, Role, Company, District } = require('../models');

const quickSecurityFix = async () => {
  try {
    console.log('🛡️ Quick security fixes boshlandi...');

    // 1. Ensure all users have proper company/district assignments
    const users = await User.findAll({
      include: [
        { model: Role, as: 'role' },
        { model: Company, as: 'company' }
      ]
    });

    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // ZW company admin check
      if (user.username === 'zw_admin' && user.company_id !== 2) {
        updates.company_id = 2; // ZW company ID
        needsUpdate = true;
        console.log(`📝 ${user.username} korxonasi ZW ga o'rnatildi`);
      }

      // ABF company admin check  
      if (user.username === 'abf_admin' && user.company_id !== 1) {
        updates.company_id = 1; // ABF company ID
        needsUpdate = true;
        console.log(`📝 ${user.username} korxonasi ABF ga o'rnatildi`);
      }

      // Operator district access check
      if (user.role?.name === 'operator') {
        if (!user.district_access || user.district_access.length === 0) {
          // Set default district for operators
          const district = await District.findOne({ 
            where: { company_id: user.company_id },
            order: [['id', 'ASC']]
          });
          
          if (district) {
            updates.district_access = [district.id];
            needsUpdate = true;
            console.log(`📝 ${user.username} tuman ruxsatlari o'rnatildi: [${district.id}]`);
          }
        }
      }

      if (needsUpdate) {
        await user.update(updates);
      }
    }

    // 2. Add basic performance indexes
    try {
      await sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quick_users_company 
        ON users(company_id) WHERE company_id IS NOT NULL;
      `);
      
      await sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quick_vehicles_company_district 
        ON vehicles(company_id, district_id);
      `);

      console.log('📊 Basic performance indexlar qo\'shildi');
    } catch (indexError) {
      console.warn('⚠️ Index qo\'shishda xatolik (normal bo\'lishi mumkin):', indexError.message);
    }

    // 3. Verify role permissions
    const roles = await Role.findAll();
    for (const role of roles) {
      if (!role.permissions || Object.keys(role.permissions).length === 0) {
        console.warn(`⚠️ Role ${role.name} da permissions yo'q!`);
      }
    }

    // 4. Log current user assignments
    console.log('\n📋 FOYDALANUVCHI TAYINLASHLARI:');
    for (const user of users) {
      console.log(`👤 ${user.username}:`);
      console.log(`   - Role: ${user.role?.name || 'NO ROLE'}`);
      console.log(`   - Company: ${user.company?.name || 'NO COMPANY'} (ID: ${user.company_id})`);
      console.log(`   - Districts: ${JSON.stringify(user.district_access)}`);
      console.log('');
    }

    console.log('✅ Quick security fixes tugallandi!\n');
    
    console.log('🧪 TEST QILISH UCHUN:');
    console.log('   - admin/admin123 (Super Admin - barcha ma\'lumotlar)');
    console.log('   - zw_admin/zw123 (ZW Admin - faqat ZW ma\'lumotlari)'); 
    console.log('   - abf_admin/abf123 (ABF Admin - faqat ABF ma\'lumotlari)');
    console.log('   - operator1/op123 (Operator - faqat tayinlangan tuman)');

  } catch (error) {
    console.error('❌ Quick security fix xatolik:', error);
    throw error;
  }
};

// Run the fix
if (require.main === module) {
  quickSecurityFix()
    .then(() => {
      console.log('\n🎉 Security fix tugallandi! Sahifani yangilang (F5)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = quickSecurityFix;
