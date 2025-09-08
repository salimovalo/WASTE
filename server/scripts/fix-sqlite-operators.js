const fs = require('fs');
const path = require('path');

// Fix all Op.iLike to Op.like for SQLite compatibility
const routesDir = path.join(__dirname, '..', 'routes');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace Op.iLike with Op.like
    content = content.replace(/\[Op\.iLike\]/g, '[Op.like]');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fix all route files
const files = fs.readdirSync(routesDir);
let fixedCount = 0;

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(routesDir, file);
    if (fixFile(filePath)) {
      fixedCount++;
    }
  }
});

console.log(`\n📊 Total: ${fixedCount} files fixed`);
console.log('✅ SQLite compatibility fix completed!');












