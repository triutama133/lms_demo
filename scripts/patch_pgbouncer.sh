#!/usr/bin/env bash
set -euo pipefail

# Patch /etc/pgbouncer/pgbouncer.ini and /etc/pgbouncer/userlist.txt
# Usage:
# sudo ./patch_pgbouncer.sh --db-host 103.31.205.81 --db-user lms_user --db-pass 'secret' [--db-name lms_db] [--db-port 5432] [--pgb-port 6432]

print_usage() {
  cat <<'USAGE'
Usage: sudo ./patch_pgbouncer.sh [options]

Options:
  --db-host HOST         Postgres host (required or set DB_HOST env)
  --db-port PORT         Postgres port (default: 5432)
  --db-name NAME         Database name (default: lms_db)
  --db-user USER         Database user (default: lms_user)
  --db-pass PASS         Database user password (required or set DB_PASS env)
  --pgb-port PORT        pgbouncer listen port (default: 6432)
  --max-client-conn N    pgbouncer max_client_conn (default: 500)
  --default-pool-size N  pgbouncer default_pool_size (default: 50)
  -h, --help             Show this help
USAGE
}

# defaults
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-lms_db}
DB_USER=${DB_USER:-lms_user}
PGB_PORT=${PGB_PORT:-6432}
MAX_CLIENT_CONN=${MAX_CLIENT_CONN:-500}
DEFAULT_POOL_SIZE=${DEFAULT_POOL_SIZE:-50}
RESERVE_POOL_SIZE=${RESERVE_POOL_SIZE:-10}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db-host) DB_HOST="$2"; shift 2;;
    --db-port) DB_PORT="$2"; shift 2;;
    --db-name) DB_NAME="$2"; shift 2;;
    --db-user) DB_USER="$2"; shift 2;;
    --db-pass) DB_PASS="$2"; shift 2;;
    --pgb-port) PGB_PORT="$2"; shift 2;;
    --max-client-conn) MAX_CLIENT_CONN="$2"; shift 2;;
    --default-pool-size) DEFAULT_POOL_SIZE="$2"; shift 2;;
    --reserve-pool-size) RESERVE_POOL_SIZE="$2"; shift 2;;
    -h|--help) print_usage; exit 0;;
    *) echo "Unknown arg: $1"; print_usage; exit 2;;
  esac
done

if [[ -z "${DB_HOST:-}" ]]; then
  echo "ERROR: --db-host is required (or set DB_HOST env)" >&2
  print_usage
  exit 2
fi

if [[ -z "${DB_PASS:-}" ]]; then
  echo "ERROR: --db-pass is required (or set DB_PASS env)" >&2
  print_usage
  exit 2
fi

PKG_DIR=/etc/pgbouncer
TIMESTAMP=$(date +%s)

echo "Backing up existing configuration (if any) ..."
sudo mkdir -p "$PKG_DIR"
sudo cp -v "$PKG_DIR/pgbouncer.ini" "$PKG_DIR/pgbouncer.ini.bak.$TIMESTAMP" 2>/dev/null || true
sudo cp -v "$PKG_DIR/userlist.txt" "$PKG_DIR/userlist.txt.bak.$TIMESTAMP" 2>/dev/null || true

echo "Writing new pgbouncer.ini to $PKG_DIR/pgbouncer.ini"
sudo tee "$PKG_DIR/pgbouncer.ini" > /dev/null <<EOF
[databases]
${DB_NAME} = host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME}

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = ${PGB_PORT}

# auth
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# pooling
pool_mode = transaction
max_client_conn = ${MAX_CLIENT_CONN}
default_pool_size = ${DEFAULT_POOL_SIZE}
reserve_pool_size = ${RESERVE_POOL_SIZE}
reserve_pool_timeout = 5

# server behavior / health
server_reset_query = DISCARD ALL
server_check_query = SELECT 1
server_check_delay = 10
server_lifetime = 3600
server_idle_timeout = 600

# admin / logging
admin_users = ${DB_USER}
stats_users = ${DB_USER}
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
EOF

echo "Creating /etc/pgbouncer/userlist.txt"
MD5HEX=$(printf "%s%s" "${DB_PASS}" "${DB_USER}" | md5sum | awk '{print $1}')
sudo tee "$PKG_DIR/userlist.txt" > /dev/null <<EOF
"${DB_USER}" "md5${MD5HEX}"
EOF
sudo chmod 600 "$PKG_DIR/userlist.txt"
sudo chown root:root "$PKG_DIR/userlist.txt"

echo "Ensure log directory exists and ownership"
sudo mkdir -p /var/log/pgbouncer
if id -u pgbouncer >/dev/null 2>&1; then
  sudo chown pgbouncer:pgbouncer /var/log/pgbouncer || true
else
  sudo chown root:root /var/log/pgbouncer || true
fi
sudo touch /var/log/pgbouncer/pgbouncer.log
sudo chmod 640 /var/log/pgbouncer/pgbouncer.log || true

echo "Reloading systemd and restarting pgbouncer"
sudo systemctl daemon-reload || true
sudo systemctl restart pgbouncer
sleep 1
sudo systemctl status pgbouncer --no-pager

echo "Recent pgbouncer logs (tail 200):"
sudo journalctl -u pgbouncer -n 200 --no-hostname --no-pager || sudo tail -n 200 /var/log/pgbouncer/pgbouncer.log || true

echo "Done. If there are errors, restore backup:"
echo "  sudo cp $PKG_DIR/pgbouncer.ini.bak.$TIMESTAMP $PKG_DIR/pgbouncer.ini"
echo "  sudo cp $PKG_DIR/userlist.txt.bak.$TIMESTAMP $PKG_DIR/userlist.txt"
echo "  sudo systemctl restart pgbouncer"
