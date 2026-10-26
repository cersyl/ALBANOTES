'use strict';
/*
 * ALBANOTES pour Windows (Electron).
 * L'interface (dossier public/ du dépôt) est embarquée et servie sous albanotes://app/ :
 * l'appli démarre et fonctionne sans serveur ; les notes sont stockées localement puis
 * synchronisées dès que le serveur répond. L'interface se met à jour depuis le serveur.
 * Certificat client (mTLS) : pris automatiquement dans le magasin de certificats Windows.
 */
const { app, BrowserWindow, protocol, ipcMain, shell, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const SCHEME = 'albanotes';
const ORIGIN = `${SCHEME}://app`;
const WWW = path.join(__dirname, 'www');
const SHELL_FILES = ['index.html', 'app.js', 'app.css'];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

const dataDir = () => app.getPath('userData');
const cfgFile = () => path.join(dataDir(), 'config.json');
function readCfg() {
  try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch { return {}; }
}
function writeCfg(cfg) {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(cfgFile(), JSON.stringify(cfg, null, 1));
}
const updateCfg = (patch) => writeCfg({ ...readCfg(), ...patch });

function cmpVer(a, b) {
  const x = String(a || '0').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const y = String(b || '0').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}
const bundledVersion = (() => {
  try { return fs.readFileSync(path.join(WWW, 'VERSION'), 'utf8').trim(); } catch { return app.getVersion(); }
})();
/** Version d'interface téléchargée depuis le serveur, si plus récente que celle embarquée. */
function storedShellVersion() {
  const v = readCfg().shellVersion;
  if (!v || !fs.existsSync(path.join(dataDir(), 'shell', 'app.js'))) return null;
  return cmpVer(v, bundledVersion) > 0 ? v : null;
}
function resolveFile(urlPath) {
  let name = '';
  try { name = decodeURIComponent(urlPath).replace(/^\/+/, ''); } catch { return null; }
  if (!name) name = 'index.html';
  if (name.includes('..') || name.includes('\\')) return null;
  if (SHELL_FILES.includes(name) && storedShellVersion()) {
    const f = path.join(dataDir(), 'shell', name);
    if (fs.existsSync(f)) return f;
  }
  const f = path.join(WWW, name);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}

/* Pont avec l'interface (preload.js) */
const handlers = {
  platform: () => 'Windows',
  getServer: () => readCfg().server || '',
  setServer: (url) => { updateCfg({ server: String(url || '') }); return true; },
  shellVersion: () => storedShellVersion() || bundledVersion,
  saveShell: (version, html, js, css) => {
    if (![version, html, js, css].every((x) => typeof x === 'string' && x)) return false;
    if (cmpVer(version, storedShellVersion() || bundledVersion) <= 0) return false; // jamais de retour en arrière
    const dir = path.join(dataDir(), 'shell');
    const tmp = path.join(dataDir(), 'shell.tmp');
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, 'index.html'), html);
    fs.writeFileSync(path.join(tmp, 'app.js'), js);
    fs.writeFileSync(path.join(tmp, 'app.css'), css);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(tmp, dir);
    updateCfg({ shellVersion: version });
    return true;
  },
};
ipcMain.on('alba', (event, cmd, ...args) => {
  try {
    const from = event.senderFrame?.url || '';
    if (!from.startsWith(ORIGIN + '/') || !Object.hasOwn(handlers, cmd)) { event.returnValue = null; return; }
    event.returnValue = handlers[cmd](...args);
  } catch (e) {
    console.error(e);
    event.returnValue = null;
  }
});

/* Certificat client demandé par le serveur (mTLS) : Windows ne propose que les certificats
   émis par l'autorité attendue ; on prend le premier sans afficher de fenêtre. */
app.on('select-client-certificate', (event, webContents, url, list, callback) => {
  event.preventDefault();
  if (list && list.length) callback(list[0]);
  else callback();
});

let win = null;
function createWindow() {
  const cfg = readCfg();
  const b = cfg.bounds || { width: 1200, height: 820 };
  win = new BrowserWindow({
    ...b,
    minWidth: 360,
    minHeight: 480,
    title: 'ALBANOTES',
    icon: path.join(WWW, 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f0f0f' : '#f6f6f6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  if (cfg.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', () => {
    const maximized = win.isMaximized();
    updateCfg(maximized ? { maximized } : { maximized, bounds: win.getBounds() });
  });
  // liens externes : navigateur par défaut
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(ORIGIN + '/')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN + '/')) { e.preventDefault(); shell.openExternal(url); }
  });
  win.loadURL(ORIGIN + '/');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(() => {
    protocol.handle(SCHEME, (request) => {
      const file = resolveFile(new URL(request.url).pathname);
      if (!file) return new Response('Introuvable', { status: 404, headers: { 'content-type': 'text/plain' } });
      return new Response(fs.readFileSync(file), {
        headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' },
      });
    });
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}

module.exports = { resolveFile, handlers, cmpVer }; // pour les tests
