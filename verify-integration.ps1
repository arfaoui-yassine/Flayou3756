# Integration Verification Script (PowerShell)
# Verifies that both backend and frontend are properly configured

Write-Host "Tunisia B2B Insights - Integration Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check if backend is running
Write-Host "1. Checking Backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "OK Backend is running" -ForegroundColor Green
    Write-Host "   Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR Backend is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: cd backend; python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# Check backend stats endpoint
Write-Host "2. Checking Backend Data..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/stats" -Method Get -ErrorAction Stop
    Write-Host "OK Backend data accessible" -ForegroundColor Green
    Write-Host "   Total consumer records: $($stats.total_records)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR Cannot access backend data" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check if frontend files exist
Write-Host "3. Checking Frontend Files..." -ForegroundColor Yellow
if (Test-Path "frontend\.env.local") {
    Write-Host "OK frontend\.env.local exists" -ForegroundColor Green
    $envContent = Get-Content "frontend\.env.local" -Raw
    if ($envContent -match "VITE_API_BASE_URL=(.+)") {
        Write-Host "   API URL: $($matches[1])" -ForegroundColor Gray
    }
} else {
    Write-Host "ERROR frontend\.env.local missing" -ForegroundColor Red
    Write-Host "   Creating it now..." -ForegroundColor Gray
    "VITE_API_BASE_URL=http://localhost:8000" | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    Write-Host "OK Created frontend\.env.local" -ForegroundColor Green
}

Write-Host ""

# Check if frontend dependencies are installed
Write-Host "4. Checking Frontend Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "OK Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "WARNING Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend; npm install" -ForegroundColor Gray
}

Write-Host ""

# Check if frontend is running
Write-Host "5. Checking Frontend Server..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK Frontend is running" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray
} catch {
    Write-Host "WARNING Frontend is NOT running" -ForegroundColor Yellow
    Write-Host "   Start it with: cd frontend; npm run dev" -ForegroundColor Gray
}

Write-Host ""

# Test API integration
Write-Host "6. Testing API Integration..." -ForegroundColor Yellow
try {
    $body = @{
        question = "test"
        output_language = "fr"
        filters = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/insights/query" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 120 `
        -ErrorAction Stop

    if ($response.storytelling) {
        Write-Host "OK API integration working" -ForegroundColor Green
        Write-Host "   Response time: $($response.trace.latency_ms)ms" -ForegroundColor Gray
    } else {
        Write-Host "ERROR API returned invalid response" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "ERROR API request failed: $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Integration Status Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Summary
if ($allGood) {
    Write-Host "INTEGRATION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open http://localhost:5173 in your browser" -ForegroundColor Gray
    Write-Host "   2. Try asking: Quels sont les segments actifs?" -ForegroundColor Gray
    Write-Host "   3. Check the test page: http://localhost:5173/src/test-integration.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "   - Frontend: frontend\INTEGRATION_README.md" -ForegroundColor Gray
    Write-Host "   - Backend: BACKEND_FRONTEND_INTEGRATION_COMPLETE.md" -ForegroundColor Gray
    Write-Host "   - Quick Start: QUICKSTART_FULLSTACK.md" -ForegroundColor Gray
} else {
    Write-Host "INTEGRATION INCOMPLETE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above and run this script again" -ForegroundColor Yellow
}

Write-Host ""
