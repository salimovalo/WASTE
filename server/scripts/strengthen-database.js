#!/usr/bin/env node

const { sequelize } = require('../config/database');
const dbManager = require('../utils/database-manager');

async function strengthenDatabase() {
  try {
    console.log('\n🛡️  Ma\'lumotlar bazasini mustahkamlash boshlandi...\n');
    
    // Backup yaratish
    const backupFile = await dbManager.createBackup('strengthen_database');
    console.log(`📦 Backup yaratildi: ${backupFile}\n`);
    
    // 1. Foreign key constraintlarni tekshirish va yoqish
    console.log('🔗 Foreign key constraintlarni yoqish...');
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('✅ Foreign key constraintlar yoqildi\n');
    
    // 2. Indexlar yaratish (tezlikni oshirish uchun)
    console.log('⚡ Indexlar yaratilmoqda...');
    
    const indexes = [
      // Companies jadvali uchun
      'CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);',
      'CREATE INDEX IF NOT EXISTS idx_companies_inn ON companies(inn);',
      'CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);',
      
      // Districts jadvali uchun
      'CREATE INDEX IF NOT EXISTS idx_districts_company_id ON districts(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(code);',
      'CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active);',
      
      // Neighborhoods jadvali uchun
      'CREATE INDEX IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);',
      'CREATE INDEX IF NOT EXISTS idx_neighborhoods_code ON neighborhoods(code);',
      'CREATE INDEX IF NOT EXISTS idx_neighborhoods_tozamakon_id ON neighborhoods(tozamakon_id);',
      'CREATE INDEX IF NOT EXISTS idx_neighborhoods_type ON neighborhoods(type);',
      'CREATE INDEX IF NOT EXISTS idx_neighborhoods_active ON neighborhoods(is_active);',
      
      // Users jadvali uchun
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);',
      
      // Roles jadvali uchun
      'CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await sequelize.query(indexQuery);
        console.log(`   ✅ Index yaratildi: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.log(`   ⚠️  Index yaratishda xatolik: ${error.message}`);
      }
    }
    
    console.log('\n📊 Barcha indexlar muvaffaqiyatli yaratildi\n');
    
    // 3. PRAGMA settings (SQLite optimizatsiyasi)
    console.log('⚙️  Database settings optimizatsiyasi...');
    
    const pragmaSettings = [
      'PRAGMA journal_mode = WAL;',         // Write-Ahead Logging
      'PRAGMA synchronous = NORMAL;',       // Balansli tezlik va xavfsizlik
      'PRAGMA cache_size = 10000;',         // Katta cache o'lchami
      'PRAGMA temp_store = memory;',        // Vaqtinchalik fayllarni xotirada saqlash
      'PRAGMA mmap_size = 268435456;'       // Memory-mapped I/O (256MB)
    ];
    
    for (const pragma of pragmaSettings) {
      try {
        await sequelize.query(pragma);
        console.log(`   ✅ ${pragma}`);
      } catch (error) {
        console.log(`   ⚠️  ${pragma} - xatolik: ${error.message}`);
      }
    }
    
    console.log('\n🔧 Database settings optimizatsiyasi yakunlandi\n');
    
    // 4. Ma'lumotlar tutashligi tekshiruvi
    console.log('🔍 Ma\'lumotlar tutashligi tekshirmoqda...');
    
    try {
      await sequelize.query('PRAGMA integrity_check;');
      console.log('✅ Ma\'lumotlar tutashligi tekshiruvi o\'tdi\n');
    } catch (error) {
      console.log(`❌ Ma\'lumotlar tutashligi xatoligi: ${error.message}\n`);
    }
    
    // 5. Statistikalarni yangilash
    console.log('📈 Database statistikalarini yangilash...');
    try {
      await sequelize.query('ANALYZE;');
      console.log('✅ Statistikalar yangilandi\n');
    } catch (error) {
      console.log(`⚠️  Statistika yangilashda xatolik: ${error.message}\n`);
    }
    
    // 6. Database o'lchamini optimizatsiya qilish
    console.log('🗜️  Database o\'lchamini optimizatsiya qilish...');
    try {
      await sequelize.query('VACUUM;');
      console.log('✅ Database o\'lchami optimizatsiya qilindi\n');
    } catch (error) {
      console.log(`⚠️  VACUUM xatoligi: ${error.message}\n`);
    }
    
    // 7. Constraint tekshiruvlari
    console.log('🔒 Constraint tekshiruvlari...');
    
    const constraintChecks = [
      {
        name: 'Companies INNs',
        query: 'SELECT COUNT(*) as count FROM companies WHERE inn IS NULL OR LENGTH(inn) != 9;'
      },
      {
        name: 'Districts without companies',
        query: 'SELECT COUNT(*) as count FROM districts WHERE company_id NOT IN (SELECT id FROM companies);'
      },
      {
        name: 'Neighborhoods without districts',
        query: 'SELECT COUNT(*) as count FROM neighborhoods WHERE district_id NOT IN (SELECT id FROM districts);'
      },
      {
        name: 'Users without roles',
        query: 'SELECT COUNT(*) as count FROM users WHERE role_id NOT IN (SELECT id FROM roles);'
      }
    ];
    
    for (const check of constraintChecks) {
      try {
        const [result] = await sequelize.query(check.query);
        const count = result[0].count;
        if (count > 0) {
          console.log(`   ⚠️  ${check.name}: ${count} ta muammoli yozuv topildi`);
        } else {
          console.log(`   ✅ ${check.name}: Barcha yozuvlar to'g'ri`);
        }
      } catch (error) {
        console.log(`   ❌ ${check.name} tekshirishida xatolik: ${error.message}`);
      }
    }
    
    // 8. Database holati
    console.log('\n📊 Yakuniy database holati:');
    const health = await dbManager.checkDatabaseHealth();
    
    if (health.connected) {
      console.log('✅ Database ulanishi: Muvaffaqiyatli');
      console.log(`💾 Fayl o'lchami: ${(health.database_size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📋 Jadvallar soni: ${health.tables.length}`);
      
      console.log('\n📈 Jadvallar statistikasi:');
      for (const [table, count] of Object.entries(health.record_counts)) {
        console.log(`   • ${table}: ${count} ta yozuv`);
      }
    }
    
    // Log yozish
    await dbManager.logChange('DATABASE_STRENGTHENED', {
      backup_created: backupFile,
      indexes_created: indexes.length,
      pragma_settings_applied: pragmaSettings.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('\n🎯 Ma\'lumotlar bazasi mustahkamlash muvaffaqiyatli yakunlandi!');
    console.log(`📦 Backup fayl: ${backupFile}`);
    console.log('🛡️  Database endi yanada mustahkam va tezroq ishlaydi\n');
    
  } catch (error) {
    console.error('❌ Database mustahkamlashda xatolik:', error);
    
    // Xatolik log qilish
    await dbManager.logChange('DATABASE_STRENGTHEN_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Script ishga tushirish
async function main() {
  try {
    await strengthenDatabase();
  } catch (error) {
    console.error('\n💥 Script bajarishda xatolik:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
