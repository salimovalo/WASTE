@echo off
echo ========================================
echo   TIZIM TEKSHIRUVI
echo   System Check
echo ========================================
echo.

:: Node.js tekshirish
echo [1/5] Node.js versiyasi:
node --version
echo.

:: NPM tekshirish  
echo [2/5] NPM versiyasi:
npm --version
echo.

:: Database tekshirish
echo [3/5] Ma'lumotlar bazasi:
if exist "server\database.sqlite" (
    echo SQLite database mavjud
    for %%A in (server\database.sqlite) do echo Hajmi: %%~zA bayt
) else (
    echo ⚠️ Database topilmadi! init-database.bat ni ishga tushiring
)
echo.

:: Port 8000 tekshirish
echo [4/5] Port 8000 holati:
netstat -ano | findstr :8000 >nul
if %errorlevel% == 0 (
    echo ✅ Port 8000 band (server ishlab turibdi)
) else (
    echo ℹ️ Port 8000 bo'sh
)
echo.

:: Port 3000 tekshirish
echo [5/5] Port 3000 holati:
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo ✅ Port 3000 band (client ishlab turibdi)
) else (
    echo ℹ️ Port 3000 bo'sh
)
echo.

echo ========================================
echo   Tekshiruv tugadi!
echo ========================================
pause


