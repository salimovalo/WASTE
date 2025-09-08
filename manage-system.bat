@echo off
:menu
cls
echo ╔══════════════════════════════════════════════╗
echo ║   CHIQINDILARNI BOSHQARISH TIZIMI           ║
echo ║   Waste Management System Manager           ║
echo ╔══════════════════════════════════════════════╝
echo.
echo   [1] 🚀 Tizimni ishga tushirish
echo   [2] 🔄 Qayta ishga tushirish (tozalab)
echo   [3] 🛑 Tizimni to'xtatish
echo   [4] 📊 Tizim holatini tekshirish
echo   [5] 🧪 API test
echo   [6] 📦 Dependencies o'rnatish
echo   [7] 🗄️ Database initialization
echo   [8] 💾 Database backup yaratish
echo   [9] 📝 Loglarni ko'rish
echo   [0] ❌ Chiqish
echo.
echo ════════════════════════════════════════════════
set /p choice="Tanlang (0-9): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto restart
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto check
if "%choice%"=="5" goto test
if "%choice%"=="6" goto install
if "%choice%"=="7" goto initdb
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto logs
if "%choice%"=="0" goto exit

echo.
echo ⚠️ Noto'g'ri tanlov! Qaytadan urinib ko'ring.
pause
goto menu

:start
echo.
echo 🚀 Tizim ishga tushirilmoqda...
call start-app.bat
pause
goto menu

:restart
echo.
echo 🔄 Tizim qayta ishga tushirilmoqda...
call restart-clean.bat
pause
goto menu

:stop
echo.
echo 🛑 Tizim to'xtatilmoqda...
taskkill /F /IM node.exe >nul 2>&1
echo ✅ Barcha jarayonlar to'xtatildi
pause
goto menu

:check
echo.
echo 📊 Tizim holati tekshirilmoqda...
call check-system.bat
pause
goto menu

:test
echo.
echo 🧪 API test boshlanmoqda...
call test-system.bat
pause
goto menu

:install
echo.
echo 📦 Dependencies o'rnatilmoqda...
call install-dependencies.bat
pause
goto menu

:initdb
echo.
echo 🗄️ Database initialization...
call init-database.bat
pause
goto menu

:backup
echo.
echo 💾 Database backup yaratilmoqda...
cd server
call npm run db:backup
cd ..
echo ✅ Backup yaratildi
pause
goto menu

:logs
echo.
echo 📝 Server loglari (oxirgi 50 qator):
echo ════════════════════════════════════════════════
type server\logs\combined.log | more
echo ════════════════════════════════════════════════
pause
goto menu

:exit
echo.
echo 👋 Xayr! Tizimdan chiqish...
exit












