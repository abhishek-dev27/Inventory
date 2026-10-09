#!/bin/bash
# ═══════════════════════════════════════════════════════════
# 🚀 InventoryPro — One-Command Production Deploy Script
# ═══════════════════════════════════════════════════════════
#
# Usage (from your local Windows machine):
#   ssh arpit@34.180.17.0 'bash -s' < deploy.sh
#
# Or run directly on the server:
#   bash /home/arpit/Inventory/deploy.sh
#
# What this script does:
#   1. Pulls latest code from GitHub
#   2. Installs any new dependencies (server + client)
#   3. Builds the React frontend (client/dist)
#   4. Restarts the backend server via PM2
# ═══════════════════════════════════════════════════════════

set -e  # Exit on any error

PROJECT_DIR="/home/arpit/Inventory"
cd "$PROJECT_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🚀 InventoryPro Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Pull latest code ─────────────────────────────────
echo "📥 Step 1/4: Pulling latest code from GitHub..."
git pull origin main
echo "   ✅ Code updated"
echo ""

# ── Step 2: Install server dependencies ──────────────────────
echo "📦 Step 2/4: Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install --production
echo "   ✅ Server dependencies ready"
echo ""

# ── Step 3: Build React frontend ─────────────────────────────
echo "🔨 Step 3/4: Building React frontend..."
cd "$PROJECT_DIR/client"
npm install
npm run build
echo "   ✅ Frontend built → client/dist/"
echo ""

# ── Step 4: Restart backend server ───────────────────────────
echo "♻️  Step 4/4: Restarting PM2 processes..."
cd "$PROJECT_DIR/server"

# Check if PM2 process exists, start or restart accordingly
if pm2 describe inventory-api-cluster > /dev/null 2>&1; then
  pm2 restart ecosystem.config.js --update-env
  echo "   ✅ PM2 cluster restarted"
else
  pm2 start ecosystem.config.js
  echo "   ✅ PM2 cluster started fresh"
fi

pm2 save
echo ""

# ── Done ─────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ DEPLOY COMPLETE!"
echo "  🌐 App live at: http://34.180.17.0"
echo "  💚 API Health:  http://34.180.17.0/api/health"
echo "═══════════════════════════════════════════════════════════"
echo ""
