@echo off
echo ========================================
echo   TIZIMNI TOZALAB QAYTA ISHGA TUSHIRISH
echo   Clean Restart System
echo ========================================
echo.

:: Node jarayonlarini to'xtatish
echo [1/3] Barcha Node.js jarayonlarini to'xtatish...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ Jarayonlar to'xtatildi
echo.

:: Portlarni tekshirish
echo [2/3] Portlarni tekshirish...
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️ Port 8000 hali band, tozalash...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️ Port 3000 hali band, tozalash...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)
echo ✅ Portlar tozalandi
echo.

:: Qayta ishga tushirish
echo [3/3] Tizimni qayta ishga tushirish...
timeout /t 2 /nobreak >nul

:: Serverga o'tish va ishga tushirish
echo Server ishga tushirilmoqda...
cd server
start cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

:: Clientga o'tish va ishga tushirish  
echo Client ishga tushirilmoqda...
cd ../client
start cmd /k "npm start"

echo.
echo ========================================
echo   ✅ Tizim qayta ishga tushirildi!
echo   Server: http://localhost:8000
echo   Client: http://localhost:3000
echo ========================================
timeout /t 3 /nobreak >nul


