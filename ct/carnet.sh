#!/usr/bin/env bash
# =============================================================================
#  ALBANOTES (projet carnet) — création d'un LXC sur Proxmox VE (à lancer sur l'hôte PVE)
#  bash -c "$(curl -fsSL https://raw.githubusercontent.com/<user>/carnet/main/ct/carnet.sh)"
#  Si lancé DANS le conteneur Carnet : met l'application à jour.
# =============================================================================
set -Eeuo pipefail

REPO="${CARNET_REPO:-cersyl/carnet}"
BRANCH="${CARNET_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
APP="ALBANOTES"

YW="\033[33m"; GN="\033[1;92m"; RD="\033[01;31m"; BL="\033[36m"; CL="\033[m"
msg()  { echo -e " ${BL}➜${CL} $*"; }
ok()   { echo -e " ${GN}✔${CL} $*"; }
die()  { echo -e " ${RD}✘ $*${CL}" >&2; exit 1; }
trap 'die "Erreur ligne $LINENO : $BASH_COMMAND"' ERR

header() {
  clear
  cat <<'EOF'
     _    _     ____    _    _   _  ___ _____ _____ ____
    / \  | |   | __ )  / \  | \ | |/ _ \_   _| ____/ ___|
   / _ \ | |   |  _ \ / _ \ |  \| | | | || | |  _| \___ \
  / ___ \| |___| |_) / ___ \| |\  | |_| || | | |___ ___) |
 /_/   \_\_____|____/_/   \_\_| \_|\___/ |_| |_____|____/
EOF
  echo
}

# --- Exécuté dans le conteneur : mise à jour --------------------------------
if [[ -f /etc/carnet/carnet.conf ]] && ! command -v pct >/dev/null 2>&1; then
  exec bash -c "$(curl -fsSL "${RAW}/install/carnet-update.sh")"
fi

command -v pct >/dev/null 2>&1 || die "Ce script doit être lancé sur un hôte Proxmox VE."
[[ $EUID -eq 0 ]] || die "Lancez ce script en root."
command -v whiptail >/dev/null 2>&1 || apt-get install -y whiptail >/dev/null

header
WT() { whiptail --backtitle "Proxmox VE — ${APP}" "$@" 3>&1 1>&2 2>&3; }

# --- Valeurs par défaut ------------------------------------------------------
CTID=$(pvesh get /cluster/nextid)
CT_HOSTNAME="albanotes"
DISK=4
RAM=512
CORES=1
BRIDGE="vmbr0"
NET="dhcp"
GATE=""
VLAN=""
PORT=3000
STORAGE=$(pvesm status -content rootdir 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
TSTORAGE=$(pvesm status -content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
[[ -n "$STORAGE" ]] || die "Aucun stockage actif acceptant des conteneurs (rootdir)."
[[ -n "$TSTORAGE" ]] || die "Aucun stockage actif acceptant des templates (vztmpl)."

if ! WT --title "$APP" --yesno "Utiliser les paramètres par défaut ?\n\n  ID          : $CTID\n  Nom         : $CT_HOSTNAME\n  Disque      : ${DISK} Go sur $STORAGE\n  RAM / CPU   : ${RAM} Mo / $CORES cœur\n  Réseau      : $BRIDGE, DHCP\n  Port        : $PORT" 18 60; then
  CTID=$(WT --inputbox "ID du conteneur" 8 58 "$CTID") || exit 1
  CT_HOSTNAME=$(WT --inputbox "Nom d'hôte" 8 58 "$CT_HOSTNAME") || exit 1
  mapfile -t STS < <(pvesm status -content rootdir | awk 'NR>1 && $3=="active" {print $1; print $2}')
  STORAGE=$(WT --menu "Stockage du conteneur" 16 58 6 "${STS[@]}") || exit 1
  DISK=$(WT --inputbox "Taille du disque (Go)" 8 58 "$DISK") || exit 1
  RAM=$(WT --inputbox "RAM (Mo)" 8 58 "$RAM") || exit 1
  CORES=$(WT --inputbox "Cœurs CPU" 8 58 "$CORES") || exit 1
  BRIDGE=$(WT --inputbox "Bridge réseau" 8 58 "$BRIDGE") || exit 1
  NET=$(WT --inputbox "Adresse IP en CIDR (ex. 192.168.0.50/24) ou dhcp" 8 58 "$NET") || exit 1
  if [[ "$NET" != "dhcp" ]]; then GATE=$(WT --inputbox "Passerelle" 8 58 "") || exit 1; fi
  VLAN=$(WT --inputbox "VLAN (vide = aucun)" 8 58 "") || exit 1
  PORT=$(WT --inputbox "Port HTTP de l'application" 8 58 "$PORT") || exit 1
fi
pct status "$CTID" >/dev/null 2>&1 && die "L'ID $CTID est déjà utilisé."

while :; do
  PW1=$(WT --passwordbox "Mot de passe de connexion à ALBANOTES (4 caractères min.)" 9 58) || exit 1
  PW2=$(WT --passwordbox "Confirmez le mot de passe" 9 58) || exit 1
  [[ "$PW1" == "$PW2" && ${#PW1} -ge 4 ]] && break
  WT --msgbox "Les mots de passe ne correspondent pas ou sont trop courts." 8 58
done

# --- Template Debian ----------------------------------------------------------
msg "Mise à jour de la liste des templates…"
pveam update >/dev/null || true
TEMPLATE=$(pveam available --section system | awk '{print $2}' | grep -E '^debian-1[2-9]-standard_.*amd64' | sort -V | tail -n1)
[[ -n "$TEMPLATE" ]] || die "Template Debian introuvable."
if ! pveam list "$TSTORAGE" | grep -q "$TEMPLATE"; then
  msg "Téléchargement de $TEMPLATE…"
  pveam download "$TSTORAGE" "$TEMPLATE" >/dev/null
fi
ok "Template : $TEMPLATE"

# --- Création du conteneur ---------------------------------------------------
NET0="name=eth0,bridge=${BRIDGE},ip=${NET}"
[[ -n "$GATE" ]] && NET0+=",gw=${GATE}"
[[ -n "$VLAN" ]] && NET0+=",tag=${VLAN}"
msg "Création du conteneur $CTID…"
pct create "$CTID" "${TSTORAGE}:vztmpl/${TEMPLATE}" \
  --hostname "$CT_HOSTNAME" --cores "$CORES" --memory "$RAM" --swap 512 \
  --rootfs "${STORAGE}:${DISK}" --net0 "$NET0" \
  --unprivileged 1 --features nesting=1 --onboot 1 --ostype debian \
  --tags albanotes --description "<div align='center'><h2>ALBANOTES</h2><p>Notes auto-hébergées</p><p><code>update</code> dans la console pour mettre à jour</p></div>" >/dev/null
ok "Conteneur créé"

pct start "$CTID"
msg "Attente du réseau…"
for _ in $(seq 1 30); do
  pct exec "$CTID" -- bash -c "getent hosts deb.debian.org >/dev/null 2>&1" && break
  sleep 2
done
pct exec "$CTID" -- bash -c "getent hosts deb.debian.org >/dev/null" || die "Le conteneur n'a pas d'accès réseau."
ok "Réseau opérationnel"

# Mot de passe transmis par fichier (jamais en argument de commande)
TMPPW=$(mktemp); chmod 600 "$TMPPW"; printf '%s\n' "$PW1" >"$TMPPW"
pct push "$CTID" "$TMPPW" /root/.carnet-pass --perms 600
rm -f "$TMPPW"; unset PW1 PW2

msg "Installation d'ALBANOTES dans le conteneur (2-3 min)…"
pct exec "$CTID" -- env LC_ALL=C.UTF-8 LANG=C.UTF-8 bash -c "apt-get update -qq >/dev/null && apt-get install -y -qq curl ca-certificates >/dev/null"
pct exec "$CTID" -- env LC_ALL=C.UTF-8 LANG=C.UTF-8 CARNET_REPO="$REPO" CARNET_BRANCH="$BRANCH" CARNET_PORT="$PORT" \
  bash -c "curl -fsSL '${RAW}/install/carnet-install.sh' | bash"

IP=$(pct exec "$CTID" -- hostname -I | awk '{print $1}')
echo
ok "${APP} est installé !"
echo -e "   Accès local       : ${YW}http://${IP}:${PORT}${CL}"
echo -e "   Mise à jour       : ${YW}update${CL} dans la console du CT, ou ${YW}pct exec ${CTID} -- update${CL}"
echo -e "   Outils            : ${YW}carnet passwd | backup | logs | status | version${CL}"
echo -e "   Windows / Android : publiez-le en HTTPS (ex. Nginx Proxy Manager) puis « Installer l'application »."
