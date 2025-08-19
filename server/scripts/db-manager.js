#!/usr/bin/env node

const dbManager = require('../utils/database-manager');
const { sequelize } = require('../config/database');

// CLI argumentlarini olish
const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'backup':
        {
          const reason = args[0] || 'manual';
          const backupFile = await dbManager.createBackup(reason);
          console.log(`\n🎯 Backup muvaffaqiyatli yaratildi:`);
          console.log(`📁 Fayl: ${backupFile}`);
          console.log(`📝 Sabab: ${reason}`);
          console.log(`📅 Vaqt: ${new Date().toLocaleString()}`);
        }
        break;

      case 'restore':
        {
          const backupFile = args[0];
          if (!backupFile) {
            console.log('❌ Backup fayl nomini kiriting!');
            console.log('Misol: node db-manager.js restore database_backup_2025-01-15T10-30-00-000Z.sqlite');
            return;
          }
          
          await dbManager.restoreBackup(backupFile);
          console.log(`\n🎯 Backup muvaffaqiyatli tiklandi:`);
          console.log(`📁 Fayl: ${backupFile}`);
          console.log(`📅 Vaqt: ${new Date().toLocaleString()}`);
        }
        break;

      case 'list':
        {
          const backups = dbManager.getBackupList();
          console.log(`\n📋 Mavjud backuplar (${backups.length} ta):\n`);
          
          if (backups.length === 0) {
            console.log('🔍 Hech qanday backup topilmadi');
            return;
          }
          
          backups.forEach((backup, index) => {
            const sizeInMB = (backup.size / 1024 / 1024).toFixed(2);
            console.log(`${index + 1}. ${backup.filename}`);
            console.log(`   📅 Yaratilgan: ${backup.created.toLocaleString()}`);
            console.log(`   💾 Hajm: ${sizeInMB} MB\n`);
          });
        }
        break;

      case 'status':
        {
          console.log('\n🔍 Ma\'lumotlar bazasi holati tekshirilmoqda...\n');
          
          const health = await dbManager.checkDatabaseHealth();
          
          if (health.connected) {
            console.log('✅ Ma\'lumotlar bazasi muvaffaqiyatli ulandi');
            console.log(`💾 Fayl hajmi: ${(health.database_size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📊 Jadvallar soni: ${health.tables.length}`);
            console.log('\n📋 Jadvallar va yozuvlar soni:');
            
            for (const [table, count] of Object.entries(health.record_counts)) {
              console.log(`   • ${table}: ${count} ta yozuv`);
            }
          } else {
            console.log('❌ Ma\'lumotlar bazasiga ulanib bo\'lmadi');
            console.log(`🔴 Xatolik: ${health.error}`);
          }
        }
        break;

      case 'rollback':
        {
          console.log('\n⚠️  Tezkor rollback boshlanmoqda...');
          const restoredFile = await dbManager.quickRollback();
          console.log(`\n🎯 Muvaffaqiyatli orqaga qaytarildi:`);
          console.log(`📁 Fayl: ${restoredFile}`);
          console.log(`📅 Vaqt: ${new Date().toLocaleString()}`);
        }
        break;

      case 'log':
        {
          const limit = parseInt(args[0]) || 50;
          const logs = dbManager.getChangeLog(limit);
          
          console.log(`\n📊 Oxirgi ${limit} ta o'zgarish:\n`);
          
          if (logs.length === 0) {
            console.log('🔍 Hech qanday o\'zgarish topilmadi');
            return;
          }
          
          logs.forEach((log, index) => {
            const date = new Date(log.timestamp).toLocaleString();
            console.log(`${index + 1}. [${date}] ${log.action}`);
            
            if (log.details && Object.keys(log.details).length > 0) {
              Object.entries(log.details).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
              });
            }
            console.log('');
          });
        }
        break;

      case 'clean':
        {
          const keepCount = parseInt(args[0]) || 10;
          dbManager.cleanOldBackups(keepCount);
          console.log(`\n🗑️ Eski backuplar tozalandi, ${keepCount} ta eng yangi backup saqlab qolindi`);
        }
        break;

      case 'help':
      default:
        console.log(`
🛠️  Ma'lumotlar bazasi boshqaruv vositasi

📋 Mavjud buyruqlar:

  backup [sabab]          - Yangi backup yaratish
  restore <fayl>          - Backupni tiklash  
  list                    - Barcha backuplar ro'yxati
  status                  - Ma'lumotlar bazasi holati
  rollback                - Tezkor orqaga qaytarish (eng oxirgi backup)
  log [limit]             - O'zgarishlar jurnali (default: 50)
  clean [saqlash_soni]    - Eski backuplarni tozalash (default: 10)
  help                    - Bu yordam

💡 Misollar:
  node db-manager.js backup "yangi_funksiya_qoshildi"
  node db-manager.js restore database_backup_2025-01-15T10-30-00-000Z.sqlite
  node db-manager.js list
  node db-manager.js status
  node db-manager.js rollback
  node db-manager.js log 20
  node db-manager.js clean 5

⚡ Tezkor buyruqlar uchun package.json scriptlarga qo'shing:
  "db:backup": "node scripts/db-manager.js backup",
  "db:restore": "node scripts/db-manager.js restore",
  "db:status": "node scripts/db-manager.js status",
  "db:rollback": "node scripts/db-manager.js rollback"
        `);
        break;
    }
    
  } catch (error) {
    console.error(`\n❌ Xatolik yuz berdi: ${error.message}`);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(0);
  }
}

// Script ishga tushirish
main();
