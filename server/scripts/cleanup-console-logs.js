const fs = require('fs');
const path = require('path');

/**
 * Console.log'larni production-ready logging bilan almashtirish
 */

const { logger } = require('../utils/logger');

// Fayllarni recursive ravishda topish
function findFiles(dir, extension = '.js', files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // node_modules va boshqa keraksiz papkalarni o'tkazib yuborish
      if (!['node_modules', '.git', 'logs', 'backups', 'uploads'].includes(item)) {
        findFiles(fullPath, extension, files);
      }
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Console.log'larni logger bilan almashtirish
function replaceConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // console.log() -> logger.info()
  const logPattern = /console\.log\s*\(/g;
  if (logPattern.test(content)) {
    content = content.replace(logPattern, 'logger.info(');
    changed = true;
  }
  
  // console.error() -> logger.error()
  const errorPattern = /console\.error\s*\(/g;
  if (errorPattern.test(content)) {
    content = content.replace(errorPattern, 'logger.error(');
    changed = true;
  }
  
  // console.warn() -> logger.warn()
  const warnPattern = /console\.warn\s*\(/g;
  if (warnPattern.test(content)) {
    content = content.replace(warnPattern, 'logger.warn(');
    changed = true;
  }
  
  // console.debug() -> logger.debug()
  const debugPattern = /console\.debug\s*\(/g;
  if (debugPattern.test(content)) {
    content = content.replace(debugPattern, 'logger.debug(');
    changed = true;
  }
  
  // Agar o'zgarishlar bo'lsa, logger import qo'shish
  if (changed && !content.includes('logger')) {
    // Import statement qo'shish
    const importPattern = /^(const|import)/m;
    if (importPattern.test(content)) {
      content = content.replace(importPattern, `const { logger } = require('../utils/logger');\n$1`);
    } else {
      content = `const { logger } = require('../utils/logger');\n\n${content}`;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Debug console.log'larni o'chirish
function removeDebugLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Debug uchun qo'shilgan console.log'lar (comment bilan)
  const debugPatterns = [
    /\/\/ DEBUG:.*console\.log.*\n/g,
    /\/\/ TODO:.*console\.log.*\n/g,
    /\/\/ TEMP:.*console\.log.*\n/g,
    /console\.log\s*\(\s*['"`]DEBUG:.*?\);\s*\n/g,
    /console\.log\s*\(\s*['"`]TODO:.*?\);\s*\n/g,
    /console\.log\s*\(\s*['"`]TEMP:.*?\);\s*\n/g
  ];
  
  for (const pattern of debugPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Asosiy cleanup funksiyasi
async function cleanupConsoleLogs() {
  try {
    logger.info('🧹 Console.log cleanup boshlandi...');
    
    const serverFiles = findFiles(path.join(__dirname, '..'), '.js');
    const clientFiles = findFiles(path.join(__dirname, '../../client/src'), '.js');
    
    let totalFiles = 0;
    let changedFiles = 0;
    let removedDebugFiles = 0;
    
    // Server fayllarini tozalash
    logger.info(`📂 ${serverFiles.length} ta server fayl tekshirilmoqda...`);
    for (const file of serverFiles) {
      totalFiles++;
      
      // Console.log'larni almashtirish
      if (replaceConsoleLogs(file)) {
        changedFiles++;
        logger.debug(`✅ Console.log'lar almashtirildi: ${path.relative(process.cwd(), file)}`);
      }
      
      // Debug log'larni o'chirish
      if (removeDebugLogs(file)) {
        removedDebugFiles++;
        logger.debug(`🗑️ Debug log'lar o'chirildi: ${path.relative(process.cwd(), file)}`);
      }
    }
    
    // Client fayllarini tozalash (faqat debug log'lar)
    logger.info(`📂 ${clientFiles.length} ta client fayl tekshirilmoqda...`);
    for (const file of clientFiles) {
      totalFiles++;
      
      if (removeDebugLogs(file)) {
        removedDebugFiles++;
        logger.debug(`🗑️ Debug log'lar o'chirildi: ${path.relative(process.cwd(), file)}`);
      }
    }
    
    logger.info('✅ Console.log cleanup yakunlandi!');
    logger.info(`📊 Natijalar:`);
    logger.info(`   - Jami tekshirilgan fayllar: ${totalFiles}`);
    logger.info(`   - Console.log almashtirilgan fayllar: ${changedFiles}`);
    logger.info(`   - Debug log'lar o'chirilgan fayllar: ${removedDebugFiles}`);
    
  } catch (error) {
    logger.error('❌ Console.log cleanup xatoligi:', error);
    throw error;
  }
}

// Script to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  cleanupConsoleLogs()
    .then(() => {
      logger.info('🎉 Cleanup muvaffaqiyatli yakunlandi!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Cleanup xatoligi:', error);
      process.exit(1);
    });
}

module.exports = { cleanupConsoleLogs };
