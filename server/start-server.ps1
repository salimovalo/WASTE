Write-Host "============================================" -ForegroundColor Green
Write-Host "   Chiqindilarni Boshqarish Tizimi Server" -ForegroundColor Green  
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# PM2 orqali serverni ishga tushirish
Write-Host "[1/4] Eski server jarayonlarini to'xtatish..." -ForegroundColor Yellow
try {
    npm run pm2:stop 2>$null
    npm run pm2:delete 2>$null
} catch {
    Write-Host "Eski jarayonlar topilmadi (normal holat)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/4] PM2 orqali yangi serverni ishga tushirish..." -ForegroundColor Yellow
npm run pm2:start

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[3/4] Server holati tekshirish..." -ForegroundColor Yellow
npm run pm2:status

Write-Host ""
Write-Host "[4/4] Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Server health: $($response.status)" -ForegroundColor Green
    Write-Host "📊 Memory: $($response.memory.used)" -ForegroundColor Cyan
    Write-Host "⏱️ Uptime: $($response.uptime.human)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Health check failed, server ishga tushmoqda..." -ForegroundColor Orange
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Server muvaffaqiyatli ishga tushdi!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Server URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔍 Health check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "📊 Monitoring: npm run pm2:monit" -ForegroundColor Cyan
Write-Host "📋 Loglar: npm run pm2:logs" -ForegroundColor Cyan
Write-Host "🛑 To'xtatish: npm run pm2:stop" -ForegroundColor Cyan
Write-Host ""

Write-Host "Loglarni kuzatish uchun Enter bosing..." -ForegroundColor Yellow
Read-Host
npm run pm2:logs


