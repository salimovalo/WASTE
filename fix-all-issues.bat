@echo off
echo.
echo ========================================
echo  BARCHA MUAMMOLARNI TUZATISH
echo ========================================
echo.

echo 1. Environment faylini yaratish...
if not exist "server\.env" (
    copy "server\config\env-example.txt" "server\.env"
    echo ✅ .env fayl yaratildi
) else (
    echo ⚠️  .env fayl allaqachon mavjud
)

echo.
echo 2. Dependencies o'rnatish...
call install-dependencies.bat

echo.
echo 3. Database schema'ni tuzatish...
cd server
node scripts\fix-database-schema.js
cd ..

echo.
echo 4. Database'ni yangilash...
cd server
node scripts\init-database.js
cd ..

echo.
echo 5. Portlarni tozalash...
echo Portlarni tozalash...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a 2>nul

echo.
echo 6. Tizimni test qilish...
call test-system.bat

echo.
echo ========================================
echo  BARCHA TUZATISHLAR YAKUNLANDI!
echo ========================================
echo.
echo Keyingi qadamlar:
echo 1. server\.env faylida JWT_SECRET'ni o'zgartiring
echo 2. Admin parolini o'zgartiring
echo 3. start-app.bat orqali tizimni ishga tushiring
echo.
pause
