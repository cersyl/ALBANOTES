/* ALBANOTES — application de notes (PWA, hors-ligne d'abord, synchronisée) */
'use strict';

/* ================= Icônes (Material, Apache 2.0) ================= */
const ICONS = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  grid: 'M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z',
  list: 'M20 13H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zm0-10H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1z',
  sort: 'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  checkAll: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41 6 19l1.41-1.41L1.83 12 .41 13.41z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  starO: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
  folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  folderPlus: 'M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z',
  restore: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  note: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  notes: 'M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo: 'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
  more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  checkbox: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  pen: 'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37-1.34-1.34a.996.996 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 0 0 0-1.41z',
  image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  textSize: 'M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z',
  bold: 'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
  italic: 'M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z',
  underline: 'M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z',
  strike: 'M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z',
  color: 'M11 3 5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62zM3 19h18v3H3z',
  highlight: 'M16.81 8.94l-3.75-3.75L4 14.25V18h3.75l9.06-9.06zM6 16v-.92l7.06-7.06.92.92L6.92 16H6zm13.71-9.96a.996.996 0 0 0 0-1.41L17.37 2.29a.996.996 0 0 0-1.41 0L14.13 4.12l3.75 3.75 1.83-1.83zM2 20h20v3H2z',
  bullets: 'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z',
  numbers: 'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z',
  indent: 'M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z',
  outdent: 'M11 17h10v-2H11v2zm-8-5 4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z',
  hr: 'M4 11h16v2H4z',
  block: 'M19 3H5c-1.1 0-2 .9-2 2v6h18V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6H3v6z',
  eraser: 'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  palette: 'M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  pin: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
  sync: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  install: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name] || ''}"/></svg>`;
const ic = (name) => `<i data-i="${name}">${svg(name)}</i>`;
function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-i]:empty').forEach((el) => { el.innerHTML = svg(el.dataset.i); });
}
function setIcon(el, name) { el.dataset.i = name; el.innerHTML = svg(name); }

/* ================= Utilitaires ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = () => { clearTimeout(t); fn(); }; d.cancel = () => clearTimeout(t); return d; };
const pref = {
  get: (k, d) => { try { const v = localStorage.getItem('carnet.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('carnet.' + k, JSON.stringify(v)); } catch {} },
};
function fmtDate(ts) {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('fr-FR');
}
const fmtFull = (ts) => new Date(ts).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
function toast(msg, action, fn, ms = 3500) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; fn(); };
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
}
function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

const NOTE_COLORS = ['default', 'yellow', 'orange', 'pink', 'purple', 'blue', 'green', 'gray'];
const FOLDER_COLORS = ['#f26a2e', '#e53935', '#d81b60', '#8e24aa', '#3949ab', '#1e88e5', '#00897b', '#43a047', '#fdd835', '#757575'];
const TEXT_COLORS = ['#e53935', '#fb8c00', '#f9a825', '#43a047', '#1e88e5', '#3949ab', '#8e24aa', '#757575'];
const HL_COLORS = ['#fff176', '#ffcc80', '#f48fb1', '#ce93d8', '#90caf9', '#a5d6a7'];
const TRASH_DAYS = 30;

/* ================= Stockage local (IndexedDB) ================= */
const DB = (() => {
  let dbp;
  const open = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('carnet', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('items', { keyPath: 'id' }); r.result.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const done = (t) => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return {
    async all() { const d = await open(); return req(d.transaction('items').objectStore('items').getAll()); },
    async put(...items) { const d = await open(); const t = d.transaction('items', 'readwrite'); items.forEach((i) => t.objectStore('items').put(i)); return done(t); },
    async del(id) { const d = await open(); const t = d.transaction('items', 'readwrite'); t.objectStore('items').delete(id); return done(t); },
    async getMeta(k) { const d = await open(); return req(d.transaction('meta').objectStore('meta').get(k)); },
    async setMeta(k, v) { const d = await open(); const t = d.transaction('meta', 'readwrite'); t.objectStore('meta').put(v, k); return done(t); },
    async clear() { const d = await open(); const t = d.transaction(['items', 'meta'], 'readwrite'); t.objectStore('items').clear(); t.objectStore('meta').clear(); return done(t); },
  };
})();

/* ================= État ================= */
const S = {
  items: new Map(),
  view: pref.get('view', 'all'),
  search: '',
  sort: pref.get('sort', 'modified'),
  layout: pref.get('layout', 'grid'),
  theme: pref.get('theme', 'auto'),
  token: pref.get('token', null),
  selecting: false,
  selected: new Set(),
  editing: null, edNew: false, edSaved: false, edPending: false,
  savedRange: null,
  installPrompt: null,
};
const notes = () => [...S.items.values()].filter((i) => i.type === 'note' && !i.deleted);
const folders = () => [...S.items.values()].filter((i) => i.type === 'folder' && !i.deleted)
  .sort((a, b) => (a.data.order ?? 1e15) - (b.data.order ?? 1e15) || a.data.name.localeCompare(b.data.name, 'fr', { sensitivity: 'base' }));
const editedAt = (n) => n.data.edited_at || n.updated_at;
const DRAG = { active: false, renderPending: false };
let lastPointer = 'mouse';
document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);
const folderById = (id) => { const f = S.items.get(id); return f && f.type === 'folder' && !f.deleted ? f : null; };

async function saveItem(item) {
  const prev = S.items.get(item.id);
  const next = { ...item, updated_at: Math.max(Date.now(), (prev?.updated_at || 0) + 1), dirty: true };
  S.items.set(next.id, next);
  await DB.put(next);
  scheduleSync();
  return next;
}
const updateNote = (id, patch) => { const it = S.items.get(id); return saveItem({ ...it, data: { ...it.data, ...patch } }); };
const tombstone = (id) => { const it = S.items.get(id); if (it) return saveItem({ ...it, deleted: true, data: null }); };

/* ================= API & synchronisation ================= */
async function api(path, body) {
  const r = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: 'Bearer ' + S.token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || r.statusText), { status: r.status });
  return data;
}
let syncing = false, syncAgain = false;
const setSync = (s) => { $('#syncDot').className = 'sync-dot ' + s; $('#syncDot').title = { '': 'Synchronisé', sync: 'Synchronisation…', err: 'Erreur de synchronisation', off: 'Hors ligne' }[s] ?? ''; };
const scheduleSync = debounce(() => sync(), 1200);

async function sync() {
  if (!S.token) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true; setSync('sync');
  try {
    const dirty = [...S.items.values()].filter((i) => i.dirty);
    const since = (await DB.getMeta('rev')) || 0;
    const r = await api('/api/sync', {
      since,
      changes: dirty.map(({ id, type, data, updated_at, deleted }) => ({ id, type, data, updated_at, deleted: !!deleted })),
    });
    const toSave = [];
    for (const d of dirty) {
      const cur = S.items.get(d.id);
      if (cur === d) { cur.dirty = false; toSave.push(cur); } // pas modifié pendant l'envoi
    }
    let changed = false, editorHit = false;
    for (const s of r.changes) {
      const cur = S.items.get(s.id);
      if (cur && cur.updated_at > s.updated_at) continue; // version locale plus récente
      if (cur && !cur.dirty && cur.updated_at === s.updated_at) continue; // déjà à jour
      const it = { id: s.id, type: s.type, data: s.data, updated_at: s.updated_at, deleted: s.deleted, dirty: false };
      S.items.set(it.id, it); toSave.push(it); changed = true;
      if (it.id === S.editing) editorHit = true;
    }
    if (toSave.length) await DB.put(...toSave);
    await DB.setMeta('rev', r.rev);
    if (changed) { render(); if (editorHit) refreshEditorFromRemote(); }
    setSync('');
  } catch (e) {
    if (e.status === 401) { S.token = null; pref.set('token', null); showLogin(); setSync('off'); }
    else setSync(navigator.onLine ? 'err' : 'off');
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; setTimeout(sync, 200); }
  }
}

/* ================= Connexion ================= */
function showLogin() { $('#login').hidden = false; setTimeout(() => $('#loginPw').focus(), 50); }
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginErr').textContent = '';
  try {
    const r = await api('/api/login', { password: $('#loginPw').value });
    S.token = r.token; pref.set('token', r.token);
    $('#loginPw').value = ''; $('#login').hidden = true;
    // forcer une resynchronisation complète
    await DB.setMeta('rev', 0);
    S.items.forEach((i) => { i.dirty = true; });
    await sync();
  } catch (err) { $('#loginErr').textContent = err.message || 'Connexion impossible'; }
});

/* ================= Rendu de la liste ================= */
function viewName(v = S.view) {
  if (v === 'all') return 'Toutes les notes';
  if (v === 'fav') return 'Favoris';
  if (v === 'trash') return 'Corbeille';
  { const f = folderById(v); return f ? `${folderEmoji(f)} ${f.data.name}` : 'Dossier'; }
}
function visibleNotes() {
  let list = notes();
  if (S.view === 'trash') list = list.filter((n) => n.data.trashed);
  else {
    list = list.filter((n) => !n.data.trashed);
    if (S.view === 'fav') list = list.filter((n) => n.data.fav);
    else if (S.view !== 'all') list = list.filter((n) => n.data.folder === S.view);
  }
  if (S.search) {
    const q = S.search.toLowerCase();
    list = list.filter((n) => (n.data.title + '\n' + n.data.text).toLowerCase().includes(q));
  }
  const cmp = {
    modified: (a, b) => editedAt(b) - editedAt(a),
    custom: (a, b) => {
      const oa = a.data.order, ob = b.data.order;
      if (oa == null && ob == null) return editedAt(b) - editedAt(a);
      if (oa == null) return -1; if (ob == null) return 1; // les notes sans rang (nouvelles) en tête
      return oa - ob;
    },
    created: (a, b) => (b.data.created_at || 0) - (a.data.created_at || 0),
    title: (a, b) => (a.data.title || a.data.text || '').localeCompare(b.data.title || b.data.text || '', 'fr', { sensitivity: 'base' }),
  }[S.sort];
  return list.sort(cmp);
}
function cardHtml(n) {
  const d = n.data;
  const img = /<img[^>]+src="([^"]+)"/.exec(d.html || '');
  const total = (d.html || '').match(/<li[^>]*data-checked=/g)?.length || 0;
  const checked = (d.html || '').match(/data-checked="true"/g)?.length || 0;
  const folder = S.view === 'all' || S.view === 'fav' ? folderById(d.folder) : null;
  const preview = (d.text || '').replace(/\n{3,}/g, '\n\n').slice(0, 400);
  const sel = S.selected.has(n.id);
  return `<article class="card c-${d.color || 'default'}${sel ? ' selected' : ''}" data-id="${n.id}">
    <h3 class="c-title">${esc(d.title || (preview.split('\n')[0] || 'Sans titre'))}</h3>
    ${img ? `<img class="c-thumb" src="${esc(img[1])}" alt="" loading="lazy">` : ''}
    <div class="c-prev">${esc(d.title ? preview : preview.split('\n').slice(1).join('\n'))}</div>
    <div class="c-foot">
      <span>${fmtDate(S.sort === 'created' ? d.created_at || n.updated_at : editedAt(n))}</span>
      ${total ? `<span>· ☑ ${checked}/${total}</span>` : ''}
      ${folder ? `<span>· ${esc(folderEmoji(folder))} ${esc(folder.data.name)}</span>` : ''}
    </div>
    ${d.pinned ? `<i class="c-badge" data-i="pin">${svg('pin')}</i>` : d.fav ? `<i class="c-badge" data-i="star">${svg('star')}</i>` : ''}
    <span class="c-check"></span>
  </article>`;
}
function render() {
  if (DRAG.active) { DRAG.renderPending = true; return; }
  const list = visibleNotes();
  const box = $('#notes');
  box.className = 'notes ' + S.layout;
  $('#home').classList.toggle('selecting', S.selecting);
  $('#home').classList.toggle('in-trash', S.view === 'trash');
  if (S.view === 'trash') {
    box.innerHTML = list.length ? `<p class="section-label">Les notes sont supprimées définitivement après ${TRASH_DAYS} jours.</p>` + list.map(cardHtml).join('') : '';
  } else {
    const pinned = list.filter((n) => n.data.pinned), rest = list.filter((n) => !n.data.pinned);
    box.innerHTML = pinned.length
      ? `<p class="section-label">Épinglées</p>${pinned.map(cardHtml).join('')}${rest.length ? '<p class="section-label">Autres</p>' : ''}${rest.map(cardHtml).join('')}`
      : list.map(cardHtml).join('');
  }
  $('#empty').hidden = list.length > 0;
  $('#empty p').textContent = S.search ? 'Aucun résultat' : S.view === 'trash' ? 'La corbeille est vide' : 'Aucune note';
  $('#viewTitle').textContent = viewName();
  $('#viewCount').textContent = `${list.length} note${list.length > 1 ? 's' : ''}`;
  $('#fab').hidden = S.view === 'trash' || S.selecting;
  setIcon($('#layoutIcon'), S.layout === 'grid' ? 'list' : 'grid');
  $$('.only-trash').forEach((b) => { b.hidden = S.view !== 'trash'; });
  $$('.not-trash').forEach((b) => { b.hidden = S.view === 'trash'; });
  renderDrawer();
  renderSelbar();
}
function renderDrawer() {
  const all = notes().filter((n) => !n.data.trashed);
  const count = (f) => all.filter(f).length;
  const item = (v, icon, label, n, folder) => `<div class="drawer-row"${folder ? ` data-fid="${esc(v)}"` : ''}><button class="drawer-item${S.view === v ? ' active' : ''}" data-view="${esc(v)}">
      ${folder ? folderBadge(folder) : ic(icon)}<span>${esc(label)}</span><span class="n">${n ?? ''}</span></button>${folder ? `<button class="icon-btn fedit" data-fedit="${esc(v)}" title="Modifier">${svg('more')}</button>` : ''}</div>`;
  $('#drawerList').innerHTML =
    item('all', 'notes', 'Toutes les notes', all.length) +
    item('fav', 'star', 'Favoris', count((n) => n.data.fav)) +
    `<div class="drawer-sep"></div><div class="drawer-label">Dossiers</div>` +
    folders().map((f) => item(f.id, 'folder', f.data.name, count((n) => n.data.folder === f.id), f)).join('') +
    `<div class="drawer-sep"></div>` +
    item('trash', 'trash', 'Corbeille', notes().filter((n) => n.data.trashed).length);
}
function renderSelbar() {
  $('#selbar').hidden = !S.selecting;
  $('#toolbar').hidden = S.selecting;
  $('#selCount').textContent = S.selected.size ? `${S.selected.size} sélectionnée${S.selected.size > 1 ? 's' : ''}` : 'Sélectionner';
}
function setView(v) {
  S.view = v; pref.set('view', v);
  exitSelection(false);
  closeDrawer();
  render();
  window.scrollTo({ top: 0 });
}

/* ================= Tiroir ================= */
const openDrawer = () => { $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); };
const closeDrawer = () => { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); };
$('#scrim').onclick = closeDrawer;
$('#drawerList').addEventListener('click', (e) => {
  const ed = e.target.closest('[data-fedit]'); if (ed) return folderMenu(ed.dataset.fedit);
  const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view);
});
$('#drawerList').addEventListener('contextmenu', (e) => {
  if (lastPointer !== 'mouse') { e.preventDefault(); return; }
  const b = e.target.closest('[data-view]'); if (!b || !folderById(b.dataset.view)) return;
  e.preventDefault(); folderMenu(b.dataset.view);
});

/* ================= Sélection multiple ================= */
function enterSelection(id) { S.selecting = true; S.selected = new Set(id ? [id] : []); render(); }
function selectionUI() {
  $('#home').classList.toggle('selecting', S.selecting);
  $$('#notes .card').forEach((c) => c.classList.toggle('selected', S.selected.has(c.dataset.id)));
  $('#fab').hidden = S.view === 'trash' || S.selecting;
  renderSelbar();
}
function exitSelection(doRender = true) { S.selecting = false; S.selected.clear(); if (doRender) render(); }
function toggleSelect(id) { S.selected.has(id) ? S.selected.delete(id) : S.selected.add(id); if (!S.selected.size) return exitSelection(); render(); }

$('#notes').addEventListener('click', (e) => {
  const c = e.target.closest('.card'); if (!c) return;
  if (S.selecting) toggleSelect(c.dataset.id); else openEditor(c.dataset.id);
});
$('#notes').addEventListener('contextmenu', (e) => {
  if (lastPointer !== 'mouse') { e.preventDefault(); return; }
  const c = e.target.closest('.card'); if (!c) return;
  e.preventDefault(); S.selecting ? toggleSelect(c.dataset.id) : enterSelection(c.dataset.id);
});

/* ================= Glisser-déposer =================
   Souris : cliquer-glisser. Tactile/stylet : appui long (la note se sélectionne), puis glisser sans lever le doigt. */
function dragEngine(root, selector, o) {
  if (!root) { console.warn('ALBANOTES : élément absent pour', selector); return; }
  let st = null, suppressClick = false;
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(selector);
    if (!el || e.button > 0 || st || (o.canStart && !o.canStart(el))) return;
    const mouse = e.pointerType === 'mouse';
    st = { el, key: o.key(el), x: e.clientX, y: e.clientY, pid: e.pointerId, mouse, armed: mouse || !!o.immediate, dragging: false, fired: false };
    if (o.immediate) { e.preventDefault(); return; } // poignée dédiée : glisser sans appui long
    st.timer = setTimeout(() => {
      if (!st || st.dragging) return;
      st.fired = true;
      if (!mouse) { st.armed = true; navigator.vibrate?.(15); o.onArm?.(st); } else o.onLong?.(st);
    }, mouse ? 500 : 420);
  });
  window.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.pid) return;
    const d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
    if (!st.dragging) {
      if (!st.armed) { if (d > 10) { clearTimeout(st.timer); st = null; } return; } // défilement tactile
      if (d < 7) return;
      clearTimeout(st.timer); st.fired = true;
      if (o.onStart(st, e) === false) { st = null; return; }
      st.dragging = true; DRAG.active = true; document.body.classList.add('is-dragging');
    }
    o.onMove(st, e.clientX, e.clientY);
  });
  const end = (e) => {
    if (!st || e.pointerId !== st.pid) return;
    clearTimeout(st.timer);
    const s = st; st = null;
    if (s.fired) suppressClick = true;
    if (s.dragging) {
      DRAG.active = false; document.body.classList.remove('is-dragging');
      Promise.resolve(o.onEnd(s, e.clientX, e.clientY, e.type === 'pointercancel')).finally(() => {
        if (DRAG.renderPending) { DRAG.renderPending = false; render(); }
      });
    } else if (s.armed && !s.mouse && s.fired) o.onArmRelease?.(s);
    else if (!s.fired && o.onTap) { suppressClick = true; o.onTap(s); }
    setTimeout(() => { suppressClick = false; }, 350);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  root.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);
  // empêcher le défilement tactile une fois l'élément « saisi »
  root.addEventListener('touchmove', (e) => { if (st?.armed) e.preventDefault(); }, { passive: false });
  root.addEventListener('dragstart', (e) => e.preventDefault()); // pas de glisser natif des images
}

function makeGhost(el, x, y) {
  const r = el.getBoundingClientRect();
  const g = el.cloneNode(true);
  g.classList.add('drag-ghost'); g.classList.remove('selected');
  Object.assign(g.style, { width: r.width + 'px', height: r.height + 'px', left: '0px', top: '0px' });
  document.body.appendChild(g);
  const off = { x: x - r.left, y: y - r.top };
  g.style.transformOrigin = `${off.x}px ${off.y}px`;
  const move = (nx, ny, mini = false) => {
    g.style.transform = `translate(${nx - off.x}px, ${ny - off.y - (mini ? 70 : 0)}px) rotate(1.5deg) scale(${mini ? 0.38 : 1.03})`;
  };
  move(x, y);
  return { el: g, move, remove: () => g.remove() };
}
// défilement automatique près des bords
const autoScroll = { y: 0, raf: 0, el: null,
  set(y, el = document.scrollingElement) {
    const H = el === document.scrollingElement ? innerHeight : el.getBoundingClientRect().bottom, T = el === document.scrollingElement ? 0 : el.getBoundingClientRect().top;
    this.el = el; this.y = y < T + 70 ? -12 : y > H - 90 ? 12 : 0;
    if (this.y && !this.raf) { const step = () => { if (!this.y) { this.raf = 0; return; } this.el.scrollBy(0, this.y); this.raf = requestAnimationFrame(step); }; this.raf = requestAnimationFrame(step); }
  },
  stop() { this.y = 0; },
};
function clearMarks(root) { root.querySelectorAll('.drop-before, .drop-after, .drop-over').forEach((x) => x.classList.remove('drop-before', 'drop-after', 'drop-over')); }

/* ---- Notes : réordonner + ranger dans un dossier ---- */
function displayedNotes() {
  const list = visibleNotes();
  if (S.view === 'trash') return list;
  return [...list.filter((n) => n.data.pinned), ...list.filter((n) => !n.data.pinned)];
}
function showDropBar(ids) {
  const cur = ids.length === 1 ? S.items.get(ids[0])?.data.folder ?? null : undefined;
  const chip = (attr, inner, extra = '') => `<div class="drop-chip ${extra}" ${attr}>${inner}</div>`;
  $('#dropBar').innerHTML = `<div class="drop-title">Ranger ${ids.length > 1 ? `${ids.length} notes` : 'la note'} dans…</div><div class="drop-chips">` +
    folders().filter((f) => f.id !== cur).map((f) => chip(`data-drop="${esc(f.id)}"`, `${folderBadge(f)}<span>${esc(f.data.name)}</span>`)).join('') +
    (cur !== null ? chip('data-drop=""', `${ic('notes')}<span>Aucun dossier</span>`) : '') +
    chip('data-drop="__trash"', `${ic('trash')}<span>Corbeille</span>`, 'danger') + '</div>';
  hydrateIcons($('#dropBar'));
  $('#dropBar').hidden = false;
}
dragEngine($('#notes'), '.card', {
  key: (el) => el.dataset.id,
  onArm(st) { // appui long tactile : sélection sans redessiner la liste (le doigt reste sur la même carte)
    st.autoSel = !S.selecting;
    S.selecting = true; S.selected.add(st.key); selectionUI();
  },
  onLong(st) { st.autoSel = !S.selecting; if (!S.selecting) enterSelection(st.key); else toggleSelect(st.key); },
  onStart(st, e) {
    if (S.view === 'trash') return false;
    const el = $(`#notes .card[data-id="${CSS.escape(st.key)}"]`); if (!el) return false;
    st.ids = S.selecting && S.selected.has(st.key) ? [...S.selected] : [st.key];
    st.ghost = makeGhost(el, e.clientX, e.clientY);
    if (st.ids.length > 1) st.ghost.el.dataset.count = st.ids.length;
    $$('#notes .card').forEach((c) => { if (st.ids.includes(c.dataset.id)) c.classList.add('drag-src'); });
    $('#fab').hidden = true;
    showDropBar(st.ids);
  },
  onMove(st, x, y) {
    const barTop = $('#dropBar').getBoundingClientRect().top;
    st.ghost.move(x, y, y > barTop - 60);
    autoScroll.set(y > barTop - 60 ? innerHeight / 2 : y);
    clearMarks(document);
    st.target = null;
    const under = document.elementFromPoint(x, y);
    const chip = under?.closest('[data-drop]');
    if (chip) { chip.classList.add('drop-over'); st.target = { folder: chip.dataset.drop }; return; }
    const card = under?.closest('#notes .card');
    if (card && !st.ids.includes(card.dataset.id) && st.ids.length === 1) {
      const r = card.getBoundingClientRect();
      const after = S.layout === 'grid' ? x > r.left + r.width / 2 : y > r.top + r.height / 2;
      card.classList.add(after ? 'drop-after' : 'drop-before');
      st.target = { card: card.dataset.id, after };
    }
  },
  async onEnd(st, x, y, cancelled) {
    autoScroll.stop(); st.ghost?.remove(); clearMarks(document);
    $('#dropBar').hidden = true;
    $$('.drag-src').forEach((c) => c.classList.remove('drag-src'));
    const t = cancelled ? null : st.target;
    if (t?.folder !== undefined) {
      if (t.folder === '__trash') {
        for (const id of st.ids) await updateNote(id, { trashed: true, trashed_at: Date.now(), pinned: false });
        const ids = st.ids;
        toast(`${ids.length} note(s) placée(s) dans la corbeille`, 'Annuler', async () => { for (const id of ids) await updateNote(id, { trashed: false, trashed_at: null }); render(); });
      } else {
        const fid = t.folder || null;
        for (const id of st.ids) await updateNote(id, { folder: fid });
        toast(fid ? `Rangée dans ${folderEmoji(folderById(fid))} ${folderById(fid)?.data.name}` : 'Retirée du dossier');
      }
      if (S.selecting) exitSelection(false);
    } else if (t?.card) {
      await reorderNote(st.key, t.card, t.after);
      if (st.autoSel && S.selecting) exitSelection(false);
    }
    DRAG.renderPending = true;
  },
});
async function reorderNote(id, targetId, after) {
  if (S.sort !== 'custom') {
    // passer en tri personnalisé en figeant l'ordre affiché
    const shown = displayedNotes();
    S.sort = 'custom'; pref.set('sort', 'custom');
    toast('Tri personnalisé activé');
    for (let i = 0; i < shown.length; i++) if (shown[i].data.order !== i * 1000) await updateNote(shown[i].id, { order: i * 1000 });
  }
  let list = displayedNotes();
  if (list.some((n) => n.data.order == null)) { await normalizeOrder(list); list = displayedNotes(); }
  const moving = S.items.get(id), target = S.items.get(targetId);
  const rest = list.filter((n) => n.id !== id);
  let idx = rest.findIndex((n) => n.id === targetId) + (after ? 1 : 0);
  const prev = rest[idx - 1], next = rest[idx];
  const order = prev && next ? (prev.data.order + next.data.order) / 2 : prev ? prev.data.order + 1000 : next ? next.data.order - 1000 : 0;
  const patch = { order };
  if (S.view !== 'trash' && !!moving.data.pinned !== !!target.data.pinned) patch.pinned = !!target.data.pinned;
  await updateNote(id, patch);
}
async function normalizeOrder(list) {
  // attribue des rangs espacés en conservant l'ordre affiché, sans toucher aux notes déjà bien placées
  let last = -Infinity;
  for (let i = 0; i < list.length; i++) {
    const n = S.items.get(list[i].id), o = n.data.order;
    if (o != null && o > last) { last = o; continue; }
    const nextO = list.slice(i + 1).map((x) => S.items.get(x.id).data.order).find((v) => v != null && v > last);
    const val = last === -Infinity ? (nextO != null ? nextO - 1000 : i * 1000) : nextO != null ? (last + nextO) / 2 : last + 1000;
    await updateNote(n.id, { order: val });
    last = val;
  }
}

/* ---- Dossiers : réordonner dans le menu latéral ---- */
dragEngine($('#drawerList'), '.drawer-row[data-fid]', {
  key: (el) => el.dataset.fid,
  onArmRelease(st) { folderMenu(st.key); }, // appui long sans bouger : modifier le dossier
  onStart(st, e) {
    const el = $(`#drawerList .drawer-row[data-fid="${CSS.escape(st.key)}"]`); if (!el) return false;
    st.ghost = makeGhost(el, e.clientX, e.clientY); el.classList.add('drag-src');
  },
  onMove(st, x, y) {
    st.ghost.move(x, y); autoScroll.set(y, $('#drawerList'));
    clearMarks($('#drawerList')); st.target = null;
    const row = document.elementFromPoint(x, y)?.closest('#drawerList .drawer-row[data-fid]');
    if (row && row.dataset.fid !== st.key) {
      const r = row.getBoundingClientRect(), after = y > r.top + r.height / 2;
      row.classList.add(after ? 'drop-after' : 'drop-before'); st.target = { id: row.dataset.fid, after };
    }
  },
  async onEnd(st, x, y, cancelled) {
    autoScroll.stop(); st.ghost?.remove(); clearMarks($('#drawerList'));
    $$('#drawerList .drag-src').forEach((c) => c.classList.remove('drag-src'));
    if (cancelled || !st.target) return;
    const list = folders().filter((f) => f.id !== st.key);
    const idx = list.findIndex((f) => f.id === st.target.id) + (st.target.after ? 1 : 0);
    list.splice(idx, 0, S.items.get(st.key));
    for (let i = 0; i < list.length; i++) if (list[i].data.order !== i * 1000) await saveItem({ ...list[i], data: { ...list[i].data, order: i * 1000 } });
    DRAG.renderPending = true;
  },
});

/* ================= Feuilles (menus, dialogues) ================= */
let sheetResolve = null;
function openSheet(html, onClick) {
  const card = $('#sheetCard');
  card.innerHTML = html; hydrateIcons(card);
  $('#sheet').hidden = false;
  card.onclick = (e) => onClick?.(e);
  return card;
}
function closeSheet(value) {
  if ($('#sheet').hidden) return;
  $('#sheet').hidden = true;
  const r = sheetResolve; sheetResolve = null; r?.(value);
}
$('#sheet').addEventListener('pointerdown', (e) => { if (e.target.id === 'sheet') closeSheet(undefined); });

function promptBox(title, value = '', ok = 'OK') {
  return new Promise((resolve) => {
    sheetResolve = resolve;
    const card = openSheet(`<h3>${esc(title)}</h3><form><input type="text" value="${esc(value)}" maxlength="80">
      <div class="sheet-actions"><button type="button" class="btn-text" data-x>Annuler</button><button class="btn-text">${esc(ok)}</button></div></form>`,
    (e) => { if (e.target.closest('[data-x]')) closeSheet(null); });
    const inp = card.querySelector('input');
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    card.querySelector('form').onsubmit = (e) => { e.preventDefault(); closeSheet(inp.value.trim() || null); };
  });
}
function confirmBox(title, msg, ok = 'Supprimer') {
  return new Promise((resolve) => {
    sheetResolve = resolve;
    openSheet(`<h3>${esc(title)}</h3>${msg ? `<p class="muted">${esc(msg)}</p>` : ''}
      <div class="sheet-actions"><button class="btn-text" data-v="0">Annuler</button><button class="btn-text" data-v="1" style="color:#d93b3b">${esc(ok)}</button></div>`,
    (e) => { const b = e.target.closest('[data-v]'); if (b) closeSheet(b.dataset.v === '1'); });
  });
}
function pickFolder(current) {
  return new Promise((resolve) => {
    sheetResolve = resolve;
    const row = (id, label, f) => `<button class="sheet-item${(current ?? null) === id ? ' active' : ''}" data-f="${id ?? ''}">
      ${f ? folderBadge(f) : ic('notes')}<span>${esc(label)}</span></button>`;
    openSheet(`<h3>Déplacer vers</h3>${row(null, 'Aucun dossier')}${folders().map((f) => row(f.id, f.data.name, f)).join('')}
      <button class="sheet-item" data-new>${ic('folderPlus')}<span>Nouveau dossier</span></button>`,
    async (e) => {
      const b = e.target.closest('[data-f]');
      if (b) return closeSheet(b.dataset.f || null);
      if (e.target.closest('[data-new]')) {
        const r = sheetResolve; sheetResolve = null; $('#sheet').hidden = true;
        const f = await createFolder(); r(f ? f.id : undefined);
      }
    });
  });
}

/* ================= Dossiers ================= */
/* Émoticônes de dossiers, groupées par thème [emoji, libellé, mots-clés] */
const FOLDER_EMOJIS = [
  ['Maison', [['🏠', 'Maison', 'maison logement'], ['🛋️', 'Salon', 'salon déco'], ['🍳', 'Cuisine', 'cuisine recette'], ['🛒', 'Courses', 'courses achat marché'], ['🧹', 'Ménage', 'ménage menage'], ['🔧', 'Bricolage', 'bricolage travaux réparation'], ['🌱', 'Jardin', 'jardin potager plante'], ['💡', 'Domotique', 'domotique home assistant'], ['🧾', 'Factures', 'facture factures'], ['🔑', 'Codes', 'code codes mot de passe wifi']]],
  ['Bureau', [['💼', 'Bureau', 'bureau travail boulot'], ['📁', 'Dossiers', 'dossier dossiers'], ['📅', 'Agenda', 'agenda rendez-vous rdv'], ['📞', 'Appels', 'appel appels téléphone'], ['✉️', 'Courrier', 'courrier mail email'], ['📊', 'Chiffres', 'chiffres stats budget'], ['💻', 'Informatique', 'informatique pc serveur proxmox homelab'], ['📝', 'Réunions', 'réunion reunion compte-rendu'], ['🎯', 'Objectifs', 'objectif objectifs'], ['🚀', 'Projets', 'projet projets']]],
  ['Loisirs', [['🎮', 'Jeux', 'jeu jeux loisir loisirs'], ['🎬', 'Films', 'film films série séries'], ['🎵', 'Musique', 'musique chanson'], ['📚', 'Lecture', 'livre livres lecture'], ['⚽', 'Sport', 'sport foot'], ['🚴', 'Vélo', 'vélo velo'], ['🎣', 'Pêche', 'pêche peche'], ['📷', 'Photo', 'photo photos'], ['🎨', 'Art', 'art dessin peinture'], ['✈️', 'Voyages', 'voyage voyages vacances']]],
  ['Vie perso', [['👨‍👩‍👧', 'Famille', 'famille enfants'], ['❤️', 'Perso', 'perso personnel'], ['🎁', 'Cadeaux', 'cadeau cadeaux noël anniversaire'], ['🎉', 'Fêtes', 'fête fêtes événement'], ['🐾', 'Animaux', 'animaux chien chat'], ['💊', 'Santé', 'santé sante médecin'], ['💶', 'Argent', 'argent banque budget finances'], ['🚗', 'Voiture', 'voiture auto garage'], ['🎓', 'École', 'école ecole cours études'], ['🍷', 'Vins', 'vin vins cave']]],
  ['Divers', [['📌', 'Divers', 'divers autre'], ['⭐', 'Important', 'important'], ['⏰', 'Rappels', 'rappel rappels'], ['💭', 'Idées', 'idée idées idee'], ['✅', 'À faire', 'à faire todo tâches'], ['📋', 'Listes', 'liste listes'], ['🔒', 'Privé', 'privé secret'], ['🗂️', 'Archives', 'archive archives'], ['🌍', 'Monde', 'monde actualité'], ['🧪', 'Tests', 'test tests essai']]],
];
const ALL_EMOJIS = FOLDER_EMOJIS.flatMap(([, list]) => list);
function guessEmoji(name) {
  const n = name.toLowerCase();
  const hit = ALL_EMOJIS.find(([, label, kw]) => kw.split(' ').some((k) => k.length > 2 && n.includes(k)) || n.includes(label.toLowerCase()));
  return hit ? hit[0] : '📁';
}
const folderEmoji = (f) => f?.data.emoji || (f ? guessEmoji(f.data.name) : '📁');
const folderBadge = (f, big = false) => `<span class="femoji${big ? ' big' : ''}" style="--fc:${esc(f.data.color || FOLDER_COLORS[0])}">${esc(folderEmoji(f))}</span>`;

/* Feuille unique de création / modification d'un dossier : nom + émoticône + couleur */
function folderEditor(f) {
  const isNew = !f;
  const used = new Set(folders().map((x) => x.data.color));
  const st = { name: f?.data.name || '', emoji: f?.data.emoji || '', color: f?.data.color || FOLDER_COLORS.find((c) => !used.has(c)) || FOLDER_COLORS[0], touched: !!f?.data.emoji };
  return new Promise((resolve) => {
    sheetResolve = resolve;
    const card = openSheet(`<h3>${isNew ? 'Nouveau dossier' : 'Modifier le dossier'}</h3>
      <form class="fe-form">
        <div class="fe-head"><span class="femoji big" id="fePrev"></span><input type="text" id="feName" maxlength="60" placeholder="Nom du dossier" value="${esc(st.name)}"></div>
        <div class="drawer-label">Couleur</div>
        <div class="sheet-row">${FOLDER_COLORS.map((c) => `<button type="button" class="sw" style="background:${c}" data-c="${c}"></button>`).join('')}</div>
        <div class="drawer-label">Émoticône</div>
        <div class="emoji-tabs">${FOLDER_EMOJIS.map(([g], i) => `<button type="button" data-tab="${i}">${esc(g)}</button>`).join('')}</div>
        <div class="emoji-grid" id="feGrid"></div>
        <div class="sheet-actions">
          ${isNew ? '' : `<button type="button" class="btn-text danger-text" data-del>Supprimer</button><span class="spacer"></span>`}
          <button type="button" class="btn-text" data-x>Annuler</button><button class="btn-text">${isNew ? 'Créer' : 'Enregistrer'}</button>
        </div>
      </form>`,
    async (e) => {
      const c = e.target.closest('[data-c]'); if (c) { st.color = c.dataset.c; return paint(); }
      const em = e.target.closest('[data-e]'); if (em) { st.emoji = em.dataset.e; st.touched = true; return paint(); }
      const t = e.target.closest('[data-tab]'); if (t) { tab = +t.dataset.tab; return paint(); }
      if (e.target.closest('[data-x]')) return closeSheet(undefined);
      if (e.target.closest('[data-del]')) return closeSheet('delete');
    });
    const inp = card.querySelector('#feName');
    let tab = Math.max(0, FOLDER_EMOJIS.findIndex(([, l]) => l.some(([e]) => e === st.emoji)));
    function paint() {
      const prev = card.querySelector('#fePrev');
      prev.textContent = st.emoji || guessEmoji(st.name); prev.style.setProperty('--fc', st.color);
      card.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', b.dataset.c === st.color));
      card.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', +b.dataset.tab === tab));
      const cur = st.emoji || guessEmoji(st.name);
      card.querySelector('#feGrid').innerHTML = FOLDER_EMOJIS[tab][1].map(([e, l]) =>
        `<button type="button" class="emoji-btn${e === cur ? ' active' : ''}" data-e="${e}" title="${esc(l)}"><span>${e}</span><small>${esc(l)}</small></button>`).join('');
    }
    inp.addEventListener('input', () => { st.name = inp.value; if (!st.touched) paint(); });
    card.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const name = inp.value.trim(); if (!name) { inp.focus(); return; }
      closeSheet({ name, emoji: st.emoji || guessEmoji(name), color: st.color });
    };
    paint();
    if (isNew) setTimeout(() => inp.focus(), 50);
  });
}
async function createFolder() {
  const r = await folderEditor(null);
  if (!r || r === 'delete') return null;
  return saveItem({ id: uid(), type: 'folder', deleted: false, data: { ...r, order: Math.max(0, ...folders().map((f) => f.data.order ?? 0)) + 1000 } });
}
async function folderMenu(id) {
  const f = folderById(id); if (!f) return;
  closeDrawer();
  const r = await folderEditor(f);
  if (!r) return;
  if (r === 'delete') {
    if (await confirmBox(`Supprimer « ${f.data.name} » ?`, 'Les notes qu’il contient seront conservées dans « Toutes les notes ».')) {
      for (const n of notes().filter((x) => x.data.folder === id)) await updateNote(n.id, { folder: null });
      await tombstone(id);
      if (S.view === id) S.view = 'all';
    }
  } else await saveItem({ ...f, data: { ...f.data, ...r } });
  render();
}

/* ================= Actions de la liste ================= */
async function selectionAction(a) {
  const ids = [...S.selected];
  if (a === 'sel-cancel') return exitSelection();
  if (a === 'sel-all') { S.selected = new Set(visibleNotes().map((n) => n.id)); return render(); }
  if (!ids.length) return;
  if (a === 'sel-fav') {
    const val = ids.some((id) => !S.items.get(id).data.fav);
    for (const id of ids) await updateNote(id, { fav: val });
  }
  if (a === 'sel-move') {
    const f = await pickFolder(); if (f === undefined) return;
    for (const id of ids) await updateNote(id, { folder: f });
    toast(`${ids.length} note(s) déplacée(s)`);
  }
  if (a === 'sel-restore') for (const id of ids) await updateNote(id, { trashed: false, trashed_at: null });
  if (a === 'sel-delete') {
    if (S.view === 'trash') {
      if (!(await confirmBox(`Supprimer définitivement ${ids.length} note(s) ?`, 'Cette action est irréversible.'))) return;
      for (const id of ids) await tombstone(id);
    } else {
      for (const id of ids) await updateNote(id, { trashed: true, trashed_at: Date.now(), pinned: false });
      toast(`${ids.length} note(s) placée(s) dans la corbeille`, 'Annuler', async () => {
        for (const id of ids) await updateNote(id, { trashed: false, trashed_at: null }); render();
      });
    }
  }
  exitSelection();
}

function sortMenu() {
  const opt = (v, l) => `<button class="sheet-item${S.sort === v ? ' active' : ''}" data-s="${v}">${ic('sort')}<span>${l}</span></button>`;
  openSheet(`<h3>Trier par</h3>${opt('custom', 'Personnalisé (glisser-déposer)')}${opt('modified', 'Date de modification')}${opt('created', 'Date de création')}${opt('title', 'Titre')}<p class="muted">Astuce : maintenez une note (ou cliquez-glissez à la souris) pour la déplacer ou la ranger dans un dossier.</p>`,
    (e) => { const b = e.target.closest('[data-s]'); if (b) { S.sort = b.dataset.s; pref.set('sort', S.sort); closeSheet(); render(); } });
}

function toggleSearch(open = !$('#searchWrap').classList.contains('open')) {
  $('#searchWrap').classList.toggle('open', open);
  $('#toolbar').classList.toggle('searching', open);
  if (open) { $('#search').focus(); window.scrollTo({ top: $('.hero').offsetHeight, behavior: 'smooth' }); }
  else { $('#search').value = ''; S.search = ''; render(); }
}
$('#search').addEventListener('input', debounce(() => { S.search = $('#search').value.trim(); render(); }, 150));
$('#search').addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleSearch(false); });

/* ================= Paramètres ================= */
function applyTheme() {
  if (S.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = S.theme;
  const dark = S.theme === 'dark' || (S.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name=theme-color]').forEach((m) => { m.content = dark ? '#0f0f0f' : '#f6f6f6'; });
}
async function settingsMenu() {
  closeDrawer();
  let info = '';
  try { const s = await api('/api/stats'); info = `Serveur v${s.version} · ${s.note || 0} notes · ${s.folder || 0} dossiers`; }
  catch { info = 'Serveur injoignable — les modifications seront envoyées au retour du réseau.'; }
  const pending = [...S.items.values()].filter((i) => i.dirty).length;
  const seg = (v, l) => `<button class="${S.theme === v ? 'on' : ''}" data-t="${v}">${l}</button>`;
  openSheet(`<h3>Paramètres</h3>
    <div class="drawer-label">Thème</div>
    <div class="seg">${seg('auto', 'Auto')}${seg('light', 'Clair')}${seg('dark', 'Sombre')}</div>
    ${S.installPrompt ? `<button class="sheet-item" data-a="install">${ic('install')}<span>Installer l’application</span></button>` : ''}
    <button class="sheet-item" data-a="sync">${ic('sync')}<span>Synchroniser maintenant${pending ? ` (${pending} en attente)` : ''}</span></button>
    <button class="sheet-item" data-a="export">${ic('download')}<span>Exporter toutes les notes (JSON)</span></button>
    <button class="sheet-item" data-a="import">${ic('upload')}<span>Importer (JSON ALBANOTES ou .txt/.md)</span></button>
    <button class="sheet-item danger" data-a="logout">${ic('logout')}<span>Se déconnecter de cet appareil</span></button>
    <p class="muted">${esc(info)}</p>`,
  async (e) => {
    const t = e.target.closest('[data-t]');
    if (t) { S.theme = t.dataset.t; pref.set('theme', S.theme); applyTheme(); $$('.seg button', $('#sheetCard')).forEach((b) => b.classList.toggle('on', b === t)); return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    closeSheet();
    if (a === 'install') { S.installPrompt.prompt(); S.installPrompt = null; }
    if (a === 'sync') { await sync(); toast($('#syncDot').classList.contains('err') || $('#syncDot').classList.contains('off') ? 'Synchronisation impossible' : 'Synchronisé'); }
    if (a === 'export') exportAll();
    if (a === 'import') importFiles();
    if (a === 'logout') {
      const pend = [...S.items.values()].filter((i) => i.dirty).length;
      if (!(await confirmBox('Se déconnecter ?', pend ? `${pend} modification(s) non synchronisée(s) seront perdues.` : 'Les notes locales de cet appareil seront effacées (elles restent sur le serveur).', 'Déconnexion'))) return;
      try { await api('/api/logout', {}); } catch {}
      S.token = null; pref.set('token', null);
      S.items.clear(); await DB.clear(); render(); showLogin();
    }
  });
}
function exportAll() {
  const out = { app: 'carnet', exported_at: new Date().toISOString(),
    folders: folders().map((f) => ({ id: f.id, ...f.data })),
    notes: notes().map((n) => ({ id: n.id, updated_at: n.updated_at, ...n.data })) };
  download(`albanotes-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(out, null, 1), 'application/json');
}
function importFiles() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.multiple = true; inp.accept = '.json,.txt,.md,text/plain,application/json';
  inp.onchange = async () => {
    let n = 0;
    for (const file of inp.files) {
      const txt = await file.text();
      if (file.name.endsWith('.json')) {
        try {
          const j = JSON.parse(txt);
          for (const f of j.folders || []) if (!S.items.has(f.id)) await saveItem({ id: f.id, type: 'folder', deleted: false, data: { name: f.name, color: f.color, emoji: f.emoji || guessEmoji(f.name) } });
          for (const x of j.notes || []) {
            const { id, updated_at, ...data } = x;
            await saveItem({ id: S.items.has(id) ? uid() : id, type: 'note', deleted: false, data: { ...data, created_at: data.created_at || updated_at || Date.now() } });
            n++;
          }
        } catch { toast(`Fichier invalide : ${file.name}`); }
      } else {
        const html = txt.split('\n').map((l) => `<div>${esc(l) || '<br>'}</div>`).join('');
        await saveItem({ id: uid(), type: 'note', deleted: false, data: { title: file.name.replace(/\.(txt|md)$/i, ''), html, text: txt, folder: null, color: 'default', fav: false, pinned: false, trashed: false, created_at: file.lastModified || Date.now() } });
        n++;
      }
    }
    render(); toast(`${n} note(s) importée(s)`);
  };
  inp.click();
}

/* ================= Éditeur ================= */
const ed = { root: $('#editor'), title: $('#edTitle'), body: $('#edBody') };
const commitDebounced = debounce(() => commitEditor(), 500);

function newNote(prefill = {}) {
  const folder = !['all', 'fav', 'trash'].includes(S.view) ? S.view : null;
  const it = { id: uid(), type: 'note', deleted: false, updated_at: Date.now(), dirty: false,
    data: { title: '', html: '', text: '', order: Math.min(0, ...notes().map((n) => n.data.order ?? 0)) - 1000, folder, color: 'default', fav: S.view === 'fav', pinned: false, trashed: false, created_at: Date.now(), ...prefill } };
  S.items.set(it.id, it);
  openEditor(it.id, true);
  if (prefill.html) { S.edPending = true; commitEditor(); }
  else setTimeout(() => ed.body.focus(), 60);
}
function openEditor(id, isNew = false) {
  const it = S.items.get(id); if (!it) return;
  S.editing = id; S.edNew = isNew; S.edSaved = !isNew; S.edPending = false;
  fillEditor(it);
  ed.root.hidden = false;
  ed.root.scrollTop = 0; $('#edScroll').scrollTop = 0;
  if (!history.state?.editor) history.pushState({ editor: true }, '');
  if (it.data.trashed) toast('Note dans la corbeille', 'Restaurer', async () => { await updateNote(id, { trashed: false, trashed_at: null }); render(); });
}
function fillEditor(it) {
  ed.title.value = it.data.title || '';
  ed.body.innerHTML = it.data.html || '';
  ed.root.className = 'editor c-' + (it.data.color || 'default');
  updateEditorMeta(it);
  relayout();
}
function updateEditorMeta(it = S.items.get(S.editing)) {
  if (!it) return;
  setIcon($('#edFavIcon'), it.data.fav ? 'star' : 'starO');
  $('[data-action="ed-fav"]').classList.toggle('on', !!it.data.fav);
  { const f = folderById(it.data.folder); $('#edFolder').textContent = f ? `${folderEmoji(f)} ${f.data.name}` : 'Aucun dossier'; }
  $('#edDate').textContent = S.edSaved ? 'Modifiée ' + fmtFull(editedAt(it)) : '';
}
function refreshEditorFromRemote() {
  const it = S.items.get(S.editing);
  if (!it || it.deleted) { toast('Cette note a été supprimée sur un autre appareil'); closeEditor(); return; }
  if (S.edPending) return; // modifications locales en cours : elles gagneront
  if (it.data.html !== ed.body.innerHTML || it.data.title !== ed.title.value) fillEditor(it);
  else updateEditorMeta(it);
}
function markDirty() { S.edPending = true; commitDebounced(); }
function cleanHtml(html) { return html.replace(/<br>$/, '').trim() === '' ? '' : html; }
async function commitEditor() {
  commitDebounced.cancel();
  const it = S.items.get(S.editing);
  if (!it || !S.edPending) return;
  S.edPending = false;
  const html = cleanHtml(ed.body.innerHTML);
  const title = ed.title.value.trim();
  if (title === it.data.title && html === it.data.html) return;
  const text = ed.body.innerText.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000);
  if (!S.edSaved && !title && !text && !/<img/.test(html)) return; // note neuve encore vide
  await saveItem({ ...it, data: { ...it.data, title, html, text, edited_at: Date.now() } });
  S.edSaved = true;
  updateEditorMeta();
  render();
}
async function closeEditor(fromPop = false) {
  if (ed.root.hidden) return;
  await commitEditor();
  const it = S.items.get(S.editing);
  if (it && !it.deleted) {
    const empty = !it.data.title && !it.data.text && !/<img/.test(it.data.html || '');
    if (empty) { if (S.edSaved) await tombstone(it.id); else S.items.delete(it.id); }
  }
  ed.root.hidden = true;
  S.editing = null;
  render();
  if (!fromPop && history.state?.editor) goBack();
}
let ignorePop = false;
const goBack = () => { ignorePop = true; history.back(); };
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop = false; return; }
  if (!$('#sheet').hidden) { closeSheet(); history.pushState({ editor: !ed.root.hidden }, ''); return; }
  if (!$('#draw').hidden) { closeDraw(); return; }
  if (!ed.root.hidden) closeEditor(true);
});

ed.title.addEventListener('input', markDirty);
ed.title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ed.body.focus(); placeCaretStart(ed.body); } });
ed.body.addEventListener('input', markDirty);
ed.body.addEventListener('focus', () => document.execCommand('defaultParagraphSeparator', false, 'div'));

function placeCaretStart(el) { const r = document.createRange(); r.setStart(el, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
function saveRange() { const s = getSelection(); if (s.rangeCount && ed.body.contains(s.anchorNode)) S.savedRange = s.getRangeAt(0).cloneRange(); }
function restoreRange() {
  ed.body.focus();
  if (S.savedRange && ed.body.contains(S.savedRange.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(S.savedRange); }
  else { const r = document.createRange(); r.selectNodeContents(ed.body); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
}
const closestInBody = (sel) => { const n = getSelection().anchorNode; const el = n?.nodeType === 1 ? n : n?.parentElement; const t = el?.closest(sel); return t && ed.body.contains(t) ? t : null; };

// Cases à cocher
ed.body.addEventListener('click', (e) => {
  const li = e.target.closest('ul.checklist > li');
  if (li && e.target === li && e.offsetX < 28) {
    li.dataset.checked = li.dataset.checked === 'true' ? 'false' : 'true';
    markDirty();
  }
});
ed.body.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const li = closestInBody('ul.checklist > li');
    if (li) setTimeout(() => { const n = closestInBody('ul.checklist > li'); if (n && n !== li) n.dataset.checked = 'false'; }, 0);
  }
  if (e.key === 'Tab') { e.preventDefault(); document.execCommand(e.shiftKey ? 'outdent' : 'indent'); }
});
function keepCaret(fn) {
  // Chrome replace le curseur en début de ligne après insertUnorderedList : on le remet au même caractère
  const sel = getSelection(); const node = sel.anchorNode, off = sel.anchorOffset;
  const txt = node?.nodeType === 3 ? node.textContent : null;
  fn();
  const li = closestInBody('li');
  if (txt === null || !li) return;
  let pos = li.textContent.indexOf(txt); if (pos < 0) return;
  pos += off;
  const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    if (pos <= t.length) { const r = document.createRange(); r.setStart(t, pos); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); return; }
    pos -= t.length;
  }
}
function toggleChecklist() { keepCaret(toggleChecklistRaw); }
function toggleChecklistRaw() {
  const ul = closestInBody('ul');
  if (ul?.classList.contains('checklist')) { document.execCommand('insertUnorderedList'); }
  else if (ul) { ul.classList.add('checklist'); [...ul.children].forEach((li) => { li.dataset.checked ||= 'false'; }); }
  else {
    document.execCommand('insertUnorderedList');
    const nu = closestInBody('ul');
    if (nu) { nu.classList.add('checklist'); [...nu.children].forEach((li) => { li.dataset.checked = 'false'; }); }
  }
  markDirty();
}

// Collage : texte brut + images
ed.body.addEventListener('paste', async (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  e.preventDefault();
  if (files.length) { for (const f of files) insertImage(await compressImage(f)); return; }
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
});
ed.body.addEventListener('drop', async (e) => {
  const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  for (const f of files) insertImage(await compressImage(f));
});

function compressImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      const webp = c.toDataURL('image/webp', 0.82);
      resolve(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
function insertImage(src, cls = '') {
  restoreRange();
  // Dans une liste : insérer sous la liste plutôt que dans l'élément
  let list = closestInBody('ul, ol');
  while (list?.parentElement?.closest('ul, ol') && ed.body.contains(list.parentElement)) list = list.parentElement.closest('ul, ol');
  if (list) {
    const div = document.createElement('div'); div.innerHTML = '<br>'; list.after(div);
    const r = document.createRange(); r.setStart(div, 0); r.collapse(true); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }
  document.execCommand('insertHTML', false, `<img src="${src}"${cls ? ` class="${cls}"` : ''} alt=""><div><br></div>`);
  saveRange();
  markDirty();
}
$('#imgInput').addEventListener('change', async (e) => {
  for (const f of e.target.files) insertImage(await compressImage(f));
  e.target.value = '';
});

// Barre d'outils de l'éditeur
$('#edTools').addEventListener('pointerdown', (e) => { if (e.target.closest('.tool')) { saveRange(); e.preventDefault(); } });
$('#edTools').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cmd]'); if (!b) return;
  const cmd = b.dataset.cmd;
  if (cmd === 'checklist') { restoreRange(); return toggleChecklist(); }
  if (cmd === 'block') return createBlock();
  if (cmd === 'image') return $('#imgInput').click();
  if (cmd === 'draw') return openDraw();
  if (cmd === 'text') return textStyleMenu();
  if (cmd === 'color') return colorMenu('foreColor');
  if (cmd === 'highlight') return colorMenu('hiliteColor');
  restoreRange();
  if (cmd === 'hr') document.execCommand('insertHorizontalRule');
  else document.execCommand(cmd);
  markDirty();
});
function textStyleMenu() {
  const blk = (tag, label, style) => `<button class="sheet-item" data-b="${tag}"><span style="${style}">${label}</span></button>`;
  const al = (v, l) => `<button data-al="${v}">${l}</button>`;
  openSheet(`<h3>Style du texte</h3>${blk('h2', 'Titre', 'font-size:1.4em;font-weight:700')}${blk('h3', 'Sous-titre', 'font-size:1.15em;font-weight:600')}${blk('div', 'Texte normal', '')}
    <div class="drawer-label">Alignement</div><div class="seg">${al('justifyLeft', 'Gauche')}${al('justifyCenter', 'Centre')}${al('justifyRight', 'Droite')}</div>
    <button class="sheet-item" data-b="clear">${ic('close')}<span>Effacer la mise en forme</span></button>`,
  (e) => {
    const b = e.target.closest('[data-b]'), a = e.target.closest('[data-al]');
    if (!b && !a) return;
    closeSheet(); restoreRange();
    if (a) document.execCommand(a.dataset.al);
    else if (b.dataset.b === 'clear') document.execCommand('removeFormat');
    else document.execCommand('formatBlock', false, b.dataset.b);
    markDirty();
  });
}
function colorMenu(cmd) {
  const list = cmd === 'foreColor' ? TEXT_COLORS : HL_COLORS;
  openSheet(`<h3>${cmd === 'foreColor' ? 'Couleur du texte' : 'Surlignage'}</h3>
    <div class="sheet-row">${list.map((c) => `<button class="sw" style="background:${c}" data-c="${c}"></button>`).join('')}</div>
    <button class="sheet-item" data-c="none">${ic('close')}<span>${cmd === 'foreColor' ? 'Couleur par défaut' : 'Aucun surlignage'}</span></button>`,
  (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    closeSheet(); restoreRange();
    document.execCommand('styleWithCSS', false, true);
    if (b.dataset.c === 'none') {
      if (cmd === 'hiliteColor') document.execCommand('hiliteColor', false, 'transparent');
      else document.execCommand('removeFormat');
    } else document.execCommand(cmd, false, b.dataset.c);
    document.execCommand('styleWithCSS', false, false);
    markDirty();
  });
}
function editorMore() {
  const it = S.items.get(S.editing); if (!it) return;
  const d = it.data;
  const sw = (c) => `<button class="sw${(d.color || 'default') === c ? ' active' : ''}" data-col="${c}" style="background:${c === 'default' ? 'var(--surface)' : `var(--n-${c})`}" title="${c}"></button>`;
  openSheet(`<h3>Note</h3>
    <div class="drawer-label">Couleur de fond</div><div class="sheet-row">${NOTE_COLORS.map(sw).join('')}</div>
    <button class="sheet-item" data-a="pin">${ic('pin')}<span>${d.pinned ? 'Désépingler' : 'Épingler en haut'}</span></button>
    <button class="sheet-item" data-a="move">${ic('folder')}<span>Déplacer vers un dossier</span></button>
    <button class="sheet-item" data-a="copy">${ic('copy')}<span>Copier le texte</span></button>
    ${navigator.share ? `<button class="sheet-item" data-a="share">${ic('share')}<span>Partager</span></button>` : ''}
    <button class="sheet-item" data-a="txt">${ic('download')}<span>Exporter en .txt</span></button>
    ${d.trashed
      ? `<button class="sheet-item" data-a="restore">${ic('restore')}<span>Restaurer</span></button>
         <button class="sheet-item danger" data-a="purge">${ic('trash')}<span>Supprimer définitivement</span></button>`
      : `<button class="sheet-item danger" data-a="delete">${ic('trash')}<span>Placer dans la corbeille</span></button>`}
    <p class="muted">Créée ${fmtFull(d.created_at || it.updated_at)}</p>`,
  async (e) => {
    const col = e.target.closest('[data-col]');
    await commitEditor();
    const cur = S.items.get(S.editing);
    if (col) { closeSheet(); await updateNote(cur.id, { color: col.dataset.col }); S.edSaved = true; ed.root.className = 'editor c-' + col.dataset.col; render(); return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    closeSheet();
    const text = [cur.data.title, cur.data.text].filter(Boolean).join('\n\n');
    if (a === 'pin') { await updateNote(cur.id, { pinned: !cur.data.pinned }); S.edSaved = true; toast(cur.data.pinned ? 'Désépinglée' : 'Épinglée'); }
    if (a === 'move') { const f = await pickFolder(cur.data.folder); if (f !== undefined) { await updateNote(cur.id, { folder: f }); S.edSaved = true; } }
    if (a === 'copy') { await navigator.clipboard?.writeText(text); toast('Texte copié'); }
    if (a === 'share') navigator.share({ title: cur.data.title || 'Note', text }).catch(() => {});
    if (a === 'txt') download(`${(cur.data.title || 'note').replace(/[\\/:*?"<>|]/g, '_')}.txt`, text, 'text/plain;charset=utf-8');
    if (a === 'delete') { await updateNote(cur.id, { trashed: true, trashed_at: Date.now(), pinned: false }); S.edSaved = true; await closeEditor(); toast('Note placée dans la corbeille', 'Annuler', async () => { await updateNote(cur.id, { trashed: false, trashed_at: null }); render(); }); return; }
    if (a === 'restore') { await updateNote(cur.id, { trashed: false, trashed_at: null }); toast('Note restaurée'); }
    if (a === 'purge') { if (await confirmBox('Supprimer définitivement ?', 'Cette action est irréversible.')) { await tombstone(cur.id); ed.root.hidden = true; S.editing = null; if (history.state?.editor) goBack(); render(); } return; }
    updateEditorMeta(); render();
  });
}

/* ================= Blocs déplaçables dans une note =================
   Un bloc = <div class="nb" data-c="couleur"> … </div> au premier niveau de la note.
   Poignée ⠿ en haut à droite : glisser pour le déplacer, toucher pour le menu. */
const BLOCK_COLORS = ['default', 'yellow', 'orange', 'pink', 'purple', 'blue', 'green', 'gray'];
const blkLayer = $('#blkLayer');
const topLevel = (node) => { let n = node?.nodeType === 1 ? node : node?.parentElement; while (n && n.parentElement !== ed.body) n = n.parentElement; return n && ed.body.contains(n) ? n : null; };
function layoutBlocks() {
  if (ed.root.hidden || !blkLayer) return;
  const blocks = [...ed.body.children].filter((c) => c.classList.contains('nb'));
  blkLayer.innerHTML = blocks.map((b, i) =>
    `<button class="blk-h" data-i="${i}" title="Déplacer (glisser) · Options (toucher)" style="top:${b.offsetTop + 6}px;left:${b.offsetLeft + b.offsetWidth - 38}px">
      <svg viewBox="0 0 24 24"><path d="M9 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg></button>`).join('');
}
const relayout = () => requestAnimationFrame(layoutBlocks);
ed.body.addEventListener('input', relayout);
ed.body.addEventListener('load', relayout, true); // images chargées
window.addEventListener('resize', relayout);
function normalizeTop() { // texte « nu » au premier niveau → ligne <div>
  for (const nd of [...ed.body.childNodes]) {
    if (nd.nodeType === 3 && nd.textContent.trim() === '' && nd.textContent.indexOf('\u00a0') < 0) { nd.remove(); continue; }
    if (nd.nodeType === 3 || (nd.nodeType === 1 && ['B', 'I', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'A', 'BR'].includes(nd.tagName))) {
      const d = document.createElement('div'); nd.before(d);
      let x = d.nextSibling;
      while (x && (x.nodeType === 3 || ['B', 'I', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'A'].includes(x.tagName))) { const nx = x.nextSibling; d.appendChild(x); x = nx; }
      if (x && x.tagName === 'BR') x.remove();
      if (!d.firstChild) d.innerHTML = '<br>';
    }
  }
}
const blockAt = (i) => [...ed.body.children].filter((c) => c.classList.contains('nb'))[+i];

function placeCaretIn(el, atEnd = true) {
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(!atEnd);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
// Créer un bloc : encadre les lignes sélectionnées (ou la ligne courante), ou un bloc vide
function createBlock() {
  restoreRange();
  { const sel = getSelection(), an = sel.anchorNode, ao = sel.anchorOffset, fn = sel.focusNode, fo = sel.focusOffset;
    normalizeTop(); try { sel.setBaseAndExtent(an, ao, fn, fo); } catch {} }
  const sel = getSelection();
  if (closestInBody('.nb')) return blockMenu(closestInBody('.nb'));
  let a = topLevel(sel.anchorNode), b = topLevel(sel.focusNode);
  if (sel.anchorNode === ed.body) a = b = ed.body.children[Math.max(0, sel.anchorOffset - 1)] || null;
  // texte « nu » au premier niveau : l'envelopper d'abord dans une ligne
  if (a && a.nodeType === 3) { const d = document.createElement('div'); a.before(d); d.appendChild(a); a = b = d; }
  const blk = document.createElement('div'); blk.className = 'nb'; blk.dataset.c = 'default';
  if (!a || (ed.body.textContent.trim() === '' && !ed.body.querySelector('img'))) {
    ed.body.innerHTML = ''; blk.innerHTML = '<div><br></div>'; ed.body.appendChild(blk);
    ed.body.appendChild(Object.assign(document.createElement('div'), { innerHTML: '<br>' }));
  } else {
    if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) [a, b] = [b, a];
    const els = []; for (let n = a; n; n = n.nextSibling) { els.push(n); if (n === b) break; }
    a.before(blk);
    for (const el of els) {
      if (el.nodeType === 1 && el.classList.contains('nb')) { while (el.firstChild) blk.appendChild(el.firstChild); el.remove(); }
      else if (el.nodeType === 3) { const d = document.createElement('div'); d.appendChild(el); blk.appendChild(d); }
      else blk.appendChild(el);
    }
    if (!blk.nextElementSibling) blk.after(Object.assign(document.createElement('div'), { innerHTML: '<br>' }));
  }
  placeCaretIn(blk.lastElementChild || blk);
  saveRange(); markDirty(); relayout();
}
// Entrée sur une ligne vide en fin de bloc : sortir du bloc
ed.body.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.shiftKey) return;
  const blk = closestInBody('.nb'); if (!blk || closestInBody('li')) return;
  const line = topLevelInBlock(getSelection().anchorNode, blk);
  if (line && line === blk.lastElementChild && line.textContent === '' && !line.querySelector('img') && blk.children.length > 1) {
    e.preventDefault();
    line.remove();
    const d = document.createElement('div'); d.innerHTML = '<br>'; blk.after(d); placeCaretIn(d, false);
    markDirty(); relayout();
  }
});
function topLevelInBlock(node, blk) { let n = node?.nodeType === 1 ? node : node?.parentElement; while (n && n.parentElement !== blk) n = n.parentElement; return n; }

function blockMenu(blk) {
  const sw = (c) => `<button class="sw${(blk.dataset.c || 'default') === c ? ' active' : ''}" data-col="${c}" style="background:${c === 'default' ? 'var(--surface-2)' : `var(--n-${c})`}"></button>`;
  openSheet(`<h3>Bloc</h3><div class="drawer-label">Couleur</div><div class="sheet-row">${BLOCK_COLORS.map(sw).join('')}</div>
    <button class="sheet-item" data-a="up">${ic('back')}<span>Monter</span></button>
    <button class="sheet-item" data-a="down">${ic('back')}<span>Descendre</span></button>
    <button class="sheet-item" data-a="dup">${ic('copy')}<span>Dupliquer</span></button>
    <button class="sheet-item" data-a="unwrap">${ic('close')}<span>Retirer le cadre (garder le contenu)</span></button>
    <button class="sheet-item danger" data-a="del">${ic('trash')}<span>Supprimer le bloc</span></button>`,
  async (e) => {
    const col = e.target.closest('[data-col]');
    if (col) { blk.dataset.c = col.dataset.col; closeSheet(); markDirty(); return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    closeSheet();
    if (a === 'up' && blk.previousElementSibling) blk.previousElementSibling.before(blk);
    if (a === 'down' && blk.nextElementSibling) blk.nextElementSibling.after(blk);
    if (a === 'dup') blk.after(blk.cloneNode(true));
    if (a === 'unwrap') { while (blk.firstChild) blk.before(blk.firstChild); blk.remove(); }
    if (a === 'del') { if (!(await confirmBox('Supprimer ce bloc et son contenu ?', '', 'Supprimer'))) return; blk.remove(); }
    markDirty(); relayout();
  });
  // flèches haut/bas
  const icons = $$('#sheetCard [data-a="up"] svg, #sheetCard [data-a="down"] svg');
  icons[0].style.transform = 'rotate(90deg)'; icons[1].style.transform = 'rotate(-90deg)';
}

// Glisser un bloc par sa poignée
dragEngine(blkLayer, '.blk-h', {
  immediate: true,
  key: (el) => el.dataset.i,
  onTap(st) { const b = blockAt(st.key); if (b) blockMenu(b); },
  onStart(st, e) {
    const b = blockAt(st.key); if (!b) return false;
    normalizeTop();
    st.blk = b; st.ghost = makeGhost(b, e.clientX, e.clientY); b.classList.add('drag-src');
    st.line = Object.assign(document.createElement('div'), { className: 'blk-drop' }); blkLayer.appendChild(st.line);
  },
  onMove(st, x, y) {
    st.ghost.move(x, y); autoScroll.set(y, $('#edScroll'));
    const kids = [...ed.body.children].filter((c) => c !== st.blk);
    let before = null;
    for (const k of kids) { const r = k.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = k; break; } }
    st.before = before;
    const ref = before || kids.at(-1);
    const top = !ref ? 0 : before ? before.offsetTop - 4 : ref.offsetTop + ref.offsetHeight + 2;
    Object.assign(st.line.style, { top: top + 'px', left: ed.body.offsetLeft + 'px', width: ed.body.offsetWidth + 'px' });
  },
  onEnd(st, x, y, cancelled) {
    autoScroll.stop(); st.ghost?.remove(); st.line?.remove(); st.blk.classList.remove('drag-src');
    if (!cancelled && st.before !== st.blk.nextElementSibling) {
      if (st.before) st.before.before(st.blk); else ed.body.appendChild(st.blk);
      markDirty();
    }
    relayout();
  },
});

/* ================= Dessin à main levée ================= */
const D = { strokes: [], redo: [], tool: 'pen', color: '#1a1a1a', size: 3, cur: null, penSeen: false, dpr: 1, base: $('#drawBase'), live: $('#drawLive') };
const DRAW_COLORS = ['#1a1a1a', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ffffff'];
$('#drawColors').innerHTML = DRAW_COLORS.map((c) => `<button class="sw${c === D.color ? ' active' : ''}" style="background:${c}" data-dc="${c}"></button>`).join('');
$('#drawColors').addEventListener('click', (e) => {
  const b = e.target.closest('[data-dc]'); if (!b) return;
  D.color = b.dataset.dc; $$('#drawColors .sw').forEach((x) => x.classList.toggle('active', x === b));
  if (D.tool === 'eraser') setTool('pen');
});
$('#drawSize').addEventListener('input', (e) => { D.size = +e.target.value; });
function setTool(t) { D.tool = t; $$('.draw-tools [data-pen]').forEach((b) => b.classList.toggle('active', b.dataset.pen === t)); }
$$('.draw-tools [data-pen]').forEach((b) => { b.onclick = () => setTool(b.dataset.pen); });

function openDraw() {
  $('#draw').hidden = false;
  history.pushState({ editor: true, draw: true }, '');
  D.strokes = []; D.redo = [];
  requestAnimationFrame(() => {
    const r = $('#drawStage').getBoundingClientRect();
    D.dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [D.base, D.live]) {
      c.width = Math.round(r.width * D.dpr); c.height = Math.round(r.height * D.dpr);
      c.getContext('2d').setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
    }
  });
}
function closeDraw() { $('#draw').hidden = true; }
function strokeStyle(ctx, s) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.globalAlpha = s.tool === 'marker' ? 0.35 : 1;
  ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
}
const widthAt = (s, p) => s.tool === 'marker' ? s.size * 4 : s.tool === 'eraser' ? s.size * 5 : s.size * (0.4 + p * 1.2);
function drawStroke(ctx, s) {
  const pts = s.points;
  ctx.save(); strokeStyle(ctx, s);
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], widthAt(s, pts[0][2]) / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
  if (s.tool === 'pen') {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = i > 1 ? [(pts[i - 2][0] + pts[i - 1][0]) / 2, (pts[i - 2][1] + pts[i - 1][1]) / 2] : pts[0];
      const [x1, y1] = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2];
      ctx.lineWidth = widthAt(s, pts[i][2]);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], x1, y1); ctx.stroke();
    }
  } else {
    ctx.lineWidth = widthAt(s, 0.5);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    ctx.lineTo(pts.at(-1)[0], pts.at(-1)[1]); ctx.stroke();
  }
  ctx.restore();
}
function clearCtx(c) { const ctx = c.getContext('2d'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); return ctx; }
function redrawBase() { const ctx = clearCtx(D.base); D.strokes.forEach((s) => drawStroke(ctx, s)); }
D.live.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'pen') D.penSeen = true;
  if (D.penSeen && e.pointerType === 'touch') return; // rejet de la paume
  D.live.setPointerCapture(e.pointerId);
  const r = D.live.getBoundingClientRect();
  D.cur = { tool: D.tool, color: D.color, size: D.size, points: [[e.clientX - r.left, e.clientY - r.top, e.pointerType === 'pen' ? e.pressure : 0.5]], id: e.pointerId };
});
D.live.addEventListener('pointermove', (e) => {
  if (!D.cur || e.pointerId !== D.cur.id) return;
  const r = D.live.getBoundingClientRect();
  for (const ev of e.getCoalescedEvents?.() || [e]) D.cur.points.push([ev.clientX - r.left, ev.clientY - r.top, ev.pointerType === 'pen' ? ev.pressure : 0.5]);
  if (D.cur.tool === 'eraser') { redrawBase(); drawStroke(D.base.getContext('2d'), D.cur); }
  else drawStroke(clearCtx(D.live), D.cur);
});
const endStroke = (e) => {
  if (!D.cur || e.pointerId !== D.cur.id) return;
  D.strokes.push(D.cur); D.redo = []; D.cur = null;
  clearCtx(D.live); redrawBase();
};
D.live.addEventListener('pointerup', endStroke);
D.live.addEventListener('pointercancel', endStroke);

function exportDrawing() {
  const c = D.base, ctx = c.getContext('2d');
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (data[(y * width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const pad = Math.round(16 * D.dpr);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width, x1 + pad); y1 = Math.min(height, y1 + pad);
  const k = Math.min(1, 1400 / (x1 - x0));
  const out = document.createElement('canvas');
  out.width = Math.round((x1 - x0) * k); out.height = Math.round((y1 - y0) * k);
  out.getContext('2d').drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}
async function drawAction(a) {
  if (a === 'draw-undo') { if (D.strokes.length) { D.redo.push(D.strokes.pop()); redrawBase(); } }
  if (a === 'draw-redo') { if (D.redo.length) { D.strokes.push(D.redo.pop()); redrawBase(); } }
  if (a === 'draw-clear') { if (D.strokes.length && await confirmBox('Effacer le dessin ?', '', 'Effacer')) { D.strokes = []; D.redo = []; redrawBase(); } }
  if (a === 'draw-cancel') { if (!D.strokes.length || await confirmBox('Abandonner le dessin ?', '', 'Abandonner')) { closeDraw(); goBack(); } }
  if (a === 'draw-save') { const src = exportDrawing(); closeDraw(); goBack(); if (src) insertImage(src, 'sketch'); }
}

/* ================= Actions globales ================= */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const a = b.dataset.action;
  if (a.startsWith('sel-')) return selectionAction(a);
  if (a.startsWith('draw-')) return drawAction(a);
  switch (a) {
    case 'drawer': return openDrawer();
    case 'settings': return settingsMenu();
    case 'new-folder': { closeDrawer(); const f = await createFolder(); if (f) setView(f.id); return; }
    case 'new-note': return newNote();
    case 'search': return toggleSearch(true);
    case 'layout': S.layout = S.layout === 'grid' ? 'list' : 'grid'; pref.set('layout', S.layout); return render();
    case 'sort': return sortMenu();
    case 'ed-back': return closeEditor();
    case 'ed-undo': ed.body.focus(); document.execCommand('undo'); return markDirty();
    case 'ed-redo': ed.body.focus(); document.execCommand('redo'); return markDirty();
    case 'ed-fav': { await commitEditor(); const it = S.items.get(S.editing); await updateNote(it.id, { fav: !it.data.fav }); S.edSaved = true; updateEditorMeta(); return render(); }
    case 'ed-folder': { await commitEditor(); const it = S.items.get(S.editing); const f = await pickFolder(it.data.folder); if (f !== undefined) { await updateNote(it.id, { folder: f }); S.edSaved = true; updateEditorMeta(); render(); } return; }
    case 'ed-more': return editorMore();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#sheet').hidden) return closeSheet();
    if (!$('#draw').hidden) return drawAction('draw-cancel');
    if (!ed.root.hidden) return closeEditor();
    if (S.selecting) return exitSelection();
    if ($('#drawer').classList.contains('open')) return closeDrawer();
    if (S.search) return toggleSearch(false);
  }
  if (e.altKey && e.key.toLowerCase() === 'n' && ed.root.hidden) { e.preventDefault(); newNote(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && ed.root.hidden) { e.preventDefault(); toggleSearch(true); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !ed.root.hidden) { e.preventDefault(); commitEditor().then(() => sync()); }
});

/* ================= Cycle de vie ================= */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { commitEditor().then(() => sync()); }
  else sync();
});
window.addEventListener('online', () => sync());
window.addEventListener('offline', () => setSync('off'));
setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 30_000);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; });

async function purgeTrash() {
  const limit = Date.now() - TRASH_DAYS * 86400_000;
  for (const n of notes()) if (n.data.trashed && (n.data.trashed_at || 0) < limit) await tombstone(n.id);
}

/* Mises à jour automatiques : la nouvelle version s'applique dès que l'utilisateur
   n'est pas en train d'écrire (éditeur, dessin ou menu fermés). */
let pendingWorker = null;
const busy = () => !ed.root.hidden || !$('#draw').hidden || !$('#sheet').hidden;
function tryApplyUpdate() {
  if (!pendingWorker || busy()) return;
  const w = pendingWorker; pendingWorker = null;
  toast('Mise à jour d’ALBANOTES…', null, null, 2000);
  w.postMessage('skipWaiting');
}
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    const offer = (w) => { if (w && navigator.serviceWorker.controller) { pendingWorker = w; tryApplyUpdate(); } };
    if (reg.waiting) offer(reg.waiting); // version déjà téléchargée lors d'une session précédente
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); });
    });
    const check = () => reg.update().catch(() => {});
    setInterval(check, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    // appliquer dès la fermeture de l'éditeur / du dessin / d'un menu
    new MutationObserver(tryApplyUpdate).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  }).catch(() => {});
  // Recharger uniquement lors d'une mise à jour (pas à la toute première installation)
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true; commitEditor().finally(() => location.reload());
  });
}

// Filet de sécurité : si une erreur empêche l'affichage, le dire au lieu d'une page vide
window.addEventListener('error', (e) => {
  if (document.querySelector('.card, #login:not([hidden])')) return;
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:auto 16px 16px;z-index:999;background:#d93b3b;color:#fff;padding:14px 18px;border-radius:16px;font:14px system-ui">
    ALBANOTES n'a pas pu démarrer (${String(e.message).replace(/[<>&]/g, '')}). Fichiers incomplets sur le serveur ? Lancez « update --force ».</div>`);
});
async function init() {
  hydrateIcons();
  applyTheme();
  for (const it of await DB.all()) S.items.set(it.id, it);
  if (!['all', 'fav', 'trash'].includes(S.view) && !folderById(S.view)) S.view = 'all';
  await purgeTrash();
  render();
  if (!S.token) { showLogin(); setSync('off'); } else sync();

  // Raccourcis PWA : ?new=1, et partage Android (share_target)
  const p = new URLSearchParams(location.search);
  const parts = [p.get('text'), p.get('url')].filter(Boolean);
  if (p.has('new') || parts.length || p.has('title')) {
    history.replaceState(null, '', '/');
    if (parts.length || p.get('title')) {
      const text = parts.join('\n');
      newNote({ title: p.get('title') || '', html: text.split('\n').map((l) => `<div>${esc(l) || '<br>'}</div>`).join('') });
    } else newNote();
  }
  registerSW();
}
init();
