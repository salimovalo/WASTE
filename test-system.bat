@echo off
echo ========================================
echo   TIZIM TESTI
echo   System Testing
echo ========================================
echo.

:: Server health check
echo [1/5] Server health check...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Server ishlayapti
    curl -s http://localhost:8000/health
) else (
    echo ❌ Server javob bermayapti!
    echo Iltimos start-app.bat ni ishga tushiring
)
echo.

:: API test
echo [2/5] API test...
curl -s http://localhost:8000/api/test >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ API ishlayapti
) else (
    echo ❌ API javob bermayapti!
)
echo.

:: Client check
echo [3/5] Client application...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Client ishlayapti
) else (
    echo ⚠️ Client javob bermayapti
    echo Iltimos start-app.bat ni ishga tushiring
)
echo.

:: Database check
echo [4/5] Database connection...
cd server >nul 2>&1
node -e "require('./config/database').testConnection().then(()=>process.exit(0)).catch(()=>process.exit(1))" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Database ulanish muvaffaqiyatli
) else (
    echo ❌ Database ulanish xatoligi!
)
cd .. >nul 2>&1
echo.

:: Memory usage
echo [5/5] Xotira holati:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value | findstr "="
echo.

echo ========================================
echo   Test tugadi!
echo   Barcha tizimlar ishlashi kerak ✅
echo ========================================
pause












