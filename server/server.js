const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize, syncDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const districtsRoutes = require('./routes/districts');
const neighborhoodsRoutes = require('./routes/neighborhoods');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const reportsRoutes = require('./routes/reports');
const technicsRoutes = require('./routes/vehicles');
const fuelStationsRoutes = require('./routes/fuel-stations');
const dailyWorkStatusRoutes = require('./routes/daily-work-status');
const workStatusReasonsRoutes = require('./routes/work-status-reasons');
const employeesRoutes = require('./routes/employees');

// Database backup middleware
const { criticalBackup, scheduleDailyBackup } = require('./middleware/database-backup');
const dbManager = require('./utils/database-manager');

const app = express();
const PORT = process.env.PORT || 8000; // Port konfliktini oldini olish

// Xavfsizlik middleware
app.use(helmet());

// Rate limiting (development uchun yumshatilgan)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 daqiqa
  max: 1000, // har bir IP dan maksimal 1000 ta so'rov
  message: {
    error: 'Juda ko\'p so\'rov yuborildi, iltimos biroz kuting'
  },
  skip: (req) => {
    // Development modeda rate limiting ni o'chirish
    return process.env.NODE_ENV === 'development';
  }
});
app.use('/api/', limiter);

// CORS sozlamalari
app.use(cors({
  origin: function (origin, callback) {
    // Development modeda barcha originlarga ruxsat berish
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    // Production uchun aniq URL'lar
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'];
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static fayllar uchun
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server ishlamoqda',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API ishlamoqda!',
    timestamp: new Date().toISOString()
  });
});

// Database backup middleware (muhim operatsiyalar uchun)
app.use('/api', criticalBackup);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/neighborhoods', neighborhoodsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/technics', technicsRoutes);
app.use('/api/fuel-stations', fuelStationsRoutes);
app.use('/api/daily-work-status', dailyWorkStatusRoutes);
app.use('/api/work-status-reasons', workStatusReasonsRoutes);
app.use('/api/employees', employeesRoutes);

// 206 Xisobot routes
const tripSheetsRoutes = require('./routes/trip-sheets');
const disposalSitesRoutes = require('./routes/disposal-sites');
app.use('/api/trip-sheets', tripSheetsRoutes);
app.use('/api/disposal-sites', disposalSitesRoutes);

// Database management endpoints
app.get('/api/admin/db/status', async (req, res) => {
  try {
    const health = await dbManager.checkDatabaseHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/db/backups', async (req, res) => {
  try {
    const backups = dbManager.getBackupList();
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/db/backup', async (req, res) => {
  try {
    const { reason } = req.body;
    const backupFile = await dbManager.createBackup(reason || 'manual_api');
    res.json({ 
      message: 'Backup muvaffaqiyatli yaratildi',
      backup_file: backupFile 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/db/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = dbManager.getChangeLog(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint topilmadi',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔥 Server xatoligi:', error);
  
  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      error: 'Ma\'lumotlar validatsiyasi xatoligi',
      details: errors
    });
  }
  
  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Bu ma\'lumot allaqachon mavjud',
      field: error.errors[0]?.path
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Yaroqsiz token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token muddati tugagan'
    });
  }
  
  // Default error
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Ichki server xatoligi' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Serverni ishga tushirish
const startServer = async () => {
  try {
    // Ma'lumotlar bazasiga ulanish
    await sequelize.authenticate();
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');
    
    // Ma'lumotlar bazasini sinxronlash
    await syncDatabase(process.env.DB_FORCE_SYNC === 'true');
    
    // Serverni ishga tushirish
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portda ishlamoqda`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      
      // Server ishga tushganda birinchi backup yaratish
      dbManager.createBackup('server_startup')
        .then(backupFile => {
          console.log(`📦 Dastlabki backup yaratildi: ${backupFile}`);
        })
        .catch(error => {
          console.error('❌ Dastlabki backup xatoligi:', error);
        });
      
      // Kunlik avtomatik backup rejalashtirish
      scheduleDailyBackup();
      console.log('⏰ Kunlik avtomatik backup rejalashtirildi');
    });
    
  } catch (error) {
    console.error('❌ Serverni ishga tushirishda xatolik:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal qabul qilindi, server yopilmoqda...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal qabul qilindi, server yopilmoqda...');
  process.exit(0);
});

startServer();

module.exports = app;
