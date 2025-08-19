const { sequelize } = require('../config/database');

async function addTozamakonIdColumn() {
  try {
    // Check if column exists
    const [results] = await sequelize.query(`
      PRAGMA table_info(neighborhoods);
    `);
    
    const hasColumn = results.some(column => column.name === 'tozamakon_id');
    
    if (!hasColumn) {
      console.log('Adding tozamakon_id column to neighborhoods table...');
      await sequelize.query(`
        ALTER TABLE neighborhoods ADD COLUMN tozamakon_id VARCHAR(50);
      `);
      console.log('Column added successfully!');
    } else {
      console.log('Column tozamakon_id already exists');
    }
  } catch (error) {
    console.error('Error adding column:', error);
  }
}

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    await addTozamakonIdColumn();
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
