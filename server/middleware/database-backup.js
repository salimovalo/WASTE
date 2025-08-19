const dbManager = require('../utils/database-manager');

// Avtomatik backup yaratadigan middleware
const autoBackup = (reason) => {
  return async (req, res, next) => {
    try {
      // Faqat POST, PUT, DELETE operatsiyalar uchun backup
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const backupReason = `${reason}_${req.method}_${req.originalUrl}`;
        
        // Backup yaratish
        await dbManager.createBackup(backupReason);
        
        // Request ma'lumotlarini log qilish
        await dbManager.logChange('API_REQUEST', {
          method: req.method,
          url: req.originalUrl,
          user_id: req.user?.id,
          user_role: req.user?.role?.name,
          reason: backupReason,
          ip: req.ip || req.connection.remoteAddress
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ Avtomatik backup xatoligi:', error);
      // Backup xatoligi API ish jarayonini to'xtatmasin
      next();
    }
  };
};

// Muhim operatsiyalar uchun maxsus backup
const criticalBackup = async (req, res, next) => {
  try {
    const criticalOperations = [
      '/api/companies',
      '/api/districts', 
      '/api/neighborhoods',
      '/api/users'
    ];
    
    const isCritical = criticalOperations.some(path => 
      req.originalUrl.includes(path)
    );
    
    if (isCritical && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const reason = `CRITICAL_${req.method}_${req.originalUrl.split('/').pop()}`;
      await dbManager.createBackup(reason);
      
      console.log(`🛡️ Muhim operatsiya oldidan backup yaratildi: ${reason}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Muhim backup xatoligi:', error);
    next();
  }
};

// Kunlik avtomatik backup
const scheduleDailyBackup = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0); // Har kun soat 02:00 da
  
  const msUntilTomorrow = tomorrow.getTime() - now.getTime();
  
  setTimeout(async () => {
    try {
      await dbManager.createBackup('daily_auto');
      console.log('📅 Kunlik avtomatik backup yaratildi');
      
      // Eski backuplarni tozalash
      dbManager.cleanOldBackups(30); // 30 ta backup saqlab qolish
      
      // Keyingi kun uchun qayta rejalashtirish
      scheduleDailyBackup();
    } catch (error) {
      console.error('❌ Kunlik backup xatoligi:', error);
    }
  }, msUntilTomorrow);
  
  console.log(`⏰ Keyingi avtomatik backup: ${tomorrow.toLocaleString()}`);
};

module.exports = {
  autoBackup,
  criticalBackup,
  scheduleDailyBackup
};
