const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Ma'lumotlar bazasi ulanishini tekshirish
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');
  } catch (error) {
    console.error('❌ Ma\'lumotlar bazasiga ulanishda xatolik:', error.message);
  }
};

module.exports = { sequelize, testConnection };
