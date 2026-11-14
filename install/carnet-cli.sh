#!/usr/bin/env bash
# Outil d'administration d'ALBANOTES (installé dans /usr/local/bin/carnet, mis à jour par « update »)
set -euo pipefail
set -a; . /etc/carnet/carnet.conf; set +a
cd /
node_cmd() { runuser -u carnet -- env DATA_DIR="$DATA_DIR" node --no-warnings /opt/carnet/server/server.js "$@"; }
case "${1:-help}" in
  passwd)
    # carnet passwd [nom] : sans nom, le premier administrateur ; un nom inconnu crée un compte administrateur
    name="${2:-}"
    read -rsp "Nouveau mot de passe${name:+ pour $name} : " a; echo; read -rsp "Confirmation : " b; echo
    [[ "$a" == "$b" ]] || { echo "Les mots de passe diffèrent."; exit 1; }
    printf '%s\n' "$a" | node_cmd passwd "$name" ;;
  users)   node_cmd users ;;
  revoke)  node_cmd revoke ;;
  backup)
    stamp=$(date +%Y%m%d-%H%M%S)
    f="$DATA_DIR/backups/carnet-$stamp.db"
    sqlite3 "$DATA_DIR/carnet.db" ".backup '$f'" && chown carnet:carnet "$f" && echo "Sauvegarde : $f"
    # pièces jointes (PDF) : copie instantanée par liens physiques (les fichiers ne changent jamais, aucun espace disque en plus)
    if [[ -d "$DATA_DIR/files" ]]; then
      cp -al "$DATA_DIR/files" "$DATA_DIR/backups/files-$stamp" && chown -R carnet:carnet "$DATA_DIR/backups/files-$stamp" && echo "Pièces jointes : $DATA_DIR/backups/files-$stamp"
    fi
    ls -1t "$DATA_DIR"/backups/carnet-*.db 2>/dev/null | tail -n +11 | xargs -r rm -f
    ls -1dt "$DATA_DIR"/backups/files-* 2>/dev/null | tail -n +11 | xargs -r rm -rf ;;
  update)  exec /usr/bin/update ;;
  logs)    journalctl -u carnet -n 100 -f ;;
  status)  systemctl --no-pager status carnet ;;
  restart) systemctl restart carnet && echo "Redémarré." ;;
  version) cat /opt/carnet/VERSION ;;
  *) cat <<'USAGE'
Usage : carnet COMMANDE
  passwd [nom]   changer le mot de passe d'un compte (sans nom : l'administrateur)
  users          lister les comptes (★ = administrateur)
  revoke         déconnecter tous les appareils
  backup         sauvegarder la base maintenant
  update         mettre à jour depuis GitHub
  logs | status | restart | version
USAGE
  ;;
esac
