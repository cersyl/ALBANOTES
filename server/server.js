'use strict';
/*
 * Carnet — serveur de notes auto-hébergé
 * Zéro dépendance : Node >= 22 (http + node:sqlite + crypto)
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

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'carnet.db'));
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

/* ---------- CLI : node server.js passwd | revoke ---------- */
const cmd = process.argv[2];
if (cmd === 'passwd') {
  const input = fs.readFileSync(0, 'utf8').split('\n')[0].trim();
  if (input.length < 4) { console.error('Mot de passe trop court (4 caractères min).'); process.exit(1); }
  setKV('password', hashPassword(input));
  db.exec('DELETE FROM sessions');
  console.log('Mot de passe défini. Toutes les sessions ont été déconnectées.');
  process.exit(0);
}
if (cmd === 'revoke') {
  db.exec('DELETE FROM sessions');
  console.log('Toutes les sessions ont été révoquées.');
  process.exit(0);
}

/* ---------- requêtes préparées ---------- */
const qSessionGet = db.prepare('SELECT token_hash FROM sessions WHERE token_hash = ?');
const qSessionTouch = db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?');
const qSessionAdd = db.prepare('INSERT INTO sessions(token_hash, created_at, last_seen, agent) VALUES(?, ?, ?, ?)');
const qSessionDel = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const qItemGet = db.prepare('SELECT updated_at FROM items WHERE id = ?');
const qItemUpsert = db.prepare(`
  INSERT INTO items(id, type, data, updated_at, deleted, rev) VALUES(?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET type = excluded.type, data = excluded.data,
    updated_at = excluded.updated_at, deleted = excluded.deleted, rev = excluded.rev`);
const qChangesSince = db.prepare('SELECT id, type, data, updated_at, deleted, rev FROM items WHERE rev > ? ORDER BY rev');
const qStats = db.prepare("SELECT type, COUNT(*) AS n FROM items WHERE deleted = 0 GROUP BY type");

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

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const payload = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    ...SEC_HEADERS,
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

function auth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  const th = sha256(h.slice(7));
  if (!qSessionGet.get(th)) return null;
  qSessionTouch.run(Date.now(), th);
  return th;
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

/* ---------- API ---------- */
async function handleApi(req, res, pathname) {
  if (pathname === '/api/health') return send(res, 200, { ok: true, version: VERSION });

  if (pathname === '/api/login' && req.method === 'POST') {
    const ip = clientIp(req);
    if (loginBlocked(ip)) return send(res, 429, { error: 'Trop de tentatives, réessayez plus tard.' });
    const { password } = await readBody(req);
    const stored = getKV('password');
    if (!stored) return send(res, 503, { error: 'Aucun mot de passe configuré. Lancez « carnet passwd » dans le conteneur.' });
    if (typeof password !== 'string' || !verifyPassword(password, stored)) {
      loginFailed(ip);
      await new Promise((r) => setTimeout(r, 600));
      return send(res, 401, { error: 'Mot de passe incorrect.' });
    }
    failures.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    qSessionAdd.run(sha256(token), now, now, String(req.headers['user-agent'] || '').slice(0, 200));
    return send(res, 200, { token, version: VERSION });
  }

  const session = auth(req);
  if (!session) return send(res, 401, { error: 'Non authentifié' });

  if (pathname === '/api/logout' && req.method === 'POST') {
    qSessionDel.run(session);
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/stats' && req.method === 'GET') {
    const out = { version: VERSION, rev: Number(getKV('rev') || 0) };
    for (const r of qStats.all()) out[r.type] = r.n;
    return send(res, 200, out);
  }

  /*
   * Synchronisation : le client envoie ses modifications locales et la dernière
   * révision serveur qu'il connaît ; le serveur applique "le plus récent gagne"
   * (updated_at) puis renvoie tout ce qui a changé depuis.
   */
  if (pathname === '/api/sync' && req.method === 'POST') {
    const body = await readBody(req);
    const since = Number(body.since) || 0;
    const changes = Array.isArray(body.changes) ? body.changes : [];
    let rev = Number(getKV('rev') || 0);
    let applied = 0;
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const c of changes) {
        if (!c || typeof c.id !== 'string' || c.id.length > 64 || !['note', 'folder'].includes(c.type)) continue;
        const ts = Number(c.updated_at);
        if (!Number.isFinite(ts)) continue;
        const cur = qItemGet.get(c.id);
        if (cur && cur.updated_at >= ts) continue; // version serveur plus récente ou identique
        rev += 1;
        const deleted = c.deleted ? 1 : 0;
        qItemUpsert.run(c.id, c.type, deleted ? null : JSON.stringify(c.data ?? {}), ts, deleted, rev);
        applied += 1;
      }
      setKV('rev', rev);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    const out = qChangesSince.all(since).map((r) => ({
      id: r.id, type: r.type, updated_at: r.updated_at, deleted: !!r.deleted,
      data: r.data ? JSON.parse(r.data) : null,
    }));
    return send(res, 200, { rev, applied, changes: out, version: VERSION });
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
  console.log(`Carnet ${VERSION} — http://${HOST}:${PORT} — données : ${DATA_DIR}`);
  if (!getKV('password')) console.warn('ATTENTION : aucun mot de passe défini (carnet passwd).');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { server.close(); try { db.close(); } catch {} process.exit(0); });
}
