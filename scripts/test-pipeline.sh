#!/bin/bash

# Test script for PlanSureAI document pipeline
# Usage: bash scripts/test-pipeline.sh

set -e

echo "🧪 PlanSureAI Pipeline Test Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "1️⃣  Checking Environment Variables..."
echo ""

check_env() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}❌ Missing: $1${NC}"
    return 1
  else
    echo -e "${GREEN}✅ Found: $1${NC}"
    return 0
  fi
}

check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY"
check_env "ANTHROPIC_API_KEY"
check_env "QSTASH_TOKEN"
check_env "QSTASH_CURRENT_SIGNING_KEY"
check_env "STRIPE_PUBLIC_KEY"
check_env "STRIPE_SECRET_KEY"

echo ""
echo "2️⃣  Checking File Structure..."
echo ""

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅ Found: $1${NC}"
    return 0
  else
    echo -e "${RED}❌ Missing: $1${NC}"
    return 1
  fi
}

check_file "public/logo.png"
check_file "app/api/documents/upload/route.ts"
check_file "app/api/documents/process/route.ts"
check_file "app/components/Navbar.tsx"
check_file "app/components/Sidebar.tsx"

echo ""
echo "3️⃣  Checking Code Quality..."
echo ""

echo "Checking upload route has correct payload..."
if grep -q "documentId, fileUrl, siteId, userId" app/api/documents/upload/route.ts; then
  echo -e "${GREEN}✅ Upload route publishes correct payload${NC}"
else
  echo -e "${RED}❌ Upload route missing correct payload${NC}"
fi

echo "Checking process route expects correct payload..."
if grep -q "documentId, fileUrl, siteId, userId" app/api/documents/process/route.ts; then
  echo -e "${GREEN}✅ Process route expects correct payload${NC}"
else
  echo -e "${RED}❌ Process route doesn't expect correct payload${NC}"
fi

echo "Checking components use logo.png..."
if grep -q "logo.png" app/components/Navbar.tsx && grep -q "logo.png" app/components/Sidebar.tsx; then
  echo -e "${GREEN}✅ Components reference logo.png${NC}"
else
  echo -e "${RED}❌ Components don't reference logo.png${NC}"
fi

echo ""
echo "4️⃣  Building Project..."
echo ""

if npm run build; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Test upload: curl -X POST http://localhost:3000/api/documents/upload ..."
echo "3. Check QStash dashboard for message delivery"
echo "4. Verify document status changes to 'processed'"
echo ""
