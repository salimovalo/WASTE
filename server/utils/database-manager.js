const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

class DatabaseManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.logFile = path.join(__dirname, '../logs/database-changes.log');
    
    // Backup va log papkalarini yaratish
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    if (!fs.existsSync(path.dirname(this.logFile))) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    }
  }

  // Ma'lumotlar bazasini backup qilish
  async createBackup(reason = 'manual') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `database_backup_${timestamp}.sqlite`;
      const backupPath = path.join(this.backupDir, backupFileName);
      
      // SQLite faylini nusxalash
      fs.copyFileSync('./database.sqlite', backupPath);
      
      // Log yozish
      await this.logChange('BACKUP_CREATED', {
        reason,
        backup_file: backupFileName,
        timestamp: new Date().toISOString(),
        size: fs.statSync(backupPath).size
      });
      
      console.log(`✅ Backup yaratildi: ${backupFileName}`);
      return backupFileName;
      
    } catch (error) {
      console.error('❌ Backup yaratishda xatolik:', error);
      throw error;
    }
  }

  // Backupni tiklash
  async restoreBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup fayl topilmadi: ${backupFileName}`);
      }
      
      // Hozirgi ma'lumotlar bazasini backup qilish
      await this.createBackup('before_restore');
      
      // Backup faylni tiklash
      fs.copyFileSync(backupPath, './database.sqlite');
      
      // Log yozish
      await this.logChange('BACKUP_RESTORED', {
        backup_file: backupFileName,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Backup tiklandi: ${backupFileName}`);
      return true;
      
    } catch (error) {
      console.error('❌ Backup tiklashda xatolik:', error);
      throw error;
    }
  }

  // Backuplar ro'yxatini olish
  getBackupList() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sqlite'))
        .map(file => {
          const fullPath = path.join(this.backupDir, file);
          const stats = fs.statSync(fullPath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);
      
      return files;
    } catch (error) {
      console.error('❌ Backup ro\'yxatini olishda xatolik:', error);
      return [];
    }
  }

  // O'zgarishlarni log qilish
  async logChange(action, details = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        user: process.env.USER || 'system'
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
      
    } catch (error) {
      console.error('❌ Log yozishda xatolik:', error);
    }
  }

  // Log tarixini o'qish
  getChangeLog(limit = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }
      
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry)
        .reverse();
        
    } catch (error) {
      console.error('❌ Log o\'qishda xatolik:', error);
      return [];
    }
  }

  // Ma'lumotlar bazasi holatini tekshirish
  async checkDatabaseHealth() {
    try {
      await sequelize.authenticate();
      
      // Jadvallar ro'yxati
      const [tables] = await sequelize.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name;
      `);
      
      // Har bir jadvaldagi yozuvlar soni
      const tableStats = {};
      for (const table of tables) {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        tableStats[table.name] = result[0].count;
      }
      
      return {
        connected: true,
        tables: tables.map(t => t.name),
        record_counts: tableStats,
        database_size: fs.statSync('./database.sqlite').size
      };
      
    } catch (error) {
      console.error('❌ Ma\'lumotlar bazasi tekshirishda xatolik:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Schema migration uchun
  async runMigration(migrationName, migrationFunction) {
    try {
      // Migration oldidan backup
      const backupFile = await this.createBackup(`before_migration_${migrationName}`);
      
      // Log yozish
      await this.logChange('MIGRATION_STARTED', {
        migration: migrationName,
        backup_created: backupFile
      });
      
      // Migration bajarish
      await migrationFunction();
      
      // Muvaffaqiyatli log
      await this.logChange('MIGRATION_COMPLETED', {
        migration: migrationName
      });
      
      console.log(`✅ Migration bajarildi: ${migrationName}`);
      return true;
      
    } catch (error) {
      // Xatolik log qilish
      await this.logChange('MIGRATION_FAILED', {
        migration: migrationName,
        error: error.message
      });
      
      console.error(`❌ Migration xatoligi: ${migrationName}`, error);
      throw error;
    }
  }

  // Tezkor orqaga qaytarish (eng oxirgi backupga)
  async quickRollback() {
    try {
      const backups = this.getBackupList();
      if (backups.length === 0) {
        throw new Error('Hech qanday backup topilmadi');
      }
      
      // Eng oxirgi backupni olish
      const latestBackup = backups[0];
      await this.restoreBackup(latestBackup.filename);
      
      console.log(`✅ Tezkor rollback bajarildi: ${latestBackup.filename}`);
      return latestBackup.filename;
      
    } catch (error) {
      console.error('❌ Tezkor rollback xatoligi:', error);
      throw error;
    }
  }

  // Eski backuplarni tozalash
  cleanOldBackups(keepCount = 10) {
    try {
      const backups = this.getBackupList();
      
      if (backups.length <= keepCount) {
        console.log(`📁 ${backups.length} ta backup mavjud, tozalash kerak emas`);
        return;
      }
      
      const toDelete = backups.slice(keepCount);
      let deletedCount = 0;
      
      for (const backup of toDelete) {
        try {
          fs.unlinkSync(path.join(this.backupDir, backup.filename));
          deletedCount++;
        } catch (error) {
          console.error(`❌ Backup o'chirishda xatolik: ${backup.filename}`, error);
        }
      }
      
      this.logChange('BACKUP_CLEANUP', {
        deleted_count: deletedCount,
        kept_count: keepCount
      });
      
      console.log(`🗑️ ${deletedCount} ta eski backup o'chirildi, ${keepCount} ta saqlab qolindi`);
      
    } catch (error) {
      console.error('❌ Backup tozalashda xatolik:', error);
    }
  }
}

module.exports = new DatabaseManager();
