#!/bin/bash
# ==============================================================================
# Setup Script for Daily 12:00 AM Midnight Google Drive Backup
# ==============================================================================

set -e

echo "=========================================================="
echo "🔧 Setting Up Daily 12:00 AM Google Drive Backup Service"
echo "=========================================================="

# 1. Install rclone if not installed
if ! command -v rclone &> /dev/null; then
    echo "📦 Installing rclone..."
    sudo apt-get update -y
    sudo apt-get install -y rclone gzip
    echo "✅ rclone installed successfully."
else
    echo "✓ rclone is already installed."
fi

# 2. Make backup script executable
BACKUP_SCRIPT="${HOME}/Inventory/server/backup-service.sh"
chmod +x "${BACKUP_SCRIPT}"
echo "✓ Permissions set on ${BACKUP_SCRIPT}"

# 3. Configure Cron Job to run at 12:00 AM (00:00) every night
CRON_JOB="0 0 * * * /bin/bash ${BACKUP_SCRIPT} >> ${HOME}/backups/cron.log 2>&1"

# Check if cron job is already installed
crontab -l 2>/dev/null | grep -F "${BACKUP_SCRIPT}" >/dev/null && CRON_EXISTS=1 || CRON_EXISTS=0

if [ "$CRON_EXISTS" -eq 0 ]; then
    echo "⏰ Adding cron job for 12:00 AM midnight daily..."
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    echo "✅ Cron job installed: Runs every day at 12:00 AM (00:00)"
else
    echo "✓ Cron job already registered in crontab."
fi

echo ""
echo "=========================================================="
echo "📋 CRON SCHEDULE VERIFICATION:"
crontab -l | grep backup-service.sh
echo "=========================================================="
echo ""
echo "🎉 Setup complete! Next: link your Google Drive with rclone."
