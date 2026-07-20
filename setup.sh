#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  RAI-Dashboard — Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Node
if ! command -v node &>/dev/null; then
  echo -e "${RED}Node.js required${NC}"; exit 1
fi

echo -e "  Node: $(node -v)"
echo ""

# Install deps
echo -e "  Installing dependencies..."
npm install --silent 2>/dev/null || npm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"
echo ""

# Push DB schema
echo -e "  Pushing DB schema..."
npx prisma db push 2>/dev/null
echo -e "  ${GREEN}✓${NC} Schema pushed"
echo ""

# Seed admin
echo -e "  Seeding admin user..."
npm run seed 2>/dev/null
echo -e "  ${GREEN}✓${NC} Admin created (admin@rai-dashboard.com / admin123)"
echo ""

# Create .env if missing
if [ ! -f ".env" ]; then
  cat > ".env" << 'ENVEOF'
DATABASE_URL="file:./dev.db"
AUTH_SECRET="rai-dashboard-super-secret-key-change-in-production-2024"
ENVEOF
  echo -e "  ${GREEN}✓${NC} Created .env with defaults"
fi
echo ""

echo -e "${GREEN}✅  RAI-Dashboard ready${NC}"
echo ""
echo -e "  Start dev server:  ${CYAN}npm run dev${NC}"
echo -e "  Start watcher:     ${CYAN}npm run watch${NC}"
echo -e "  Login:             ${CYAN}admin@rai-dashboard.com / admin123${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
