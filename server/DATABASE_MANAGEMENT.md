# 🛡️ Ma'lumotlar bazasi boshqaruv tizimi

Bu hujjat waste management sistemining mustahkam ma'lumotlar bazasi boshqaruv tizimini batafsil tushuntiradi.

## 📋 Tizim xususiyatlari

### 🔧 Avtomatik backup tizimi
- **Har bir muhim operatsiya oldidan** avtomatik backup yaratiladi
- **Kunlik avtomatik backup** (har kuni soat 02:00 da)
- **Server ishga tushganda** dastlabki backup
- **Manual backup** yaratish imkoniyati

### 📊 To'liq monitoring va logging
- Barcha o'zgarishlar jurnalga yoziladi
- API so'rovlari va foydalanuvchi amallarini kuzatish
- Database holatini tekshirish
- Constraint va ma'lumotlar tutashligini nazorat qilish

### ⚡ Tezkor tiklash (Rollback)
- Bir buyruq bilan eng oxirgi backupga qaytarish
- Istalgan backupni tanlash va tiklash
- Backup oldidan avtomatik himoya backup yaratish

### 🗜️ Optimizatsiya va mustahkamlash
- Database indexlari avtomatik yaratiladi
- Tezlikni oshirish uchun maxsus sozlamalar
- Ma'lumotlar tutashligi tekshiruvi
- Foreign key constraintlar

## 🚀 Buyruqlar ro'yxati

### NPM Scripts (tavsiya qilinadi)
```bash
# Database holati
npm run db:status

# Backup yaratish
npm run db:backup

# Backuplar ro'yxati
npm run db:list

# Tezkor rollback
npm run db:rollback

# O'zgarishlar jurnali
npm run db:log

# Database tarkibini ko'rish
npm run db:inspect

# Database mustahkamlash
npm run db:strengthen

# Eski backuplarni tozalash
npm run db:clean
```

### To'liq buyruqlar
```bash
# Ma'lumotlar bazasi holati va statistika
node scripts/db-manager.js status

# Manual backup yaratish
node scripts/db-manager.js backup "sabab_nomi"

# Backupni tiklash
node scripts/db-manager.js restore database_backup_2025-01-15T10-30-00-000Z.sqlite

# Barcha backuplar ro'yxati
node scripts/db-manager.js list

# Tezkor rollback (eng oxirgi backup)
node scripts/db-manager.js rollback

# O'zgarishlar jurnali (oxirgi 50 ta)
node scripts/db-manager.js log 50

# Eski backuplarni tozalash (faqat 10 ta eng yangi qoldirish)
node scripts/db-manager.js clean 10

# Database tarkibini batafsil ko'rish
node scripts/inspect-data.js

# Database mustahkamlash va optimizatsiya
node scripts/strengthen-database.js
```

## 📦 Backup tizimi tafsilotlari

### Avtomatik backup yaratish holatlari:
1. **Server ishga tushganda** - `server_startup`
2. **Kompaniya operatsiyalari** - `CRITICAL_POST_companies`, `CRITICAL_PUT_companies`, etc.
3. **Tumanlar operatsiyalari** - `CRITICAL_POST_districts`, `CRITICAL_DELETE_districts`, etc.
4. **Maxallalar operatsiyalari** - `CRITICAL_POST_neighborhoods`, etc.
5. **Foydalanuvchilar operatsiyalari** - `CRITICAL_POST_users`, etc.
6. **Kunlik avtomatik** - `daily_auto` (har kuni soat 02:00)
7. **Migration oldidan** - `before_migration_[migration_name]`

### Backup fayl nomi formati:
```
database_backup_2025-08-13T07-20-26-167Z.sqlite
```

### Backup papkasi:
```
server/backups/
```

## 📈 Monitoring va logging

### Log fayli:
```
server/logs/database-changes.log
```

### Log entry format:
```json
{
  "timestamp": "2025-08-13T07:20:26.168Z",
  "action": "BACKUP_CREATED",
  "details": {
    "reason": "strengthen_database",
    "backup_file": "database_backup_2025-08-13T07-20-26-167Z.sqlite",
    "size": 151552
  },
  "user": "system"
}
```

### Kuzatiladigan amallar:
- `BACKUP_CREATED` - Backup yaratildi
- `BACKUP_RESTORED` - Backup tiklandi
- `BACKUP_CLEANUP` - Eski backuplar tozalandi
- `MIGRATION_STARTED` - Migration boshlandi
- `MIGRATION_COMPLETED` - Migration yakunlandi
- `MIGRATION_FAILED` - Migration xatoligi
- `DATABASE_STRENGTHENED` - Database mustahkamlandi
- `API_REQUEST` - API so'rovi

## 🔧 API Endpoints

Database management uchun maxsus API endpoints:

```bash
# Database holati
GET /api/admin/db/status

# Backuplar ro'yxati
GET /api/admin/db/backups

# Manual backup yaratish
POST /api/admin/db/backup
{
  "reason": "manual_api_backup"
}

# O'zgarishlar jurnali
GET /api/admin/db/logs?limit=50
```

## 💡 Eng yaxshi amaliyotlar

### 1. Backup yaratish
```bash
# Muhim operatsiya oldidan
npm run db:backup "yangi_funksiya_qoshildi"

# Har hafta manual backup
npm run db:backup "haftalik_backup"
```

### 2. Rollback amaliyoti
```bash
# Tezkor rollback (eng oxirgi backup)
npm run db:rollback

# Yoki aniq backup tanlash
npm run db:list
npm run db:restore database_backup_2025-08-13T07-18-01-248Z.sqlite
```

### 3. Database tekshirish
```bash
# Umumiy holat
npm run db:status

# Batafsil tarkib
npm run db:inspect

# O'zgarishlar tarixi
npm run db:log
```

### 4. Backup tozalash
```bash
# 30 ta eng yangi backup qoldirish
npm run db:clean 30
```

## 🛡️ Xavfsizlik xususiyatlari

### 1. Avtomatik himoya
- Har qanday tiklash oldidan joriy holatni backup qilish
- Foreign key constraintlar yoqilgan
- Ma'lumotlar tutashligi tekshiruvi

### 2. Xatoliklardan himoya
- Database operatsiyalari transaksiyada bajariladi
- Xatolik bo'lsa avtomatik rollback
- Barcha xatoliklar log qilinadi

### 3. Ruxsatlar
- Faqat super_admin API endpoints ga kirish imkoniyati
- Faqat server admin terminal buyruqlari

## 📊 Database optimizatsiyasi

### Yaratilgan indexlar:
- Companies: code, inn, is_active
- Districts: company_id, code, is_active  
- Neighborhoods: district_id, code, tozamakon_id, type, is_active
- Users: username, email, role_id, company_id, is_active
- Roles: name

### SQLite sozlamalari:
- WAL mode (Write-Ahead Logging)
- Optimallashgan cache va memory settings
- Foreign key constraints yoqilgan

## 🚨 Favqulodda vaziyatlar

### Agar database buzilsa:
```bash
# 1. Eng oxirgi backupni tiklash
npm run db:rollback

# 2. Yoki aniq backup tanlash
npm run db:list
npm run db:restore [backup_fayl_nomi]

# 3. Database holatini tekshirish
npm run db:status
npm run db:inspect
```

### Agar backup yo'q bo'lsa:
```bash
# Database tutashligini tekshirish
npm run db:status

# Mustahkamlash va tiklash
npm run db:strengthen
```

## 📞 Yordam

Database bilan bog'liq muammolar uchun:

1. **Birinchi qadam**: `npm run db:status` ishga tushiring
2. **Ikkinchi qadam**: `npm run db:log` oxirgi o'zgarishlarni ko'ring
3. **Uchinchi qadam**: Agar kerak bo'lsa `npm run db:rollback` bajaring

---

**Diqqat**: Database operatsiyalari jiddiy amallardir. Har doim backup yaratib oling va ehtiyotkorlik bilan ishlang!
