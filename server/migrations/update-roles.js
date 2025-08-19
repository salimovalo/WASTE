const { sequelize } = require('../config/database');
const { Role } = require('../models');
const dbManager = require('../utils/database-manager');

// Yangi ierarxik rollar va ularning ruxsatlari
const newRoles = [
  {
    name: 'company_director',
    display_name: 'Korxona direktori',
    description: 'Korxona direktori - faqat ko\'rish huquqi',
    permissions: {
      // Faqat ko'rish ruxsatlari
      view_companies: true,
      view_districts: true,
      view_neighborhoods: true,
      view_users: true,
      view_physical_persons: true,
      view_legal_entities: true,
      view_vehicles: true,
      view_service_quality: true,
      view_employees: true,
      view_reports: true,
      // Tahrirlash ruxsatlari yo'q
    }
  },
  {
    name: 'company_accountant',
    display_name: 'Korxona buxgalteri',
    description: 'Korxona buxgalteri - ko\'rish va belgilangan joylarga kiritish',
    permissions: {
      // Ko'rish ruxsatlari
      view_companies: true,
      view_districts: true,
      view_neighborhoods: true,
      view_users: true,
      view_physical_persons: true,
      view_legal_entities: true,
      view_vehicles: true,
      view_service_quality: true,
      view_employees: true,
      view_reports: true,
      // Belgilangan tahrirlash ruxsatlari
      edit_physical_persons: true,
      edit_legal_entities: true,
      edit_service_quality: true,
      export_reports: true
    }
  },
  {
    name: 'district_director',
    display_name: 'Tuman direktori',
    description: 'Tuman direktori - tuman kesimida barcha ma\'lumotlarni ko\'rish',
    permissions: {
      // Tuman darajasida ko'rish
      view_districts: true,
      view_neighborhoods: true,
      view_users: true,
      view_physical_persons: true,
      view_legal_entities: true,
      view_vehicles: true,
      view_service_quality: true,
      view_employees: true,
      view_reports: true
    }
  },
  {
    name: 'district_accountant',
    display_name: 'Tuman buxgalteri',
    description: 'Tuman buxgalteri - tuman kesimida belgilangan modullar',
    permissions: {
      // Tuman darajasida ko'rish va tahrirlash
      view_physical_persons: true,
      edit_physical_persons: true,
      view_legal_entities: true,
      edit_legal_entities: true,
      view_service_quality: true,
      edit_service_quality: true,
      view_reports: true
    }
  },
  {
    name: 'district_operator',
    display_name: 'Tuman operatori',
    description: 'Tuman operatori - belgilangan modularda ishlash',
    permissions: {
      // Faqat operatsion ishlar
      view_physical_persons: true,
      edit_physical_persons: true,
      view_legal_entities: true,
      edit_legal_entities: true,
      view_service_quality: true,
      edit_service_quality: true
    }
  }
];

async function updateRoles() {
  try {
    // Backup yaratish
    const backupFile = await dbManager.createBackup('update_roles');
    console.log(`📦 Backup yaratildi: ${backupFile}\n`);

    console.log('🔄 Rollarni yangilash boshlandi...\n');

    // Joriy rollarni ko'rsatish
    const existingRoles = await Role.findAll();
    console.log('📋 Joriy rollar:');
    existingRoles.forEach(role => {
      console.log(`   • ${role.name} - ${role.description}`);
    });
    console.log('');

    // Yangi rollarni qo'shish
    for (const roleData of newRoles) {
      try {
        // Rol mavjudligini tekshirish
        const existingRole = await Role.findOne({ where: { name: roleData.name } });
        
        if (existingRole) {
          // Mavjud rolni yangilash
          await existingRole.update({
            display_name: roleData.display_name,
            description: roleData.description,
            permissions: roleData.permissions
          });
          console.log(`✅ Yangilandi: ${roleData.name}`);
        } else {
          // Yangi rol yaratish
          await Role.create({
            name: roleData.name,
            display_name: roleData.display_name,
            description: roleData.description,
            permissions: roleData.permissions
          });
          console.log(`🆕 Yaratildi: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`❌ ${roleData.name} xatoligi:`, error.message);
      }
    }

    // Company_admin rolini yangilash (foydalanuvchi qo'sha olmasligi uchun)
    const companyAdmin = await Role.findOne({ where: { name: 'company_admin' } });
    if (companyAdmin) {
      const currentPerms = companyAdmin.permissions || {};
      // User management ruxsatlarini olib tashlash
      delete currentPerms.create_users;
      delete currentPerms.delete_users;
      // Faqat ko'rish va tahrirlash qoldirish
      currentPerms.view_users = true;
      currentPerms.edit_users = true; // faqat profile tahrirlash
      
      await companyAdmin.update({
        description: 'Korxona admini - korxona kesimida boshqarish, foydalanuvchi qo\'sha olmaydi',
        permissions: currentPerms
      });
      console.log(`🔄 Yangilandi: company_admin (user creation ruxsatlari olib tashlandi)`);
    }

    console.log('\n📊 Yangilangan rollar ro\'yxati:');
    const updatedRoles = await Role.findAll({ order: [['id', 'ASC']] });
    updatedRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name}`);
      console.log(`   ${role.description}`);
      
      try {
        const perms = role.permissions || {};
        const permissionCount = Object.keys(perms).length;
        console.log(`   Ruxsatlar: ${permissionCount} ta\n`);
      } catch (error) {
        console.log(`   Ruxsatlar: Noto'g'ri format\n`);
      }
    });

    // Log yozish
    await dbManager.logChange('ROLES_UPDATED', {
      backup_created: backupFile,
      new_roles_count: newRoles.length,
      total_roles: updatedRoles.length,
      timestamp: new Date().toISOString()
    });

    console.log('🎯 Rollar muvaffaqiyatli yangilandi!');
    console.log(`📦 Backup: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Rollarni yangilashda xatolik:', error);
    
    await dbManager.logChange('ROLES_UPDATE_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Script ishga tushirish
async function main() {
  try {
    await updateRoles();
  } catch (error) {
    console.error('\n💥 Script bajarishda xatolik:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
