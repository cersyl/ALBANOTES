#!/usr/bin/env bash
# =============================================================================
#  Carnet — mise à jour (commande « update » dans le conteneur)
#  Options : --force  réinstalle même si la version est identique
# =============================================================================
set -Eeuo pipefail
export LC_ALL=C.UTF-8 LANG=C.UTF-8
GN="\033[1;92m"; BL="\033[36m"; YW="\033[33m"; RD="\033[01;31m"; CL="\033[m"
msg() { echo -e " ${BL}➜${CL} $*"; }
ok()  { echo -e " ${GN}✔${CL} $*"; }
die() { echo -e " ${RD}✘ $*${CL}" >&2; exit 1; }
[[ -f /etc/carnet/carnet.conf ]] || die "Carnet n'est pas installé ici."
set -a; . /etc/carnet/carnet.conf; set +a
APP_DIR=/opt/carnet
FORCE=0; [[ "${1:-}" == "--force" ]] && FORCE=1

CUR=$(cat "$APP_DIR/VERSION" 2>/dev/null || echo 0)
NEW=$(curl -fsSL "https://raw.githubusercontent.com/${CARNET_REPO}/${CARNET_BRANCH}/VERSION?$(date +%s)" | tr -d '[:space:]') || die "Impossible de joindre GitHub."
echo -e " Version installée : ${YW}${CUR}${CL}   Disponible : ${YW}${NEW}${CL}"
if [[ "$CUR" == "$NEW" && $FORCE -eq 0 ]]; then ok "Carnet est à jour. (update --force pour réinstaller)"; exit 0; fi

msg "Sauvegarde de la base…"
/usr/local/bin/carnet backup

msg "Téléchargement…"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
curl -fsSL "https://codeload.github.com/${CARNET_REPO}/tar.gz/refs/heads/${CARNET_BRANCH}" | tar xz --strip-components=1 -C "$TMP"
[[ -f "$TMP/server/server.js" ]] || die "Archive invalide."

systemctl stop carnet
rm -rf "${APP_DIR:?}.old"; mv "$APP_DIR" "${APP_DIR}.old"; mkdir -p "$APP_DIR"
cp -a "$TMP"/. "$APP_DIR"/
chown -R root:root "$APP_DIR"; chmod -R u=rwX,go=rX "$APP_DIR"
systemctl start carnet

for _ in $(seq 1 20); do curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 && break; sleep 0.5; done
if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  rm -rf "${APP_DIR}.old"
  ok "Carnet mis à jour en $(cat "$APP_DIR/VERSION"). Les appareils proposeront « Recharger » à la prochaine ouverture."
else
  echo -e " ${RD}Le service ne démarre pas, retour à la version précédente…${CL}"
  systemctl stop carnet; rm -rf "$APP_DIR"; mv "${APP_DIR}.old" "$APP_DIR"; systemctl start carnet
  die "Mise à jour annulée (journal : carnet logs)."
fi
