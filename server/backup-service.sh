#!/bin/bash
# ==============================================================================
# Sologix Inventory - Automated Daily Midnight Backup with Google Drive Sync
# Schedule: Every midnight at 12:00 AM (00:00)
# Retention: 7 days rolling window (auto-deletes on 8th day)
# ==============================================================================

set -e

# Configuration
BACKUP_DIR="${HOME}/backups/inventory"
LOG_FILE="${HOME}/backups/backup.log"
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="inventory_backup_${DATE}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"
GDRIVE_REMOTE="gdrive:Inventory_Backups"
DB_NAME="inventory_db"

mkdir -p "${BACKUP_DIR}"
touch "${LOG_FILE}"

echo "==========================================================" >> "${LOG_FILE}"
echo "[${TIME}] 🚀 Starting Daily Midnight Backup..." >> "${LOG_FILE}"

# 1. Export MySQL Database with gzip compression
echo "[${TIME}] 📦 Dumping MySQL database '${DB_NAME}'..." >> "${LOG_FILE}"
if [ -f "${HOME}/Inventory/server/.env" ]; then
    DB_PASS=$(grep -E "^DB_PASSWORD=" "${HOME}/Inventory/server/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
    DB_USER=$(grep -E "^DB_USER=" "${HOME}/Inventory/server/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

if [ -n "${DB_PASS}" ] && [ -n "${DB_USER}" ] && [ "${DB_USER}" != "root" ]; then
    mysqldump -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" | gzip > "${BACKUP_PATH}"
else
    # Use sudo mysqldump for socket-authenticated root
    sudo mysqldump "${DB_NAME}" | gzip > "${BACKUP_PATH}"
fi

FILESIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
echo "[${TIME}] ✅ Backup created successfully: ${FILENAME} (${FILESIZE})" >> "${LOG_FILE}"

# 2. Upload to Google Drive via rclone (if configured)
if command -v rclone &> /dev/null && rclone listremotes 2>/dev/null | grep -q "^gdrive:"; then
    echo "[${TIME}] ☁️ Syncing to Google Drive (${GDRIVE_REMOTE})..." >> "${LOG_FILE}"
    rclone copy "${BACKUP_PATH}" "${GDRIVE_REMOTE}/"
    echo "[${TIME}] ✅ Uploaded to Google Drive successfully!" >> "${LOG_FILE}"
    
    # Prune Google Drive files older than 7 days (deletes on the 8th day)
    echo "[${TIME}] 🧹 Pruning Google Drive backups older than 7 days..." >> "${LOG_FILE}"
    rclone delete --min-age 7d "${GDRIVE_REMOTE}/"
    echo "[${TIME}] ✅ Google Drive 7-day retention enforced." >> "${LOG_FILE}"
else
    echo "[${TIME}] ⚠️ rclone 'gdrive:' remote not found. File kept safely in ${BACKUP_DIR}." >> "${LOG_FILE}"
fi

# 3. Local 7-day retention cleanup (deletes on 8th day)
echo "[${TIME}] 🧹 Cleaning local backups older than 7 days..." >> "${LOG_FILE}"
find "${BACKUP_DIR}" -type f -name "inventory_backup_*.sql.gz" -mtime +7 -exec rm -f {} \;
echo "[${TIME}] ✅ Local cleanup finished. Last 7 days preserved." >> "${LOG_FILE}"

echo "[${TIME}] 🎉 Midnight backup job finished successfully!" >> "${LOG_FILE}"
echo "==========================================================" >> "${LOG_FILE}"
