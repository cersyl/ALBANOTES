'use strict';
/*
 * ALBANOTES — serveur de notes auto-hébergé, multi-utilisateurs
 * Zéro dépendance : Node >= 22 (http + node:sqlite + crypto)
 *
 * - Chaque utilisateur a ses notes et ses dossiers, privés.
 * - Une note peut être partagée avec tout le monde ou avec des personnes choisies ;
 *   les personnes qui y ont accès peuvent la modifier.
 * - Les listes de courses sont toujours communes ; elles sont fusionnées article par article.
 * - Dossier, favori, épingle et ordre restent personnels, même sur une note partagée.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const MAX_BODY = 50 * 1024 * 1024; // 50 Mo (images et croquis inclus dans les notes)
const PERSONAL = ['folder', 'fav', 'pinned', 'order']; // champs propres à chaque utilisateur

fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'carnet.db');
const db = new DatabaseSync(DB_FILE);
// attendre jusqu'à 10 s si la base est verrouillée (service + commande carnet simultanés)
db.exec('PRAGMA busy_timeout = 10000');
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    data TEXT,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    rev INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS items_rev ON items(rev);
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    agent TEXT
  );
  CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pw TEXT NOT NULL,
    admin INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS item_shares (
    item_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (item_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS item_shares_user ON item_shares(user_id);
  CREATE TABLE IF NOT EXISTS item_meta (
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (user_id, item_id)
  );
`);

const kvGet = db.prepare('SELECT v FROM kv WHERE k = ?');
const kvSet = db.prepare('INSERT INTO kv(k, v) VALUES(?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v');
const getKV = (k) => kvGet.get(k)?.v ?? null;
const setKV = (k, v) => kvSet.run(k, String(v));

/* ---------- mots de passe ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [, salt, hash] = stored.split('$');
  const test = crypto.scryptSync(pw, Buffer.from(salt, 'base64'), 64, { N: 16384, r: 8, p: 1 });
  const ref = Buffer.from(hash, 'base64');
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/* ---------- migration vers le multi-utilisateurs (une seule fois, sans perte) ---------- */
function columns(table) { return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name); }
function migrate() {
  const needItems = !columns('items').includes('owner');
  const needSessions = !columns('sessions').includes('user_id');
  const noUsers = db.prepare('SELECT COUNT(*) n FROM users').get().n === 0;
  const oldPw = getKV('password');
  if (!needItems && !needSessions && !(noUsers && oldPw)) return;
  // sauvegarde de la base avant toute modification de structure
  const hasData = db.prepare('SELECT COUNT(*) n FROM items').get().n > 0;
  if (hasData) {
    const dir = path.join(DATA_DIR, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `avant-multi-utilisateurs-${new Date().toISOString().replace(/[:.]/g, '-')}.db`); // hors rotation des sauvegardes quotidiennes
    db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
    console.log('Sauvegarde avant migration :', f);
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    if (needItems) {
      db.exec('ALTER TABLE items ADD COLUMN owner INTEGER');
      db.exec('ALTER TABLE items ADD COLUMN shared INTEGER NOT NULL DEFAULT 0');
    }
    if (needSessions) db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER');
    if (noUsers && oldPw) {
      // l'ancien mot de passe unique devient le compte administrateur « admin »
      db.prepare('INSERT INTO users(name, pw, admin, created_at) VALUES(?, ?, 1, ?)').run('admin', oldPw, Date.now());
      db.prepare("DELETE FROM kv WHERE k = 'password'").run();
    }
    const admin = db.prepare('SELECT id FROM users WHERE admin = 1 ORDER BY id LIMIT 1').get();
    if (admin) {
      db.prepare('UPDATE items SET owner = ? WHERE owner IS NULL').run(admin.id);
      db.prepare('UPDATE sessions SET user_id = ? WHERE user_id IS NULL').run(admin.id); // appareils toujours connectés
    }
    db.exec("UPDATE items SET shared = 1 WHERE type = 'note' AND data IS NOT NULL AND json_extract(data, '$.kind') = 'shop'");
    db.exec('COMMIT');
    console.log('Base migrée vers le multi-utilisateurs.');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
migrate();
db.exec('CREATE INDEX IF NOT EXISTS items_owner ON items(owner)');

/* ---------- utilisateurs ---------- */
const qUserByName = db.prepare('SELECT * FROM users WHERE name = ?');
const qUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const qUsers = db.prepare(`SELECT u.id, u.name, u.admin, u.created_at,
  (SELECT COUNT(*) FROM items i WHERE i.owner = u.id AND i.type = 'note' AND i.deleted = 0) AS notes
  FROM users u ORDER BY u.name COLLATE NOCASE`);
const qUserCount = db.prepare('SELECT COUNT(*) n FROM users');
const qAdminCount = db.prepare('SELECT COUNT(*) n FROM users WHERE admin = 1');
const userNames = () => new Map(db.prepare('SELECT id, name FROM users').all().map((u) => [u.id, u.name]));
const publicUser = (u) => ({ id: u.id, name: u.name, admin: !!u.admin });
function validName(n) { return typeof n === 'string' && /^[\p{L}\p{N} ._-]{1,32}$/u.test(n.trim()); }
function validPw(p) { return typeof p === 'string' && p.length >= 4 && p.length <= 200; }

/* ---------- CLI : node server.js passwd [nom] | users | revoke ---------- */
const cmd = process.argv[2];
if (cmd === 'passwd') {
  const input = fs.readFileSync(0, 'utf8').split('\n')[0].trim();
  if (!validPw(input)) { console.error('Mot de passe trop court (4 caractères min).'); process.exit(1); }
  const wanted = (process.argv[3] || '').trim();
  let u = wanted ? qUserByName.get(wanted) : db.prepare('SELECT * FROM users WHERE admin = 1 ORDER BY id LIMIT 1').get();
  if (!u) {
    const name = wanted || 'admin';
    if (!validName(name)) { console.error('Nom invalide.'); process.exit(1); }
    db.prepare('INSERT INTO users(name, pw, admin, created_at) VALUES(?, ?, 1, ?)').run(name, hashPassword(input), Date.now());
    console.log(`Compte administrateur « ${name} » créé.`);
  } else {
    db.prepare('UPDATE users SET pw = ? WHERE id = ?').run(hashPassword(input), u.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
    console.log(`Mot de passe de « ${u.name} » changé. Ses appareils sont déconnectés.`);
  }
  process.exit(0);
}
if (cmd === 'users') {
  const list = qUsers.all();
  if (!list.length) console.log('Aucun utilisateur.');
  for (const u of list) console.log(`${u.admin ? '★' : ' '} ${u.name}  (${u.notes} notes)`);
  process.exit(0);
}
if (cmd === 'revoke') {
  db.exec('DELETE FROM sessions');
  console.log('Toutes les sessions ont été révoquées.');
  process.exit(0);
}

/* ---------- requêtes préparées ---------- */
const qSessionGet = db.prepare('SELECT token_hash, user_id FROM sessions WHERE token_hash = ?');
const qSessionTouch = db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?');
const qSessionAdd = db.prepare('INSERT INTO sessions(token_hash, created_at, last_seen, agent, user_id) VALUES(?, ?, ?, ?, ?)');
const qSessionDel = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const qItemFull = db.prepare('SELECT * FROM items WHERE id = ?');
const qItemPut = db.prepare(`
  INSERT INTO items(id, type, data, updated_at, deleted, rev, owner, shared) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET type = excluded.type, data = excluded.data, updated_at = excluded.updated_at,
    deleted = excluded.deleted, rev = excluded.rev, owner = excluded.owner, shared = excluded.shared`);
const qChangesSince = db.prepare('SELECT * FROM items WHERE rev > ? ORDER BY rev');
const qMetaGet = db.prepare('SELECT data FROM item_meta WHERE user_id = ? AND item_id = ?');
const qMetaPut = db.prepare(`INSERT INTO item_meta(user_id, item_id, data) VALUES(?, ?, ?)
  ON CONFLICT(user_id, item_id) DO UPDATE SET data = excluded.data`);
const qStats = db.prepare(`SELECT type, COUNT(*) AS n FROM items
  WHERE deleted = 0 AND (owner = ? OR (type = 'note' AND (shared = 1 OR id IN (SELECT item_id FROM item_shares WHERE user_id = ?)))) GROUP BY type`);
const qShareHas = db.prepare('SELECT 1 FROM item_shares WHERE item_id = ? AND user_id = ?');
const qSharesOf = db.prepare('SELECT user_id FROM item_shares WHERE item_id = ? ORDER BY user_id');
const qShareDelItem = db.prepare('DELETE FROM item_shares WHERE item_id = ?');
const qShareAdd = db.prepare('INSERT OR IGNORE INTO item_shares(item_id, user_id) VALUES(?, ?)');
/** Note visible par l'utilisateur : la sienne, partagée avec tous, ou partagée avec lui. */
const canSee = (user, r) => (r.owner ?? user.id) === user.id || (r.type === 'note' && (!!r.shared || !!qShareHas.get(r.id, user.id)));
function setShares(itemId, ownerId, ids) {
  qShareDelItem.run(itemId);
  for (const id of new Set(ids.map(Number))) if (id !== ownerId && qUserById.get(id)) qShareAdd.run(itemId, id);
}

/* ---------- utilitaires HTTP ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'SAMEORIGIN',
};

/* Applis natives (Android / Windows) : elles embarquent l'interface et appellent l'API
   depuis leur propre origine. On n'autorise que ces origines-là. credentials=true permet
   au navigateur intégré de présenter le certificat client (mTLS) s'il y en a un. */
const NATIVE_ORIGINS = new Set(['https://appassets.androidplatform.net', 'albanotes://app']);
function corsHeaders(req) {
  const o = req?.headers?.origin;
  if (!o || !NATIVE_ORIGINS.has(o)) return {};
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const payload = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    ...SEC_HEADERS,
    ...corsHeaders(res.req),
    'Content-Type': isBuf || typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Requête trop volumineuse'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(Object.assign(new Error('JSON invalide'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  return (xff ? xff.split(',')[0] : req.socket.remoteAddress || '').trim();
}

function auth(req, body) {
  // jeton dans l'en-tête Authorization, ou dans le corps (_token) pour les applis natives :
  // cela évite la requête de pré-vol CORS, que les proxys mTLS rejettent faute de certificat
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : typeof body?._token === 'string' ? body._token : '';
  if (!tok) return null;
  const th = sha256(tok);
  const s = qSessionGet.get(th);
  if (!s) return null;
  const user = s.user_id != null ? qUserById.get(s.user_id) : null;
  if (!user) { qSessionDel.run(th); return null; }
  qSessionTouch.run(Date.now(), th);
  return { th, user };
}

/* ---------- anti brute-force simple ---------- */
const failures = new Map(); // ip -> {n, until}
function loginBlocked(ip) {
  const f = failures.get(ip);
  return f && f.until > Date.now();
}
function loginFailed(ip) {
  const f = failures.get(ip) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= 5) { f.until = Date.now() + 60_000 * Math.min(2 ** (f.n - 5), 60); }
  failures.set(ip, f);
}

/* ---------- synchronisation ---------- */
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o && k in o).map((k) => [k, o[k]]));
const omit = (o, keys) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !keys.includes(k)));
const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const isShop = (d) => d && d.kind === 'shop';
const normName = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Fusion de deux versions d'une liste de courses, article par article (horodatage t de chaque article). */
function mergeShop(a, ta, b, tb) {
  const newer = tb >= ta ? b : a;
  const removed = { ...(a.removed || {}) };
  for (const [k, v] of Object.entries(b.removed || {})) removed[k] = Math.max(removed[k] || 0, Number(v) || 0);
  const byId = new Map();
  for (const it of [...(a.items || []), ...(b.items || [])]) {
    if (!it || typeof it.id !== 'string') continue;
    const ex = byId.get(it.id);
    if (!ex || (Number(it.t) || 0) > (Number(ex.t) || 0)) byId.set(it.id, it);
  }
  const items = [...byId.values()].filter((it) => !(removed[it.id] && removed[it.id] >= (Number(it.t) || 0)));
  const limit = Date.now() - 60 * 86400_000; // les traces d'articles retirés sont gardées 60 jours
  for (const k of Object.keys(removed)) if (removed[k] < limit) delete removed[k];
  const seen = new Set(), custom = [];
  for (const c of [...(newer.custom || []), ...((newer === b ? a : b).custom || [])]) {
    const k = normName(c?.name); if (!k || seen.has(k)) continue; seen.add(k); custom.push(c);
  }
  return { ...newer, items, removed, custom };
}

/** Applique une modification envoyée par un client ; renvoie true si la base a changé. */
function applyChange(user, c, nextRev) {
  if (!c || typeof c.id !== 'string' || c.id.length > 64 || !['note', 'folder'].includes(c.type)) return false;
  const ts = Number(c.updated_at);
  if (!Number.isFinite(ts)) return false;
  const cur = qItemFull.get(c.id);
  const incoming = c.deleted ? null : (c.data && typeof c.data === 'object' ? c.data : {});

  if (!cur) { // nouvel élément : il appartient à son créateur
    const shared = c.type === 'note' && (c.shared || isShop(incoming)) ? 1 : 0;
    qItemPut.run(c.id, c.type, incoming ? JSON.stringify(incoming) : null, ts, c.deleted ? 1 : 0, nextRev(), user.id, shared);
    if (c.type === 'note' && !shared && Array.isArray(c.shareWith)) setShares(c.id, user.id, c.shareWith);
    return true;
  }
  if (cur.type !== c.type) return false;
  const owner = cur.owner ?? user.id;
  const isOwner = owner === user.id;
  if (!isOwner && !canSee(user, cur)) return false; // note d'un autre qui ne m'est pas partagée : refusé

  let data = incoming;
  let meta = null;
  if (!isOwner && incoming) {
    // non-propriétaire : dossier, favori, épingle et ordre lui restent personnels
    meta = pick(incoming, PERSONAL);
    data = { ...omit(incoming, PERSONAL), ...pick(parse(cur.data) || {}, PERSONAL) };
  }
  const curData = parse(cur.data);
  let updated = ts;
  if (data && curData && isShop(data) && isShop(curData) && !cur.deleted) {
    data = mergeShop(curData, cur.updated_at, data, ts); // aucune modification perdue sur une liste commune
    updated = Math.max(ts, cur.updated_at) + 1;
  } else if (cur.updated_at >= ts) {
    // version du serveur plus récente : seul le réglage personnel est conservé
    if (!meta) return false;
    qMetaPut.run(user.id, c.id, JSON.stringify(meta));
    qItemPut.run(cur.id, cur.type, cur.data, cur.updated_at + 1, cur.deleted, nextRev(), owner, cur.shared);
    return true;
  }
  let shared = cur.shared;
  if (isOwner && c.type === 'note' && typeof c.shared === 'boolean') shared = c.shared ? 1 : 0;
  if (isShop(data)) shared = 1;
  // seul le propriétaire choisit avec qui la note est partagée
  if (isOwner && c.type === 'note' && Array.isArray(c.shareWith)) setShares(c.id, owner, shared ? [] : c.shareWith);
  if (meta) qMetaPut.run(user.id, c.id, JSON.stringify(meta));
  qItemPut.run(c.id, c.type, data ? JSON.stringify(data) : null, updated, c.deleted ? 1 : 0, nextRev(), owner, shared);
  return true;
}

/** Ce que voit un utilisateur d'un élément ; null = rien à envoyer. */
function viewFor(user, r, names) {
  const owner = r.owner ?? user.id;
  const mine = owner === user.id;
  if (!mine && !canSee(user, r)) {
    // plus visible (partage retiré, compte supprimé…) : on demande à l'appareil de l'oublier
    return r.type === 'note' ? { id: r.id, type: r.type, updated_at: r.updated_at, deleted: true, gone: true } : null;
  }
  let data = parse(r.data);
  if (data && !mine) {
    const meta = parse(qMetaGet.get(user.id, r.id)?.data) || {};
    data = { ...data, folder: null, fav: false, pinned: false, order: null, ...meta };
  }
  const shareWith = r.type === 'note' ? qSharesOf.all(r.id).map((x) => x.user_id) : [];
  return {
    id: r.id, type: r.type, updated_at: r.updated_at, deleted: !!r.deleted, data,
    shared: !!r.shared, shareWith: mine ? shareWith : [], sharedWithMe: !mine, mine, owner: names.get(owner) || '?',
  };
}

/* ---------- API ---------- */
async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...SEC_HEADERS, ...corsHeaders(req) }); return res.end(); }
  if (pathname === '/api/health') return send(res, 200, { ok: true, version: VERSION });
  const body = req.method === 'POST' ? await readBody(req) : {};

  if (pathname === '/api/login' && req.method === 'POST') {
    const ip = clientIp(req);
    if (loginBlocked(ip)) return send(res, 429, { error: 'Trop de tentatives, réessayez plus tard.' });
    if (qUserCount.get().n === 0) return send(res, 503, { error: 'Aucun compte configuré. Lancez « carnet passwd » dans le conteneur.' });
    const { password } = body;
    let name = typeof body.username === 'string' ? body.username.trim() : '';
    // ancienne interface sans identifiant : accepté tant qu'il n'existe qu'un seul compte
    if (!name && qUserCount.get().n === 1) name = db.prepare('SELECT name FROM users').get().name;
    const user = name ? qUserByName.get(name) : null;
    if (typeof password !== 'string' || !user || !verifyPassword(password, user.pw)) {
      loginFailed(ip);
      await new Promise((r) => setTimeout(r, 600));
      return send(res, 401, { error: 'Identifiant ou mot de passe incorrect.' });
    }
    failures.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    qSessionAdd.run(sha256(token), now, now, String(req.headers['user-agent'] || '').slice(0, 200), user.id);
    return send(res, 200, { token, version: VERSION, user: publicUser(user) });
  }

  const session = auth(req, body);
  if (!session) return send(res, 401, { error: 'Non authentifié' });
  const me = session.user;

  if (pathname === '/api/logout' && req.method === 'POST') {
    qSessionDel.run(session.th);
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/me') return send(res, 200, { user: publicUser(me), version: VERSION });

  if (pathname === '/api/people') {
    return send(res, 200, { people: db.prepare('SELECT id, name FROM users ORDER BY name COLLATE NOCASE').all() });
  }

  if (pathname === '/api/me/password' && req.method === 'POST') {
    if (!verifyPassword(String(body.current || ''), me.pw)) return send(res, 403, { error: 'Mot de passe actuel incorrect.' });
    if (!validPw(body.password)) return send(res, 400, { error: 'Nouveau mot de passe trop court (4 caractères min.).' });
    db.prepare('UPDATE users SET pw = ? WHERE id = ?').run(hashPassword(body.password), me.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(me.id, session.th);
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/stats') {
    const out = { version: VERSION, rev: Number(getKV('rev') || 0), repo: process.env.CARNET_REPO || '', user: publicUser(me) };
    for (const r of qStats.all(me.id, me.id)) out[r.type] = r.n;
    return send(res, 200, out);
  }

  /* Gestion des comptes (administrateurs) : { action: list | add | passwd | rename | admin | delete } */
  if (pathname === '/api/users' && req.method === 'POST') {
    if (!me.admin) return send(res, 403, { error: 'Réservé aux administrateurs.' });
    const a = body.action;
    if (a === 'list') return send(res, 200, { users: qUsers.all().map((u) => ({ ...publicUser(u), notes: u.notes, created_at: u.created_at })) });
    const target = body.id != null ? qUserById.get(Number(body.id)) : null;
    if (a === 'add') {
      const name = String(body.name || '').trim();
      if (!validName(name)) return send(res, 400, { error: 'Nom invalide (lettres, chiffres, espace, . _ - ; 32 caractères max).' });
      if (qUserByName.get(name)) return send(res, 409, { error: 'Ce nom existe déjà.' });
      if (!validPw(body.password)) return send(res, 400, { error: 'Mot de passe trop court (4 caractères min.).' });
      db.prepare('INSERT INTO users(name, pw, admin, created_at) VALUES(?, ?, ?, ?)').run(name, hashPassword(body.password), body.admin ? 1 : 0, Date.now());
      return send(res, 200, { ok: true });
    }
    if (!target) return send(res, 404, { error: 'Utilisateur introuvable.' });
    if (a === 'passwd') {
      if (!validPw(body.password)) return send(res, 400, { error: 'Mot de passe trop court (4 caractères min.).' });
      db.prepare('UPDATE users SET pw = ? WHERE id = ?').run(hashPassword(body.password), target.id);
      if (target.id !== me.id) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
      return send(res, 200, { ok: true });
    }
    if (a === 'rename') {
      const name = String(body.name || '').trim();
      if (!validName(name)) return send(res, 400, { error: 'Nom invalide.' });
      const other = qUserByName.get(name);
      if (other && other.id !== target.id) return send(res, 409, { error: 'Ce nom existe déjà.' });
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, target.id);
      return send(res, 200, { ok: true });
    }
    if (a === 'admin') {
      if (!body.admin && target.admin && qAdminCount.get().n <= 1) return send(res, 400, { error: 'Il faut garder au moins un administrateur.' });
      db.prepare('UPDATE users SET admin = ? WHERE id = ?').run(body.admin ? 1 : 0, target.id);
      return send(res, 200, { ok: true });
    }
    if (a === 'delete') {
      if (target.id === me.id) return send(res, 400, { error: 'Vous ne pouvez pas supprimer votre propre compte.' });
      let rev = Number(getKV('rev') || 0);
      db.exec('BEGIN IMMEDIATE');
      try {
        // notes partagées : transférées à l'administrateur qui supprime ; le reste est effacé
        for (const it of db.prepare('SELECT * FROM items WHERE owner = ?').all(target.id)) {
          rev += 1;
          const sharedSome = it.type === 'note' && !it.deleted && (it.shared || qSharesOf.all(it.id).length);
          if (!sharedSome) qShareDelItem.run(it.id);
          if (sharedSome) {
            db.prepare('UPDATE items SET owner = ?, rev = ?, updated_at = updated_at + 1 WHERE id = ?').run(me.id, rev, it.id);
          } else {
            db.prepare('UPDATE items SET deleted = 1, data = NULL, rev = ?, updated_at = updated_at + 1 WHERE id = ?').run(rev, it.id);
          }
        }
        db.prepare('DELETE FROM item_meta WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM item_shares WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
        db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
        setKV('rev', rev);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      return send(res, 200, { ok: true });
    }
    return send(res, 400, { error: 'Action inconnue.' });
  }

  /*
   * Synchronisation : le client envoie ses modifications locales et la dernière
   * révision serveur qu'il connaît ; le serveur applique « le plus récent gagne »
   * (listes de courses : fusion article par article) puis renvoie ce que
   * l'utilisateur peut voir et qui a changé depuis.
   */
  if (pathname === '/api/sync' && req.method === 'POST') {
    const since = Number(body.since) || 0;
    const changes = Array.isArray(body.changes) ? body.changes : [];
    let rev = Number(getKV('rev') || 0);
    let applied = 0;
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const c of changes) if (applyChange(me, c, () => ++rev)) applied += 1;
      setKV('rev', rev);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    const names = userNames();
    const out = [];
    for (const r of qChangesSince.all(since)) { const v = viewFor(me, r, names); if (v) out.push(v); }
    return send(res, 200, { rev, applied, changes: out, version: VERSION, user: publicUser(me) });
  }

  return send(res, 404, { error: 'Introuvable' });
}

/* ---------- fichiers statiques ---------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, 'Interdit');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Introuvable');
    const ext = path.extname(file);
    const noCache = ['.html', '.webmanifest'].includes(ext) || rel === '/sw.js';
    res.writeHead(200, {
      ...SEC_HEADERS,
      ...corsHeaders(req),
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
      ...(rel === '/sw.js' ? { 'Service-Worker-Allowed': '/' } : {}),
    });
    res.end(rel === '/sw.js' ? buf.toString('utf8').replace(/__VERSION__/g, VERSION) : buf);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode non autorisée');
    return serveStatic(req, res, pathname);
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Erreur serveur' });
    if (!e.status) console.error(e);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ALBANOTES ${VERSION} — http://${HOST}:${PORT} — données : ${DATA_DIR}`);
  if (qUserCount.get().n === 0) console.warn('ATTENTION : aucun compte (carnet passwd).');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { server.close(); try { db.close(); } catch {} process.exit(0); });
}
