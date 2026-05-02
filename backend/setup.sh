#!/bin/bash
# Setup script for Tunisia B2B Insights API Backend

echo "🚀 Setting up Tunisia B2B Insights API Backend..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv .venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create models directory
echo "📁 Creating models directory..."
mkdir -p models

# Copy example env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your LLM API key (optional)"
echo "2. Run: source backend/.venv/bin/activate"
echo "3. Run: uvicorn app.main:app --reload"
echo "4. Visit: http://localhost:8000/docs"
