# Script to start servers and run integration tests
$ErrorActionPreference = 'Continue'

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 SAFECLOUD Integration Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Start Backend
Write-Host "`n📦 Starting backend..." -ForegroundColor Yellow
Push-Location "c:\Users\mllan\Desktop\SAFECLOUD\backend"
$backendProc = Start-Process python -ArgumentList "manage.py", "runserver", "0.0.0.0:8000" -PassThru
Write-Host "✅ Backend PID: $($backendProc.Id)" -ForegroundColor Green
Pop-Location

# Wait for backend to be ready
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check if backend is running
$backendRunning = Get-Process -Id $backendProc.Id -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "✅ Backend is running" -ForegroundColor Green
} else {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    exit 1
}

# Run integration tests
Write-Host "`n🧪 Running integration tests..." -ForegroundColor Yellow
Push-Location "c:\Users\mllan\Desktop\SAFECLOUD\backend"
$env:PYTHONIOENCODING = 'utf-8'
python test_integration.py
$testResult = $LASTEXITCODE
Pop-Location

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue

Write-Host "`n================================" -ForegroundColor Cyan
if ($testResult -eq 0) {
    Write-Host "✅ Integration Tests Completed Successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Integration Tests Failed" -ForegroundColor Red
}
Write-Host "================================" -ForegroundColor Cyan

exit $testResult
