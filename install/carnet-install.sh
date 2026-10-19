#!/usr/bin/env bash
# =============================================================================
#  Carnet — installation dans un conteneur Debian (appelé par ct/carnet.sh)
#  Utilisable aussi directement sur une Debian/Ubuntu propre :
#    curl -fsSL https://raw.githubusercontent.com/<user>/carnet/main/install/carnet-install.sh | bash
# =============================================================================
set -Eeuo pipefail
REPO="${CARNET_REPO:-cersyl/carnet}"
BRANCH="${CARNET_BRANCH:-main}"
PORT="${CARNET_PORT:-3000}"
NODE_MAJOR=24
APP_DIR=/opt/carnet
DATA_DIR=/var/lib/carnet
export DEBIAN_FRONTEND=noninteractive LC_ALL=C.UTF-8 LANG=C.UTF-8

GN="\033[1;92m"; BL="\033[36m"; RD="\033[01;31m"; CL="\033[m"
msg() { echo -e " ${BL}➜${CL} $*"; }
ok()  { echo -e " ${GN}✔${CL} $*"; }
trap 'echo -e " ${RD}✘ Erreur ligne $LINENO : $BASH_COMMAND${CL}" >&2' ERR

msg "Paquets système…"
apt-get update -qq >/dev/null
apt-get install -y -qq curl ca-certificates gnupg tar sqlite3 cron >/dev/null
ok "Paquets installés"

if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]]; then
  msg "Node.js ${NODE_MAJOR}…"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update -qq >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
ok "Node.js $(node -v)"

msg "Téléchargement d'ALBANOTES (${REPO}@${BRANCH})…"
id carnet >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin carnet
mkdir -p "$APP_DIR" "$DATA_DIR/backups" /etc/carnet
TMP=$(mktemp -d)
curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}" | tar xz --strip-components=1 -C "$TMP"
rm -rf "${APP_DIR:?}"/*; cp -a "$TMP"/. "$APP_DIR"/; rm -rf "$TMP"
# mktemp crée un dossier en 0700 : cp -a le recopie sur /opt/carnet → illisible pour l'utilisateur carnet
chown -R root:root "$APP_DIR"; chmod -R u=rwX,go=rX "$APP_DIR"
chown -R carnet:carnet "$DATA_DIR"
ok "ALBANOTES $(cat "$APP_DIR/VERSION")"

cat >/etc/carnet/carnet.conf <<EOF
CARNET_REPO=${REPO}
CARNET_BRANCH=${BRANCH}
PORT=${PORT}
HOST=0.0.0.0
DATA_DIR=${DATA_DIR}
EOF

cat >/etc/systemd/system/carnet.service <<'EOF'
[Unit]
Description=ALBANOTES — notes auto-hébergées
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=carnet
Group=carnet
EnvironmentFile=/etc/carnet/carnet.conf
ExecStart=/usr/bin/node --no-warnings /opt/carnet/server/server.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

# Outil d'administration
cat >/usr/local/bin/carnet <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
set -a; . /etc/carnet/carnet.conf; set +a
cd /
case "${1:-help}" in
  passwd)
    read -rsp "Nouveau mot de passe : " a; echo; read -rsp "Confirmation : " b; echo
    [[ "$a" == "$b" ]] || { echo "Les mots de passe diffèrent."; exit 1; }
    printf '%s\n' "$a" | runuser -u carnet -- env DATA_DIR="$DATA_DIR" node --no-warnings /opt/carnet/server/server.js passwd ;;
  revoke)  runuser -u carnet -- env DATA_DIR="$DATA_DIR" node --no-warnings /opt/carnet/server/server.js revoke ;;
  backup)
    f="$DATA_DIR/backups/carnet-$(date +%Y%m%d-%H%M%S).db"
    sqlite3 "$DATA_DIR/carnet.db" ".backup '$f'" && chown carnet:carnet "$f" && echo "Sauvegarde : $f"
    ls -1t "$DATA_DIR"/backups/carnet-*.db 2>/dev/null | tail -n +11 | xargs -r rm -f ;;
  update)  exec /usr/bin/update ;;
  logs)    journalctl -u carnet -n 100 -f ;;
  status)  systemctl --no-pager status carnet ;;
  restart) systemctl restart carnet && echo "Redémarré." ;;
  version) cat /opt/carnet/VERSION ;;
  *) echo "Usage : carnet {passwd|revoke|backup|update|logs|status|restart|version}" ;;
esac
EOF
chmod +x /usr/local/bin/carnet

# Commande « update », comme les Proxmox VE Helper-Scripts
cat >/usr/bin/update <<'EOF'
#!/usr/bin/env bash
. /etc/carnet/carnet.conf
bash -c "$(curl -fsSL "https://raw.githubusercontent.com/${CARNET_REPO}/${CARNET_BRANCH}/install/carnet-update.sh")" -- "$@"
EOF
chmod +x /usr/bin/update

# Sauvegarde quotidienne de la base (10 dernières conservées)
cat >/etc/cron.d/carnet-backup <<'EOF'
15 3 * * * root /usr/local/bin/carnet backup >/dev/null 2>&1
EOF

systemctl daemon-reload
systemctl stop carnet 2>/dev/null || true

if [[ -f /root/.carnet-pass ]]; then
  (cd / && runuser -u carnet -- env DATA_DIR="$DATA_DIR" node --no-warnings "$APP_DIR/server/server.js" passwd </root/.carnet-pass >/dev/null)
  shred -u /root/.carnet-pass 2>/dev/null || rm -f /root/.carnet-pass
  ok "Mot de passe défini"
else
  echo "   Pensez à définir le mot de passe : carnet passwd"
fi

systemctl enable -q carnet
systemctl restart carnet

for _ in $(seq 1 20); do curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null && ok "Service actif sur le port ${PORT}"

# Console Proxmox : connexion automatique en root (comme les helper-scripts)
mkdir -p /etc/systemd/system/container-getty@1.service.d
cat >/etc/systemd/system/container-getty@1.service.d/override.conf <<'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin root --noclear --keep-baud tty%I 115200,38400,9600 $TERM
EOF
systemctl daemon-reload
systemctl restart container-getty@1 2>/dev/null || true

# Message d'accueil de la console
cat >/etc/motd <<EOF

  ALBANOTES — notes auto-hébergées
  http://$(hostname -I | awk '{print $1}'):${PORT}
  update : mettre à jour   ·   carnet : administration

EOF
apt-get autoremove -y -qq >/dev/null; apt-get clean
