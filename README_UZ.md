# 🗑️ Chiqindilarni Boshqarish Tizimi

## 📋 Tizim haqida
Chiqindilarni boshqarish bo'yicha keng qamrovli veb-ilova. Tizim transport vositalari, xodimlar, yoqilg'i iste'moli va kunlik hisobotlarni boshqarish imkoniyatini beradi.

## 🚀 O'rnatish va Ishga tushirish

### 1️⃣ Birinchi marta o'rnatish
```bash
# Barcha kerakli paketlarni o'rnatish
install-dependencies.bat
```

### 2️⃣ Tizimni ishga tushirish
```bash
# Server va clientni bir vaqtda ishga tushirish
start-app.bat
```

### 3️⃣ Alohida ishga tushirish
```bash
# Server (backend)
cd server
npm run dev

# Client (frontend) - yangi terminalda
cd client
npm start
```

## 🔗 Manzillar
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/health

## 👤 Kirish ma'lumotlari (test)
- **Login**: admin
- **Parol**: admin123

## 📁 Proyekt tuzilishi
```
├── client/          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Node.js backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── start-app.bat    # Tizimni ishga tushirish
└── install-dependencies.bat  # Paketlarni o'rnatish
```

## 🛠️ Texnologiyalar
### Frontend
- React 18.2
- Ant Design 5.12
- Axios
- React Router v6
- Zustand (state management)

### Backend  
- Node.js & Express
- Sequelize ORM
- SQLite database
- JWT authentication
- Helmet & CORS security

## 📊 Asosiy funksiyalar
- ✅ Foydalanuvchilar boshqaruvi
- ✅ Transport vositalari monitoring
- ✅ Kunlik ish holati
- ✅ Yoqilg'i iste'moli hisoboti
- ✅ Xodimlar tabel hisobi
- ✅ Yo'l varaqalari
- ✅ Chiqindixonalar ro'yxati
- ✅ Statistika va tahlillar

## 🔧 Ma'lumotlar bazasi
```bash
# Backup yaratish
cd server
npm run db:backup

# Backup'dan tiklash
npm run db:restore
```

## 📝 Muhim buyruqlar
```bash
# Server loglarini ko'rish
cd server
npm run pm2:logs

# Ma'lumotlar bazasi migratsiyalari
npm run db:migrate

# Test ma'lumotlarini yuklash
npm run db:seed
```

## ⚠️ Muammolar va yechimlar

### Port band bo'lsa
```bash
# Windows uchun portni bo'shatish
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Node modules xatoligi
```bash
# Tozalash va qayta o'rnatish
rd /s /q server\node_modules client\node_modules
install-dependencies.bat
```

## 📞 Qo'llab-quvvatlash
Muammo yoki savol bo'lsa, administrator bilan bog'laning.

## 📄 Litsenziya
© 2024 Chiqindilarni Boshqarish Tizimi












