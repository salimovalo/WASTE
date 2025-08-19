@echo off
echo ============================================
echo   Chiqindilarni Boshqarish Tizimi Server
echo ============================================
echo.

REM PM2 orqali serverni ishga tushirish
echo [1/3] PM2 orqali serverni ishga tushirish...
npm run pm2:start

echo.
echo [2/3] Server holati tekshirish...
timeout /t 3 /nobreak >nul
npm run pm2:status

echo.
echo [3/3] Server loglarini ko'rsatish...
echo Server log fayllar: logs/ papkasida
echo Live loglarni ko'rish uchun: npm run pm2:logs
echo Server monitoring uchun: npm run pm2:monit

echo.
echo ============================================
echo   Server ishga tushdi va kuzatilmoqda!
echo   Health check: http://localhost:5000/health
echo ============================================
pause


