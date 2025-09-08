const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

/**
 * SQLite uchun database schema'ni tuzatish
 * PostgreSQL ENUM, JSONB, INET tiplarini SQLite uchun moslashtirish
 */

const fixDatabaseSchema = async () => {
  try {
    console.log('🔧 Database schema'ni SQLite uchun tuzatish boshlandi...');
    
    // 1. ENUM tiplarini CHECK constraint'lar bilan almashtirish
    const enumFixes = [
      {
        table: 'neighborhoods',
        column: 'type',
        values: ['apartment_complex', 'private_houses', 'mixed']
      },
      {
        table: 'vehicles',
        column: 'fuel_type', 
        values: ['diesel', 'gasoline', 'gas', 'electric']
      },
      {
        table: 'complaints',
        column: 'status',
        values: ['open', 'in_progress', 'resolved', 'closed']
      }
    ];

    for (const fix of enumFixes) {
      try {
        // Column mavjudligini tekshirish
        const tableInfo = await sequelize.getQueryInterface().describeTable(fix.table);
        
        if (tableInfo[fix.column]) {
          console.log(`✅ ${fix.table}.${fix.column} column mavjud`);
          
          // CHECK constraint qo'shish (agar mavjud bo'lmasa)
          const constraintName = `chk_${fix.table}_${fix.column}`;
          const checkValues = fix.values.map(v => `'${v}'`).join(', ');
          
          try {
            await sequelize.query(`
              ALTER TABLE ${fix.table} 
              ADD CONSTRAINT ${constraintName} 
              CHECK (${fix.column} IN (${checkValues}))
            `);
            console.log(`✅ CHECK constraint qo'shildi: ${constraintName}`);
          } catch (constraintError) {
            // Constraint allaqachon mavjud bo'lishi mumkin
            console.log(`⚠️ Constraint allaqachon mavjud yoki qo'shilmadi: ${constraintName}`);
          }
        }
      } catch (error) {
        console.error(`❌ ${fix.table}.${fix.column} tuzatishda xatolik:`, error.message);
      }
    }

    // 2. JSONB -> JSON o'zgartirish
    const jsonbFixes = [
      { table: 'roles', column: 'permissions' },
      { table: 'users', column: 'district_access' },
      { table: 'polygons', column: 'coordinates' },
      { table: 'polygons', column: 'waste_types' },
      { table: 'weather_configs', column: 'settings' },
      { table: 'audit_log', column: 'old_values' },
      { table: 'audit_log', column: 'new_values' }
    ];

    for (const fix of jsonbFixes) {
      try {
        const tableExists = await sequelize.getQueryInterface().showAllTables()
          .then(tables => tables.includes(fix.table));
        
        if (tableExists) {
          const tableInfo = await sequelize.getQueryInterface().describeTable(fix.table);
          
          if (tableInfo[fix.column]) {
            console.log(`✅ ${fix.table}.${fix.column} JSON column mavjud`);
            
            // SQLite'da JSONB va JSON bir xil, shuning uchun o'zgartirish shart emas
            // Lekin default qiymatlarni tekshiramiz
            if (fix.column === 'district_access' && !tableInfo[fix.column].defaultValue) {
              try {
                await sequelize.query(`
                  UPDATE ${fix.table} 
                  SET ${fix.column} = '[]' 
                  WHERE ${fix.column} IS NULL OR ${fix.column} = ''
                `);
                console.log(`✅ ${fix.table}.${fix.column} default qiymatlar yangilandi`);
              } catch (updateError) {
                console.log(`⚠️ ${fix.table}.${fix.column} yangilashda xatolik:`, updateError.message);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ ${fix.table}.${fix.column} JSON tuzatishda xatolik:`, error.message);
      }
    }

    // 3. INET -> TEXT o'zgartirish
    const inetFixes = [
      { table: 'audit_log', column: 'ip_address' }
    ];

    for (const fix of inetFixes) {
      try {
        const tableExists = await sequelize.getQueryInterface().showAllTables()
          .then(tables => tables.includes(fix.table));
        
        if (tableExists) {
          const tableInfo = await sequelize.getQueryInterface().describeTable(fix.table);
          
          if (tableInfo[fix.column]) {
            console.log(`✅ ${fix.table}.${fix.column} IP address column mavjud`);
            // SQLite'da TEXT sifatida saqlash yetarli
          }
        }
      } catch (error) {
        console.error(`❌ ${fix.table}.${fix.column} INET tuzatishda xatolik:`, error.message);
      }
    }

    // 4. Missing indexes qo'shish
    const indexesToAdd = [
      { table: 'trip_sheets', columns: ['date'] },
      { table: 'trip_sheets', columns: ['vehicle_id', 'date'] },
      { table: 'vehicles', columns: ['company_id', 'district_id'] },
      { table: 'employees', columns: ['company_id'] },
      { table: 'employees', columns: ['is_active'] },
      { table: 'vehicle_daily_data', columns: ['vehicle_id', 'date'] },
      { table: 'neighborhoods', columns: ['district_id', 'is_active'] },
      { table: 'legal_entities', columns: ['company_id', 'is_active'] }
    ];

    for (const indexInfo of indexesToAdd) {
      try {
        const tableExists = await sequelize.getQueryInterface().showAllTables()
          .then(tables => tables.includes(indexInfo.table));
        
        if (tableExists) {
          const indexName = `idx_${indexInfo.table}_${indexInfo.columns.join('_')}`;
          
          try {
            await sequelize.getQueryInterface().addIndex(indexInfo.table, {
              fields: indexInfo.columns,
              name: indexName
            });
            console.log(`✅ Index qo'shildi: ${indexName}`);
          } catch (indexError) {
            // Index allaqachon mavjud bo'lishi mumkin
            console.log(`⚠️ Index allaqachon mavjud: ${indexName}`);
          }
        }
      } catch (error) {
        console.error(`❌ Index qo'shishda xatolik:`, error.message);
      }
    }

    // 5. Data validation va cleanup
    console.log('🧹 Ma\'lumotlarni validatsiya qilish...');
    
    // Invalid JSON qiymatlarni tuzatish
    try {
      await sequelize.query(`
        UPDATE users 
        SET district_access = '[]' 
        WHERE district_access IS NULL 
           OR district_access = '' 
           OR district_access = 'null'
      `);
      
      await sequelize.query(`
        UPDATE roles 
        SET permissions = '{}' 
        WHERE permissions IS NULL 
           OR permissions = '' 
           OR permissions = 'null'
      `);
      
      console.log('✅ JSON field'lar tozalandi');
    } catch (cleanupError) {
      console.error('❌ JSON cleanup xatoligi:', cleanupError.message);
    }

    console.log('✅ Database schema tuzatish yakunlandi!');
    
  } catch (error) {
    console.error('❌ Database schema tuzatishda umumiy xatolik:', error);
    throw error;
  }
};

// Script to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('🎉 Database schema muvaffaqiyatli tuzatildi!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database schema tuzatishda xatolik:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
