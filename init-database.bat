@echo off
echo ========================================
echo   MA'LUMOTLAR BAZASINI SOZLASH
echo   Database Initialization
echo ========================================
echo.

cd server

:: Database initialization
echo Ma'lumotlar bazasi yaratilmoqda...
node scripts/init-database.js

echo.
echo ========================================
echo   Ma'lumotlar bazasi tayyor!
echo   Login: admin
echo   Parol: admin123
echo ========================================
pause







