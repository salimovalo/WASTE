# Server Barqarorligi va Boshqaruvi

Bu hujjat waste management server ni barqaror ishlatish va boshqarish uchun qo'llanma.

## 🚀 Server Ishga Tushirish

### 1. Oddiy rejim (Development)
```bash
npm run dev
# yoki
node server.js
```

### 2. Barqaror rejim (PM2 bilan)
```bash
# Barqaror serverni ishga tushirish
npm run pm2:start

# Yoki root papkadan
npm run server:stable
```

### 3. Windows PowerShell orqali
```powershell
# PowerShell script
.\start-server.ps1

# Yoki CMD/Batch
start-server.bat
```

## 📊 Server Monitoring

### Status tekshirish
```bash
npm run pm2:status          # PM2 status
npm run pm2:logs           # Live loglar
npm run pm2:monit          # Real-time monitoring
```

### Health Check
```bash
curl http://localhost:5000/health
```

JSON javob:
```json
{
  "status": "OK",
  "message": "Server va database ishlamoqda",
  "uptime": { "human": "2h 15m 30s" },
  "memory": { "used": "45 MB" },
  "database": "connected",
  "pid": 1234
}
```

## 🔄 Server Boshqaruvi

### To'xtatish va qayta ishga tushirish
```bash
npm run pm2:stop           # To'xtatish
npm run pm2:restart        # Qayta ishga tushirish
npm run pm2:reload         # Zero-downtime reload
npm run pm2:delete         # Butunlay o'chirish
```

### Loglarni ko'rish
```bash
npm run pm2:logs           # Live loglar
npm run pm2:flush          # Loglarni tozalash
```

## 🛡️ Barqarorlik Xususiyatlari

### 1. Auto-restart
- Server crash bo'lganda avtomatik qayta ishga tushadi
- Maximum 10 marta restart (keyingi 10 daqiqada)
- Minimum 10 soniya ishlab turishi kerak

### 2. Memory Management
- Maximum 1GB memory (keyin restart)
- Memory monitoring har 5 daqiqada
- Garbage collection optimization

### 3. Error Handling
- Uncaught exception handling
- Unhandled promise rejection logging
- Critical backup xatolikdan oldin

### 4. Graceful Shutdown
- SIGTERM/SIGINT signallarni to'g'ri handling
- Active connectionlarni yopish
- Database connectionlarni tozalash
- Final backup yaratish

### 5. Connection Tracking
- Faol connectionlarni kuzatish
- Connection pool management
- Memory leak prevention

## 📁 Log Fayllar

```
server/logs/
├── out.log        # Standart output
├── err.log        # Error loglar
└── combined.log   # Birlashgan loglar
```

## ⚙️ PM2 Ecosystem Configuration

`ecosystem.config.js` faylida:

```javascript
{
  name: 'waste-management-server',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  restart_delay: 4000,
  max_restarts: 10,
  min_uptime: '10s'
}
```

## 🔧 Troubleshooting

### Port band bo'lsa
```bash
# Port 5000 ni kim ishlatayotganini aniqlash
netstat -ano | findstr :5000

# Process ni o'chirish
taskkill /PID <PID> /F
```

### Database connection issues
```bash
# Database holatini tekshirish
npm run db:status

# Database ni strengthening
npm run db:strengthen
```

### Memory issues
```bash
# Memory usage ko'rish
npm run pm2:monit

# Server restart
npm run pm2:restart
```

## 📋 Maintenance Commands

### Database
```bash
npm run db:backup          # Backup yaratish
npm run db:restore         # Backup qaytarish
npm run db:status          # Database holati
npm run db:inspect         # Ma'lumotlarni ko'rish
```

### Logs
```bash
npm run pm2:flush          # Loglarni tozalash
npm run pm2:logs --lines 100  # Oxirgi 100 qator
```

## 🚨 Emergency Commands

### Server ishlamay qolsa
```bash
# 1. Process listini ko'rish
npm run pm2:status

# 2. Force restart
npm run pm2:delete
npm run pm2:start

# 3. Manual start
node server.js
```

### Database corruption
```bash
# 1. Backup qaytarish
npm run db:restore

# 2. Database consistency check
npm run db:strengthen
```

## 📈 Performance Optimization

### Production Settings
```bash
# Production rejimda ishga tushirish
NODE_ENV=production npm run pm2:start
```

### Monitoring Tools
- PM2 Monit: `npm run pm2:monit`
- Health endpoint: `/health`
- Database status: `/api/admin/db/status`

## 🔐 Security

### Process Security
- Non-root user bilan ishlatish tavsiya etiladi
- Environment variables orqali sensitive data
- Log files permission: 640

### Network Security
- Firewall: faqat kerakli portlar (5000, 3000)
- CORS: allowed origins configured
- Rate limiting: 100 req/15min per IP

## 💡 Best Practices

1. **Production da PM2 ishlatish**
2. **Log rotation sozlash**
3. **Regular backup (daily automated)**
4. **Health check monitoring**
5. **Memory va disk space monitoring**
6. **Update va maintenance window planning**


