#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🔒 InventoryPro — One-Time Permanent Server Setup Script
# ═══════════════════════════════════════════════════════════════════
#
# WHY THIS EXISTS:
#   GCP VMs undergo periodic maintenance reboots (~monthly).
#   Without proper setup, PM2 processes die and don't restart,
#   causing the "Not Found - /" error you keep seeing.
#
# RUN THIS ONCE on your server:
#   chmod +x setup-permanent.sh
#   sudo bash setup-permanent.sh
#
# WHAT IT DOES:
#   1. Configures PM2 to auto-start on system boot (systemd)
#   2. Builds the frontend client
#   3. Starts the app via PM2 and saves the process list
#   4. Sets up a cron-based health watchdog that auto-restarts
#      the app if it ever goes down
#   5. Configures log rotation so logs don't fill up the disk
# ═══════════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="/home/arpit/Inventory"
APP_USER="arpit"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔒 InventoryPro — Permanent Server Setup"
echo "  🕐 $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 1: Ensure PM2 is installed globally
# ─────────────────────────────────────────────────────────────
echo "📦 Step 1/6: Ensuring PM2 is installed globally..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  echo "   ✅ PM2 installed"
else
  echo "   ✅ PM2 already installed ($(pm2 -v))"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 2: Build the frontend client
# ─────────────────────────────────────────────────────────────
echo "🔨 Step 2/6: Building frontend client..."
cd "$PROJECT_DIR/client"
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm run build
echo "   ✅ Frontend built → client/dist/"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 3: Install server dependencies & start PM2
# ─────────────────────────────────────────────────────────────
echo "🚀 Step 3/6: Starting application via PM2..."
cd "$PROJECT_DIR/server"
sudo -u "$APP_USER" npm install --production

# Stop any existing PM2 processes to avoid duplicates
sudo -u "$APP_USER" pm2 delete all 2>/dev/null || true

# Start fresh from ecosystem config
sudo -u "$APP_USER" pm2 start ecosystem.config.js
echo "   ✅ PM2 cluster started"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 4: Configure PM2 to auto-start on system boot
#         THIS IS THE KEY FIX FOR THE MONTHLY CRASH
# ─────────────────────────────────────────────────────────────
echo "🔑 Step 4/6: Configuring PM2 auto-start on boot (systemd)..."

# Generate the systemd startup script for the app user
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"

# Save the current PM2 process list so it knows what to restart
sudo -u "$APP_USER" pm2 save

echo "   ✅ PM2 will now auto-start after every reboot!"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 5: Set up PM2 log rotation (prevents disk from filling)
# ─────────────────────────────────────────────────────────────
echo "📝 Step 5/6: Setting up PM2 log rotation..."
sudo -u "$APP_USER" pm2 install pm2-logrotate 2>/dev/null || true
sudo -u "$APP_USER" pm2 set pm2-logrotate:max_size 10M
sudo -u "$APP_USER" pm2 set pm2-logrotate:retain 7
sudo -u "$APP_USER" pm2 set pm2-logrotate:compress true
echo "   ✅ Logs will auto-rotate (max 10MB, keep 7 files)"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 6: Install health watchdog cron job (safety net)
#         Checks every 5 minutes if the app is alive.
#         If not, restarts PM2 automatically.
# ─────────────────────────────────────────────────────────────
echo "🛡️  Step 6/6: Installing health watchdog cron..."

# Create the watchdog script
cat > "$PROJECT_DIR/watchdog.sh" << 'WATCHDOG_EOF'
#!/bin/bash
# InventoryPro Health Watchdog
# Runs every 5 minutes via cron to ensure the app is alive

LOG_FILE="/home/arpit/Inventory/watchdog.log"
MAX_LOG_SIZE=5242880  # 5MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
  mv "$LOG_FILE" "$LOG_FILE.old"
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check if the API health endpoint responds
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:5000/api/health 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
  # App is healthy — log only every hour (minute 0) to avoid log spam
  if [ "$(date +%M)" = "00" ]; then
    echo "[$TIMESTAMP] ✅ Healthy (HTTP $HTTP_STATUS)" >> "$LOG_FILE"
  fi
else
  echo "[$TIMESTAMP] ⚠️  DOWN (HTTP $HTTP_STATUS) — Restarting PM2..." >> "$LOG_FILE"

  # Try to restart existing PM2 processes first
  cd /home/arpit/Inventory/server
  pm2 restart ecosystem.config.js --update-env 2>> "$LOG_FILE"

  # Wait 10 seconds and re-check
  sleep 10
  HTTP_STATUS_AFTER=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://localhost:5000/api/health 2>/dev/null)

  if [ "$HTTP_STATUS_AFTER" = "200" ]; then
    echo "[$TIMESTAMP] ✅ Recovery successful (HTTP $HTTP_STATUS_AFTER)" >> "$LOG_FILE"
  else
    echo "[$TIMESTAMP] ❌ Restart failed — attempting full start..." >> "$LOG_FILE"
    pm2 delete all 2>/dev/null
    pm2 start /home/arpit/Inventory/server/ecosystem.config.js 2>> "$LOG_FILE"
    pm2 save 2>> "$LOG_FILE"
    echo "[$TIMESTAMP] 🔄 Full restart attempted" >> "$LOG_FILE"
  fi
fi
WATCHDOG_EOF

chmod +x "$PROJECT_DIR/watchdog.sh"
chown "$APP_USER:$APP_USER" "$PROJECT_DIR/watchdog.sh"

# Install the cron job (runs every 5 minutes)
CRON_JOB="*/5 * * * * /bin/bash $PROJECT_DIR/watchdog.sh"
EXISTING_CRON=$(sudo -u "$APP_USER" crontab -l 2>/dev/null || echo "")

if echo "$EXISTING_CRON" | grep -q "watchdog.sh"; then
  echo "   ✅ Watchdog cron already installed"
else
  (echo "$EXISTING_CRON"; echo "$CRON_JOB") | sudo -u "$APP_USER" crontab -
  echo "   ✅ Watchdog cron installed (checks every 5 minutes)"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# VERIFY
# ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  🔍 VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Show PM2 status
sudo -u "$APP_USER" pm2 status

echo ""

# Check if systemd service is enabled
if systemctl is-enabled pm2-"$APP_USER" &>/dev/null; then
  echo "✅ PM2 systemd service: ENABLED (will auto-start on boot)"
else
  echo "⚠️  PM2 systemd service: Check 'systemctl enable pm2-$APP_USER'"
fi

# Check cron
echo "✅ Watchdog cron: $(sudo -u "$APP_USER" crontab -l 2>/dev/null | grep watchdog | wc -l) job(s) active"

# Health check
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:5000/api/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API Health: ONLINE (HTTP $HTTP_CODE)"
else
  echo "⚠️  API Health: HTTP $HTTP_CODE (may still be starting up)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🎉 PERMANENT SETUP COMPLETE!"
echo ""
echo "  Your app will now survive:"
echo "    ✓ GCP maintenance reboots"
echo "    ✓ Process crashes (PM2 auto-restart)"
echo "    ✓ Unexpected failures (watchdog every 5 min)"
echo "    ✓ Log overflow (auto-rotation enabled)"
echo ""
echo "  🌐 App: http://34.180.17.0"
echo "  📊 Monitor: pm2 monit"
echo "  📋 Logs: pm2 logs"
echo "  🛡️  Watchdog log: cat $PROJECT_DIR/watchdog.log"
echo "═══════════════════════════════════════════════════════════"
echo ""
