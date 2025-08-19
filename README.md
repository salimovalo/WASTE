# O'zbekiston Chiqindilarni Boshqarish Tizimi

Bu loyiha O'zbekistondagi chiqindilarni boshqarish tizimini raqamlashtirish uchun yaratilgan. Tizim web-based interaktiv platforma sifatida ishlab chiqilgan va bir nechta modul va bo'limlardan tashkil topgan.

## 📋 Tizim tavsifi

Tizim Toshkent viloyatidagi ikta korxona uchun mo'ljallangan:
- **ANGREN BUNYOD FAYZ** - Nurafshon, Olmaliq, Oxangaron tumanlariga xizmat ko'rsatadi
- **ZERO WASTE** - Angren, Parkent, Yuqorichirchiq tumanlariga xizmat ko'rsatadi

## 🏗️ Tizim modullar

1. **Jismoniy shaxslar** - uy xo'jaliklari uchun chiqindi yig'ish xizmatlari
2. **Yuridik shaxslar** - korxonalar uchun shartnoma asosida xizmat
3. **Texnikalar** - transport vositalari va yoqilg'i boshqaruvi
4. **Xizmat sifati** - maxallalar xizmati va sifat nazorati
5. **Xodimlar** - kadrlar boshqaruvi va KPI
6. **Xisobotlar** - barcha modullardan umumiy hisobotlar
7. **Sozlamalar** - tizim konfiguratsiyasi
8. **Super Admin** - tizim boshqaruvi (korxonalar, tumanlar, foydalanuvchilar)

## 🚀 Texnologiyalar

### Backend
- **Node.js** - server muhit
- **Express.js** - web framework
- **PostgreSQL** - ma'lumotlar bazasi
- **Sequelize** - ORM
- **JWT** - autentifikatsiya
- **bcryptjs** - parol shifrlash

### Frontend
- **React 18** - UI library
- **Ant Design** - UI komponentlar
- **React Router** - routing
- **Zustand** - state management
- **React Query** - server state
- **Axios** - HTTP client

## 📦 O'rnatish va ishga tushirish

### 1. Loyihani yuklab olish
```bash
git clone [repository-url]
cd "7 ultra1"
```

### 2. Dependencies o'rnatish
```bash
# Root directory da
npm install

# Backend dependencies
npm run install-server

# Frontend dependencies
npm run install-client
```

### 3. Ma'lumotlar bazasini sozlash

PostgreSQL o'rnatilgan bo'lishi kerak. Keyin ma'lumotlar bazasi yarating:

```sql
CREATE DATABASE waste_management;
CREATE USER waste_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE waste_management TO waste_user;
```

### 4. Environment o'zgaruvchilarini sozlash

Server papkasida `.env` fayl yarating:

```env
# Ma'lumotlar bazasi
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waste_management
DB_USER=waste_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Ma'lumotlar bazasini yaratish va to'ldirish

```bash
cd server

# Ma'lumotlar bazasini yaratish
npm run db:migrate

# Demo ma'lumotlar bilan to'ldirish
npm run db:seed
```

### 6. Serverni ishga tushirish

```bash
# Root directory da - ikkalasini birga ishga tushiradi
npm run dev

# Yoki alohida ishga tushirish
npm run server  # Backend (port 5000)
npm run client  # Frontend (port 3000)
```

## 👤 Kirish ma'lumotlari

Seed operatsiyasidan keyin quyidagi foydalanuvchilar yaratiladi:

### Super Administrator
- **Username:** admin
- **Password:** admin123
- **Ruxsatlar:** Barcha tizimga to'liq ruxsat

### Korxona Administratorlari
**ANGREN BUNYOD FAYZ:**
- **Username:** abf_admin
- **Password:** abf123

**ZERO WASTE:**
- **Username:** zw_admin
- **Password:** zw123

### Operator
- **Username:** operator1
- **Password:** op123
- **Korxona:** ANGREN BUNYOD FAYZ
- **Tuman:** Nurafshon

## 🔐 Ruxsatlar tizimi

Tizimda role-based access control (RBAC) amalga oshirilgan:

1. **Super Admin** - barcha modullar va korxonalarga ruxsat
2. **Company Admin** - o'z korxonasi doirasida barcha ruxsatlar
3. **District Manager** - tuman darajasida boshqaruv
4. **Operator** - ma'lumot kiritish ruxsatlari
5. **Driver** - faqat transport ma'lumotlarini ko'rish

## 📊 Ma'lumotlar strukturasi

### Asosiy jadvalar:
- `companies` - korxonalar
- `districts` - tumanlar
- `neighborhoods` - maxallalar
- `users` - foydalanuvchilar
- `roles` - rollar
- `daily_household_collection` - jismoniy shaxslar kunlik ma'lumotlari
- `legal_entities` - yuridik shaxslar
- `contracts` - shartnomalar
- `vehicles` - transport vositalari
- `service_quality_assessments` - xizmat sifati baholari

### Ma'lumotlar yaxlitligi:
- Foreign key constraints
- Validatsiya qoidalari
- Audit logging
- Soft delete

## 🌐 API Endpoints

### Autentifikatsiya
- `POST /api/auth/login` - tizimga kirish
- `GET /api/auth/profile` - profil ma'lumotlari
- `PUT /api/auth/change-password` - parol o'zgartirish

### Korxonalar
- `GET /api/companies` - barcha korxonalar
- `POST /api/companies` - yangi korxona yaratish
- `PUT /api/companies/:id` - korxonani yangilash

### Tumanlar
- `GET /api/districts` - tumanlar ro'yxati
- `POST /api/districts` - yangi tuman yaratish
- `GET /api/districts/:id/stats` - tuman statistikasi

### Foydalanuvchilar
- `GET /api/users` - foydalanuvchilar ro'yxati
- `POST /api/users` - yangi foydalanuvchi yaratish
- `PUT /api/users/:id` - foydalanuvchini yangilash

## 🔧 Development

### Code Structure
```
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   └── migrations/        # Database seeds
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   └── services/      # API services
└── package.json
```

### Development Commands
```bash
# Backend development
cd server && npm run dev

# Frontend development
cd client && npm start

# Database reset
cd server && npm run db:seed

# Linting
npm run lint

# Testing
npm test
```

## 📈 Keyingi bosqichlar

Hozirda asosiy tizim strukturasi yaratildi. Keyingi bosqichlarda quyidagilar amalga oshiriladi:

1. ✅ Ma'lumotlar bazasi arxitekturasi
2. ✅ Backend API strukturasi
3. ✅ Autentifikatsiya va avtorizatsiya
4. ✅ Frontend asosiy strukturasi
5. 🔄 Super Admin moduli
6. 🔄 Jismoniy shaxslar moduli
7. 🔄 Yuridik shaxslar moduli
8. 🔄 Texnikalar moduli
9. 🔄 Xizmat sifati moduli
10. 🔄 Xodimlar moduli
11. 🔄 Xisobotlar moduli
12. 🔄 Sozlamalar moduli

## 🐛 Debug va xatoliklarni hal qilish

### Ma'lumotlar bazasi bilan bog'liq muammolar:
```bash
# Database connection test
cd server && node -e "require('./config/database').testConnection()"

# Reset database
cd server && npm run db:seed
```

### Frontend build muammo:
```bash
cd client && npm run build
```

### Port band bo'lsa:
```bash
# Kill processes on ports
npx kill-port 3000
npx kill-port 5000
```

## 📞 Yordam

Tizim haqida savollar yoki muammolar bo'lsa, development team bilan bog'laning.

## 📄 License

Bu loyiha proprietary license ostida. Faqat ruxsat berilgan foydalanuvchilar uchun mo'ljallangan.

---

**O'zbekiston Chiqindilarni Boshqarish Tizimi** © 2024
