@echo off
echo ========================================
echo   DEPENDENCIES INSTALLATION
echo   Paketlarni o'rnatish
echo ========================================
echo.

:: Server dependencies
echo [1/2] Server paketlarini o'rnatish...
cd server
call npm install
echo Server paketlari o'rnatildi!
echo.

:: Client dependencies
echo [2/2] Client paketlarini o'rnatish...
cd ../client
call npm install
echo Client paketlari o'rnatildi!
echo.

cd ..
echo ========================================
echo   Barcha paketlar muvaffaqiyatli o'rnatildi!
echo ========================================
pause


