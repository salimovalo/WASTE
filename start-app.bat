@echo off
echo ========================================
echo   CHIQINDILARNI BOSHQARISH TIZIMI
echo   Waste Management System Starting...
echo ========================================
echo.

:: Serverga o'tish va ishga tushirish
echo [1/2] Server ishga tushirilmoqda...
cd server
start cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

:: Clientga o'tish va ishga tushirish  
echo [2/2] Client ishga tushirilmoqda...
cd ../client
start cmd /k "npm start"

echo.
echo ========================================
echo   Tizim muvaffaqiyatli ishga tushirildi!
echo   Server: http://localhost:8000
echo   Client: http://localhost:3000
echo ========================================
echo.
echo Chiqish uchun istalgan tugmani bosing...
pause >nul







