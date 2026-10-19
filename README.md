# ALBANOTES

ALBANOTES : prise de notes rapide façon Samsung Notes, auto-hébergée dans un LXC Proxmox, synchronisée entre Windows, Android et tout navigateur.

- **Notes riches** : titre, gras/italique/souligné/barré, titres, couleurs et surlignage, listes à puces/numérotées, **listes de tâches cochables**, séparateurs, alignement
- **Dessin à main levée** (stylet avec pression, surligneur, gomme, rejet de la paume) et **images** (collage, glisser-déposer, galerie/appareil photo)
- **Couleurs de note**, épinglage, favoris, **dossiers** colorés avec émoticônes (Maison, Bureau, Loisirs, Vie perso, Divers…), recherche, tri, grille/liste, sélection multiple (appui long)
- **Glisser-déposer** : réordonner les notes (tri personnalisé) et les dossiers, ranger une note dans un dossier ou à la corbeille — clic-glisser à la souris, appui long puis glisser au doigt
- **Corbeille** 30 jours, export/import JSON, export .txt, partage
- **Hors-ligne d'abord** : tout est stocké sur l'appareil puis synchronisé (le plus récent gagne)
- **Application installable** (PWA) : fenêtre dédiée sous Windows, icône + raccourci « Nouvelle note » + **cible de partage** sous Android
- Thème clair/sombre/auto, raccourcis clavier (Alt+N, Ctrl+F, Ctrl+S, Échap)
- Serveur Node.js **sans aucune dépendance** (SQLite intégré), sauvegarde quotidienne de la base

## 1. Publier le dépôt (une seule fois)

```bash
cd carnet
git init && git add . && git commit -m "Carnet 1.0.0"
git branch -M main
git remote add origin https://github.com/cersyl/carnet.git
git push -u origin main
```

Le dépôt doit être **public** (les scripts sont téléchargés sans authentification, comme les helper-scripts).

## 2. Installer (sur l'hôte Proxmox)

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/cersyl/carnet/main/ct/carnet.sh)"
```

L'assistant propose les valeurs par défaut (Debian récente, 1 cœur, 512 Mo, 4 Go, DHCP, port 3000) ou un mode avancé (ID, stockage, IP fixe, VLAN…), puis demande le mot de passe de l'application.

## 3. Mettre à jour

Après modification du code : incrémenter `VERSION`, puis `git push`. Ensuite, au choix :

- dans la console du CT : `update` (ou `update --force`)
- depuis l'hôte : `pct exec <ID> -- update`

La mise à jour sauvegarde la base, remplace le code, redémarre et **revient automatiquement en arrière** si le service ne démarre pas. Les appareils affichent « Nouvelle version disponible — Recharger ».

## 4. Accès Windows / Android

Une PWA exige **HTTPS**. Créer un proxy host dans Nginx Proxy Manager (ex. `notes.mondomaine`) → `http://IP_DU_CT:3000`, certificat Let's Encrypt, « Websockets » inutile.

- **Windows** : ouvrir l'URL dans Edge ou Chrome → icône « Installer l'application » dans la barre d'adresse.
- **Android** : Chrome → menu ⋮ → « Installer l'application ». Le partage de texte depuis n'importe quelle app vers « Carnet » crée une note.

Si le proxy est protégé par **mTLS**, la page fonctionne avec le certificat client installé, mais le service worker et la PWA installée sur Android gèrent mal les certificats clients : préférer un accès sans mTLS pour ce sous-domaine (le mot de passe + l'anti-bruteforce de Carnet protègent l'accès), ou un accès via VPN.

## Administration (dans le CT)

| Commande | Effet |
|---|---|
| `carnet passwd` | change le mot de passe (déconnecte tous les appareils) |
| `carnet revoke` | déconnecte tous les appareils |
| `carnet backup` | sauvegarde immédiate (`/var/lib/carnet/backups`, 10 conservées) |
| `carnet logs` / `status` / `restart` / `version` | exploitation |
| `update` | mise à jour depuis GitHub |

Configuration : `/etc/carnet/carnet.conf` (port, dépôt, branche). Données : `/var/lib/carnet/carnet.db`.

## Développement local

```bash
echo "motdepasse" | node server/server.js passwd
node server/server.js          # http://localhost:3000
```

## Architecture

```
ct/carnet.sh               création du LXC (hôte PVE) — ou mise à jour si lancé dans le CT
install/carnet-install.sh  installation dans le CT (Node 24, service systemd, outils)
install/carnet-update.sh   mise à jour avec sauvegarde et retour arrière
server/server.js           API (connexion, synchronisation) + fichiers statiques
public/                    application (HTML/CSS/JS sans framework, service worker, manifeste)
```

Synchronisation : chaque note/dossier porte un horodatage `updated_at` ; le client envoie ses modifications et la dernière révision serveur connue, le serveur applique « le plus récent gagne » et renvoie ce qui a changé depuis. Les suppressions définitives sont propagées par pierres tombales.
