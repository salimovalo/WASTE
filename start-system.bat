@echo off
echo.
echo ========================================
echo  TIZIMNI ISHGA TUSHIRISH
echo ========================================
echo.

echo [1/3] Node jarayonlarini to'xtatish...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/3] Server'ni ishga tushirish...
cd server
start /B cmd /c "npm start"
timeout /t 5 >nul

echo [3/3] Client'ni ishga tushirish...
cd ../client
start cmd /c "npm start"

echo.
echo ✅ TIZIM ISHGA TUSHIRILDI!
echo.
echo Server: http://localhost:8000
echo Client: http://localhost:3000
echo.
echo Browser avtomatik ochiladi...
echo.
pause




