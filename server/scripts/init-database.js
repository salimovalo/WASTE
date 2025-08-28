const { sequelize, syncDatabase } = require('../models');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('📊 Ma\'lumotlar bazasini sozlash...');
    
    // Sync database
    await syncDatabase();
    console.log('✅ Ma\'lumotlar bazasi muvaffaqiyatli yaratildi');
    
    // Check if admin user exists
    const User = require('../models/User');
    const Role = require('../models/Role');
    const Company = require('../models/Company');
    const District = require('../models/District');
    
    // Create default company if not exists
    let [company] = await Company.findOrCreate({
      where: { name: 'Bosh Kompaniya' },
      defaults: {
        name: 'Bosh Kompaniya',
        description: 'Asosiy boshqaruv kompaniyasi',
        address: 'Toshkent shahri',
        phone: '+998901234567',
        email: 'info@waste.uz',
        is_active: true
      }
    });
    console.log('✅ Kompaniya mavjud:', company.name);
    
    // Create default district if not exists
    let [district] = await District.findOrCreate({
      where: { name: 'Test Tuman' },
      defaults: {
        name: 'Test Tuman',
        company_id: company.id,
        description: 'Test uchun tuman',
        is_active: true
      }
    });
    console.log('✅ Tuman mavjud:', district.name);
    
    // Create admin role if not exists
    let [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        name: 'admin',
        display_name: 'Administrator',
        description: 'Tizim administratori',
        permissions: JSON.stringify({
          users: { view: true, create: true, edit: true, delete: true },
          companies: { view: true, create: true, edit: true, delete: true },
          districts: { view: true, create: true, edit: true, delete: true },
          vehicles: { view: true, create: true, edit: true, delete: true },
          fuel: { view: true, create: true, edit: true, delete: true },
          reports: { view: true, create: true, edit: true, delete: true },
          employees: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, edit: true }
        })
      }
    });
    console.log('✅ Admin roli mavjud');
    
    // Check if admin user exists
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@waste.uz',
        phone: '+998901234567',
        role_id: adminRole.id,
        company_id: company.id,
        district_id: district.id,
        is_active: true,
        permissions: JSON.stringify({
          users: { view: true, create: true, edit: true, delete: true },
          companies: { view: true, create: true, edit: true, delete: true },
          districts: { view: true, create: true, edit: true, delete: true },
          vehicles: { view: true, create: true, edit: true, delete: true },
          fuel: { view: true, create: true, edit: true, delete: true },
          reports: { view: true, create: true, edit: true, delete: true },
          employees: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, edit: true }
        })
      });
      
      console.log('✅ Admin foydalanuvchi yaratildi');
      console.log('📌 Login: admin');
      console.log('📌 Parol: admin123');
    } else {
      console.log('ℹ️ Admin foydalanuvchi allaqachon mavjud');
    }
    
    // Create test roles
    const roles = [
      {
        name: 'manager',
        display_name: 'Menejer',
        description: 'Tuman menenjeri',
        permissions: {
          vehicles: { view: true, create: true, edit: true },
          fuel: { view: true, create: true, edit: true },
          reports: { view: true, create: true },
          employees: { view: true, create: true, edit: true }
        }
      },
      {
        name: 'operator',
        display_name: 'Operator',
        description: 'Ma\'lumot kirituvchi operator',
        permissions: {
          vehicles: { view: true },
          fuel: { view: true, create: true },
          reports: { view: true },
          employees: { view: true }
        }
      },
      {
        name: 'viewer',
        display_name: 'Ko\'ruvchi',
        description: 'Faqat ko\'rish huquqiga ega',
        permissions: {
          vehicles: { view: true },
          fuel: { view: true },
          reports: { view: true },
          employees: { view: true }
        }
      }
    ];
    
    for (const roleData of roles) {
      await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: {
          ...roleData,
          permissions: JSON.stringify(roleData.permissions)
        }
      });
    }
    console.log('✅ Barcha rollar yaratildi');
    
    console.log('\n========================================');
    console.log('✅ Ma\'lumotlar bazasi tayyor!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run initialization
initDatabase();


