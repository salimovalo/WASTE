const { sequelize } = require('../config/database');
const dbManager = require('../utils/database-manager');

async function addUserPermissions() {
  try {
    // Backup yaratish
    const backupFile = await dbManager.createBackup('add_user_permissions');
    console.log(`📦 Backup yaratildi: ${backupFile}\n`);

    console.log('🔄 Users jadvaliga permissions field qo\'shilmoqda...\n');

    // Check if column exists
    const [results] = await sequelize.query(`
      PRAGMA table_info(users);
    `);
    
    const hasColumn = results.some(column => column.name === 'permissions');
    
    if (!hasColumn) {
      console.log('Adding permissions column to users table...');
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}';
      `);
      console.log('✅ Permissions column added successfully!');
    } else {
      console.log('✅ Column permissions already exists');
    }

    // Verify the column was added
    const [newResults] = await sequelize.query(`
      PRAGMA table_info(users);
    `);
    
    console.log('\n📋 Users jadval strukturasi:');
    newResults.forEach(column => {
      console.log(`   • ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'}`);
    });

    // Log yozish
    await dbManager.logChange('USER_PERMISSIONS_ADDED', {
      backup_created: backupFile,
      timestamp: new Date().toISOString()
    });

    console.log('\n🎯 User permissions field muvaffaqiyatli qo\'shildi!');
    console.log(`📦 Backup: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ User permissions qo\'shishda xatolik:', error);
    
    await dbManager.logChange('USER_PERMISSIONS_ADD_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Script ishga tushirish
async function main() {
  try {
    await addUserPermissions();
  } catch (error) {
    console.error('\n💥 Script bajarishda xatolik:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
