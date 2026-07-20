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
echo -e "${CYAN}  RAI-Dashboard — Update${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Read current version
CURRENT=""
if [ -f "VERSION" ]; then
  CURRENT=$(head -1 VERSION)
  echo -e "  Current: ${YELLOW}$CURRENT${NC}"
fi

# Fetch latest from GitHub
echo -e "  Checking GitHub..."
LATEST=$(curl -fsSL "https://raw.githubusercontent.com/rmiyoussef/RAI-Dashboard/master/VERSION" 2>/dev/null || echo "")

if [ -n "$LATEST" ]; then
  echo -e "  Latest:  ${GREEN}$LATEST${NC}"
  if [ "$CURRENT" = "$LATEST" ]; then
    echo -e "  ${GREEN}Already up to date${NC}"
    echo ""
    # Still update deps
    echo -e "  Updating dependencies..."
    npm install --silent 2>/dev/null || npm install
    echo -e "  ${GREEN}✓${NC} Dependencies updated"
    echo ""
    echo -e "${GREEN}✅  Up to date${NC}"
    exit 0
  fi
fi

echo ""
read -rp "  Pull latest code? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo -e "  ${RED}Cancelled${NC}"; exit 0
fi

# Stash local changes, pull, restore
STASHED=false
if ! git diff --quiet 2>/dev/null; then
  git stash -u 2>/dev/null && STASHED=true
fi

git pull origin master 2>&1 || {
  echo -e "  ${RED}Git pull failed${NC}"
  [ "$STASHED" = true ] && git stash pop 2>/dev/null
  exit 1
}

[ "$STASHED" = true ] && git stash pop 2>/dev/null

# Update deps
echo -e "  Updating dependencies..."
npm install --silent 2>/dev/null || npm install

# Push schema changes
echo -e "  Pushing DB schema..."
npx prisma db push 2>/dev/null

echo ""
echo -e "${GREEN}✅  RAI-Dashboard updated${NC}"
echo ""

# Show new version
if [ -f "VERSION" ]; then
  echo -e "  Version: ${GREEN}$(head -1 VERSION)${NC}"
fi
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
