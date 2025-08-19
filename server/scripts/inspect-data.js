#!/usr/bin/env node

const { sequelize } = require('../config/database');
const { Company, District, Neighborhood, User, Role } = require('../models');

async function inspectData() {
  try {
    console.log('\n🔍 Ma\'lumotlar bazasi tarkibini tekshirish...\n');
    
    // Kompaniyalar
    console.log('🏢 KOMPANIYALAR:');
    const companies = await Company.findAll({
      attributes: ['id', 'name', 'code', 'inn', 'bank_account', 'is_active']
    });
    
    companies.forEach(company => {
      console.log(`   ${company.id}. ${company.name} (${company.code})`);
      console.log(`      INN: ${company.inn || 'N/A'}, Bank: ${company.bank_account || 'N/A'}`);
      console.log(`      Holat: ${company.is_active ? 'Faol' : 'Faolsiz'}\n`);
    });
    
    // Tumanlar
    console.log('🏘️ TUMANLAR:');
    const districts = await District.findAll({
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['name', 'code']
        }
      ],
      attributes: ['id', 'name', 'code', 'region', 'population', 'is_active']
    });
    
    districts.forEach(district => {
      console.log(`   ${district.id}. ${district.name} (${district.code})`);
      console.log(`      Kompaniya: ${district.company?.name || 'N/A'}`);
      console.log(`      Viloyat: ${district.region || 'N/A'}`);
      console.log(`      Aholi: ${district.population || 'N/A'}`);
      console.log(`      Holat: ${district.is_active ? 'Faol' : 'Faolsiz'}\n`);
    });
    
    // Maxallalar
    console.log('🏡 MAXALLALAR:');
    const neighborhoods = await Neighborhood.findAll({
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['name', 'code'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['name']
            }
          ]
        }
      ],
      attributes: ['id', 'name', 'code', 'tozamakon_id', 'type', 'is_active']
    });
    
    neighborhoods.forEach(neighborhood => {
      console.log(`   ${neighborhood.id}. ${neighborhood.name} (${neighborhood.code})`);
      console.log(`      Tuman: ${neighborhood.district?.name || 'N/A'}`);
      console.log(`      Kompaniya: ${neighborhood.district?.company?.name || 'N/A'}`);
      console.log(`      Tozamakon ID: ${neighborhood.tozamakon_id || 'N/A'}`);
      console.log(`      Turi: ${neighborhood.type || 'N/A'}`);
      console.log(`      Holat: ${neighborhood.is_active ? 'Faol' : 'Faolsiz'}\n`);
    });
    
    // Foydalanuvchilar
    console.log('👥 FOYDALANUVCHILAR:');
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    });
    
    users.forEach(user => {
      console.log(`   ${user.id}. ${user.username} (${user.first_name} ${user.last_name})`);
      console.log(`      Email: ${user.email || 'N/A'}`);
      console.log(`      Rol: ${user.role?.name || 'N/A'}`);
      console.log(`      Holat: ${user.is_active ? 'Faol' : 'Faolsiz'}\n`);
    });
    
    // Rollar
    console.log('🔐 ROLLAR:');
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'permissions']
    });
    
    roles.forEach(role => {
      console.log(`   ${role.id}. ${role.name}`);
      console.log(`      Tavsif: ${role.description || 'N/A'}`);
      if (role.permissions) {
        try {
          const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
          console.log(`      Ruxsatlar: ${Object.keys(perms).join(', ')}`);
        } catch (error) {
          console.log(`      Ruxsatlar: Noto'g'ri format`);
        }
      }
      console.log('');
    });
    
    // Statistika
    console.log('📊 UMUMIY STATISTIKA:');
    console.log(`   • Kompaniyalar: ${companies.length} ta`);
    console.log(`   • Tumanlar: ${districts.length} ta`);
    console.log(`   • Maxallalar: ${neighborhoods.length} ta`);
    console.log(`   • Foydalanuvchilar: ${users.length} ta`);
    console.log(`   • Rollar: ${roles.length} ta\n`);
    
  } catch (error) {
    console.error('❌ Tekshirishda xatolik:', error);
  } finally {
    await sequelize.close();
  }
}

inspectData();
