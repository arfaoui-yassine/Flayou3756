# Setup script for Tunisia B2B Insights API Backend (Windows PowerShell)

Write-Host "🚀 Setting up Tunisia B2B Insights API Backend..." -ForegroundColor Green

# Check Python version
$pythonVersion = python --version 2>&1
Write-Host "✓ Python version: $pythonVersion" -ForegroundColor Cyan

# Create virtual environment
Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
python -m venv .venv

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "⬆️  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Create models directory
Write-Host "📁 Creating models directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path models -Force | Out-Null

# Copy example env file
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env and add your API keys" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend\.env and add your LLM API key (optional)"
Write-Host "2. Run: .\.venv\Scripts\Activate.ps1"
Write-Host "3. Run: uvicorn app.main:app --reload"
Write-Host "4. Visit: http://localhost:8000/docs"
