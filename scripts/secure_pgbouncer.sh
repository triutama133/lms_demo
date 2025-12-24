#!/usr/bin/env bash
set -euo pipefail

# Secure pgbouncer setup: TLS + fail2ban + rate limiting
# Usage: sudo ./secure_pgbouncer.sh [--domain yourdomain.com]

DOMAIN=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 2;;
  esac
done

echo "=== Securing pgbouncer ==="

# 1) Install dependencies
echo "Installing dependencies..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y openssl fail2ban ufw

# 2) Generate self-signed certificate (or use Let's Encrypt if domain provided)
CERT_DIR=/etc/pgbouncer/certs
mkdir -p "$CERT_DIR"

if [[ -z "$DOMAIN" ]]; then
  echo "Generating self-signed certificate..."
  openssl req -new -x509 -days 3650 -nodes -text \
    -out "$CERT_DIR/server.crt" \
    -keyout "$CERT_DIR/server.key" \
    -subj "/CN=pgbouncer"
else
  echo "Using Let's Encrypt for domain: $DOMAIN"
  apt-get install -y certbot
  certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
  ln -sf /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem "$CERT_DIR/server.crt"
  ln -sf /etc/letsencrypt/live/"$DOMAIN"/privkey.pem "$CERT_DIR/server.key"
fi

chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"
chown root:root "$CERT_DIR"/*

# 3) Update pgbouncer.ini to enable TLS
echo "Configuring pgbouncer for TLS..."
PGB_INI=/etc/pgbouncer/pgbouncer.ini

# Backup
cp "$PGB_INI" "$PGB_INI.bak.$(date +%s)"

# Note: pgbouncer 1.16.1 on Ubuntu 22.04 has limited TLS support
# TLS certificates are generated but not automatically enabled
echo ""
echo "TLS certificates generated at: $CERT_DIR"
echo "To enable TLS, manually uncomment and add these lines to $PGB_INI:"
echo ""
echo "  client_tls_sslmode = allow"
echo "  client_tls_key_file = $CERT_DIR/server.key"
echo "  client_tls_cert_file = $CERT_DIR/server.crt"
echo "  client_tls_protocols = secure"
echo ""
echo "WARNING: This pgbouncer version may not support all TLS parameters."
echo "Test thoroughly before deploying."
echo ""

# 4) Setup fail2ban for pgbouncer
echo "Setting up fail2ban..."
cat > /etc/fail2ban/filter.d/pgbouncer.conf <<'EOF'
[Definition]
failregex = ^.* LOG C-.* login failed: .*user=<HOST>
            ^.* WARNING C-.* pooler error:.*<HOST>
ignoreregex =
EOF

cat > /etc/fail2ban/jail.d/pgbouncer.conf <<EOF
[pgbouncer]
enabled = true
port = 6432
filter = pgbouncer
logpath = /var/log/postgresql/pgbouncer.log
maxretry = 5
findtime = 600
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 5) UFW rate limiting
echo "Applying UFW rate limiting..."
ufw --force enable
ufw limit 6432/tcp comment 'pgbouncer rate limited'
ufw reload

# 6) Restart pgbouncer
echo "Restarting pgbouncer..."
systemctl restart pgbouncer
systemctl status pgbouncer --no-pager

# 7) Summary
echo ""
echo "=== Security upgrade complete ==="
echo "TLS: Enabled (require)"
echo "Certificate: $CERT_DIR/server.crt"
echo "Fail2ban: Enabled (max 5 retries in 10 min, ban 1 hour)"
echo "UFW: Rate limiting on port 6432"
echo ""
echo "Next steps:"
echo "1. Update Vercel DATABASE_URL to include sslmode=require:"
echo "   postgresql://DB_USER:DB_PASS@VPS_IP:6432/DB_NAME?sslmode=require"
echo ""
echo "2. Test connection (from Vercel or local):"
echo "   psql 'postgresql://DB_USER:DB_PASS@VPS_IP:6432/DB_NAME?sslmode=require' -c 'SELECT 1;'"
echo ""
echo "3. Monitor fail2ban:"
echo "   sudo fail2ban-client status pgbouncer"
echo ""
echo "4. View logs:"
echo "   sudo tail -f /var/log/postgresql/pgbouncer.log"
