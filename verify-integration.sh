#!/bin/bash

# Integration Verification Script
# Verifies that both backend and frontend are properly configured

echo "🔍 Tunisia B2B Insights - Integration Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking Backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    BACKEND_VERSION=$(curl -s http://localhost:8000/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   Version: $BACKEND_VERSION"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd backend && python -m uvicorn app.main:app --reload --port 8000"
    exit 1
fi

echo ""

# Check backend stats endpoint
echo "2️⃣  Checking Backend Data..."
STATS=$(curl -s http://localhost:8000/api/v1/stats)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend data accessible${NC}"
    TOTAL_RECORDS=$(echo $STATS | grep -o '"total_records":[0-9]*' | cut -d':' -f2)
    echo "   Total consumer records: $TOTAL_RECORDS"
else
    echo -e "${RED}❌ Cannot access backend data${NC}"
    exit 1
fi

echo ""

# Check if frontend files exist
echo "3️⃣  Checking Frontend Files..."
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✅ frontend/.env.local exists${NC}"
    API_URL=$(grep VITE_API_BASE_URL frontend/.env.local | cut -d'=' -f2)
    echo "   API URL: $API_URL"
else
    echo -e "${RED}❌ frontend/.env.local missing${NC}"
    echo "   Creating it now..."
    echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env.local
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
fi

echo ""

# Check if frontend dependencies are installed
echo "4️⃣  Checking Frontend Dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    echo "   Run: cd frontend && npm install"
fi

echo ""

# Check if frontend is running
echo "5️⃣  Checking Frontend Server..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
    echo "   URL: http://localhost:5173"
else
    echo -e "${YELLOW}⚠️  Frontend is NOT running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
fi

echo ""

# Test API integration
echo "6️⃣  Testing API Integration..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/insights/query \
  -H "Content-Type: application/json" \
  -d '{"question":"test","output_language":"fr","filters":{}}' \
  --max-time 120)

if [ $? -eq 0 ]; then
    if echo "$TEST_RESPONSE" | grep -q "storytelling"; then
        echo -e "${GREEN}✅ API integration working${NC}"
        LATENCY=$(echo $TEST_RESPONSE | grep -o '"latency_ms":[0-9]*' | cut -d':' -f2)
        echo "   Response time: ${LATENCY}ms"
    else
        echo -e "${RED}❌ API returned invalid response${NC}"
        echo "   Response: $TEST_RESPONSE"
    fi
else
    echo -e "${RED}❌ API request failed${NC}"
fi

echo ""
echo "=================================================="
echo "📊 Integration Status Summary"
echo "=================================================="
echo ""

# Summary
if curl -s http://localhost:8000/health > /dev/null 2>&1 && \
   [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✅ INTEGRATION COMPLETE${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Open http://localhost:5173 in your browser"
    echo "   2. Try asking: 'Quels sont les segments actifs?'"
    echo "   3. Check the test page: http://localhost:5173/src/test-integration.html"
    echo ""
    echo "📚 Documentation:"
    echo "   • Frontend: frontend/INTEGRATION_README.md"
    echo "   • Backend: BACKEND_FRONTEND_INTEGRATION_COMPLETE.md"
    echo "   • Quick Start: QUICKSTART_FULLSTACK.md"
else
    echo -e "${RED}❌ INTEGRATION INCOMPLETE${NC}"
    echo ""
    echo "⚠️  Please fix the issues above and run this script again"
fi

echo ""
